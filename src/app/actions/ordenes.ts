"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { aplicarMovimiento } from "@/lib/movimientos-core";

export type FormState = { error?: string } | undefined;

type LineaDatos = { productoId: number; cantidad: number; precio: number };

function leerLineas(formData: FormData): LineaDatos[] {
  const productos = formData.getAll("lineaProducto").map(Number);
  const cantidades = formData.getAll("lineaCantidad").map(Number);
  const precios = formData.getAll("lineaPrecio").map(Number);
  const lineas: LineaDatos[] = [];
  for (let i = 0; i < productos.length; i++) {
    if (productos[i] && cantidades[i] > 0) {
      lineas.push({
        productoId: productos[i],
        cantidad: Math.trunc(cantidades[i]),
        precio: Math.max(0, precios[i] || 0),
      });
    }
  }
  return lineas;
}

async function validarLineas(
  lineas: LineaDatos[]
): Promise<string | null> {
  if (lineas.length === 0)
    return "Añade al menos una línea con cantidad mayor que cero.";
  const ids = [...new Set(lineas.map((l) => l.productoId))];
  const productos = await prisma.producto.findMany({
    where: { id: { in: ids } },
    select: { id: true, activo: true, nombre: true },
  });
  if (productos.length !== ids.length)
    return "Alguna línea apunta a un producto que ya no existe.";
  const inactivo = productos.find((p) => !p.activo);
  if (inactivo)
    return `El producto ${inactivo.nombre} está desactivado.`;
  return null;
}

function leerCabecera(formData: FormData) {
  const tipo = String(formData.get("tipo") ?? "");
  return {
    tipo,
    proveedorId:
      tipo === "COMPRA" ? Number(formData.get("proveedorId")) || null : null,
    cliente:
      tipo === "VENTA"
        ? String(formData.get("cliente") ?? "").trim() || null
        : null,
    notas: String(formData.get("notas") ?? "").trim() || null,
  };
}

export async function crearOrden(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const sesion = await verifySession();
  const cab = leerCabecera(formData);
  if (cab.tipo !== "COMPRA" && cab.tipo !== "VENTA")
    return { error: "Tipo de orden no válido." };
  if (cab.tipo === "COMPRA" && !cab.proveedorId)
    return { error: "Elige el proveedor de la compra." };
  if (cab.tipo === "VENTA" && !cab.cliente)
    return { error: "Escribe el nombre del cliente." };

  const lineas = leerLineas(formData);
  const error = await validarLineas(lineas);
  if (error) return { error };

  const orden = await prisma.orden.create({
    data: {
      tipo: cab.tipo,
      proveedorId: cab.proveedorId,
      cliente: cab.cliente,
      notas: cab.notas,
      usuarioId: sesion.userId,
      lineas: { create: lineas },
    },
  });
  revalidatePath("/ordenes");
  redirect(`/ordenes/${orden.id}`);
}

export async function actualizarOrden(
  id: number,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await verifySession();
  const orden = await prisma.orden.findUnique({ where: { id } });
  if (!orden) return { error: "La orden ya no existe." };
  if (orden.estado !== "BORRADOR")
    return { error: "Solo se puede editar una orden en borrador." };

  const cab = leerCabecera(formData);
  const lineas = leerLineas(formData);
  const error = await validarLineas(lineas);
  if (error) return { error };

  await prisma.$transaction([
    prisma.orden.update({
      where: { id },
      data: {
        proveedorId: cab.proveedorId,
        cliente: cab.cliente,
        notas: cab.notas,
      },
    }),
    prisma.ordenLinea.deleteMany({ where: { ordenId: id } }),
    prisma.ordenLinea.createMany({
      data: lineas.map((l) => ({ ...l, ordenId: id })),
    }),
  ]);
  revalidatePath("/ordenes");
  revalidatePath(`/ordenes/${id}`);
  redirect(`/ordenes/${id}`);
}

// Confirmar aplica la orden al stock: cada línea se convierte en un
// asiento del libro (ENTRADA en compras, SALIDA en ventas) firmado
// por quien confirma. Antes de tocar nada se valida todo, para que
// la aplicación sea completa o no sea.
export async function confirmarOrden(id: number): Promise<void> {
  const sesion = await verifySession();
  const orden = await prisma.orden.findUnique({
    where: { id },
    include: { lineas: { include: { producto: true } } },
  });
  if (!orden || orden.estado !== "BORRADOR") redirect(`/ordenes/${id}`);

  // Validación completa previa (stock agregado por producto).
  const necesario = new Map<number, number>();
  for (const l of orden.lineas) {
    if (!l.producto.activo)
      redirect(`/ordenes/${id}?error=producto-inactivo`);
    necesario.set(
      l.productoId,
      (necesario.get(l.productoId) ?? 0) + l.cantidad
    );
  }
  if (orden.tipo === "VENTA") {
    for (const [productoId, cantidad] of necesario) {
      const p = orden.lineas.find((l) => l.productoId === productoId)!.producto;
      if (cantidad > p.existencia)
        redirect(`/ordenes/${id}?error=sin-stock`);
    }
  }

  const tipoMovimiento = orden.tipo === "COMPRA" ? "ENTRADA" : "SALIDA";
  const motivo =
    orden.tipo === "COMPRA" ? `Orden de compra #${id}` : `Orden de venta #${id}`;
  for (const l of orden.lineas) {
    const r = await aplicarMovimiento(
      {
        tipo: tipoMovimiento,
        productoId: l.productoId,
        cantidad: l.cantidad,
        motivo,
        proveedorId: orden.tipo === "COMPRA" ? orden.proveedorId : null,
        ordenId: id,
      },
      sesion.userId
    );
    if ("error" in r) redirect(`/ordenes/${id}?error=sin-stock`);
  }

  await prisma.orden.update({
    where: { id },
    data: { estado: "CONFIRMADA", confirmadaEn: new Date() },
  });
  revalidatePath("/ordenes");
  revalidatePath(`/ordenes/${id}`);
  redirect(`/ordenes/${id}`);
}

export async function cancelarOrden(id: number): Promise<void> {
  await verifySession();
  const orden = await prisma.orden.findUnique({ where: { id } });
  if (orden?.estado === "BORRADOR") {
    await prisma.orden.update({ where: { id }, data: { estado: "CANCELADA" } });
  }
  revalidatePath("/ordenes");
  revalidatePath(`/ordenes/${id}`);
  redirect(`/ordenes/${id}`);
}

export async function eliminarOrden(id: number): Promise<void> {
  await verifySession();
  const orden = await prisma.orden.findUnique({ where: { id } });
  if (orden && orden.estado !== "CONFIRMADA") {
    await prisma.orden.delete({ where: { id } });
  }
  revalidatePath("/ordenes");
  redirect("/ordenes");
}
