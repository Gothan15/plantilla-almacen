"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

export type FormState = { error?: string } | undefined;

function leerDatos(formData: FormData) {
  return {
    sku: String(formData.get("sku") ?? "").trim().toUpperCase(),
    codigoBarras:
      String(formData.get("codigoBarras") ?? "").trim() || null,
    nombre: String(formData.get("nombre") ?? "").trim(),
    descripcion: String(formData.get("descripcion") ?? "").trim() || null,
    categoriaId: Number(formData.get("categoriaId")),
    proveedorId: Number(formData.get("proveedorId")) || null,
    unidad: String(formData.get("unidad") ?? "u").trim() || "u",
    precioCosto: Number(formData.get("precioCosto")) || 0,
    precioVenta: Number(formData.get("precioVenta")) || 0,
    stockMinimo: Math.max(0, Math.trunc(Number(formData.get("stockMinimo")) || 0)),
    ubicacion: String(formData.get("ubicacion") ?? "").trim() || null,
  };
}

function validar(d: ReturnType<typeof leerDatos>): string | null {
  if (!d.sku) return "El código (SKU) es obligatorio.";
  if (!d.nombre) return "El nombre es obligatorio.";
  if (!d.categoriaId) return "Elige una categoría.";
  if (d.precioCosto < 0 || d.precioVenta < 0)
    return "Los precios no pueden ser negativos.";
  return null;
}

export async function crearProducto(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await verifySession();
  const d = leerDatos(formData);
  const error = validar(d);
  if (error) return { error };

  const existe = await prisma.producto.findUnique({ where: { sku: d.sku } });
  if (existe) return { error: `Ya hay un producto con el código ${d.sku}.` };

  if (d.codigoBarras) {
    const conEse = await prisma.producto.findUnique({
      where: { codigoBarras: d.codigoBarras },
    });
    if (conEse)
      return { error: `El código de barras ya pertenece a ${conEse.nombre}.` };
  }

  // La existencia inicial entra como primer movimiento del libro,
  // para que el historial cuadre desde el primer día.
  const sesion = await verifySession();
  const creado = await prisma.producto.create({ data: { ...d, existencia: 0 } });
  const inicial = Math.max(
    0,
    Math.trunc(Number(formData.get("existenciaInicial")) || 0)
  );
  if (inicial > 0) {
    await prisma.$transaction([
      prisma.producto.update({
        where: { id: creado.id },
        data: { existencia: inicial },
      }),
      prisma.movimiento.create({
        data: {
          tipo: "ENTRADA",
          productoId: creado.id,
          cantidad: inicial,
          saldoResultante: inicial,
          motivo: "Existencia inicial",
          usuarioId: sesion.userId,
        },
      }),
    ]);
  }

  revalidatePath("/productos");
  redirect("/productos");
}

export async function actualizarProducto(
  id: number,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await verifySession();
  const d = leerDatos(formData);
  const error = validar(d);
  if (error) return { error };

  const choque = await prisma.producto.findFirst({
    where: { sku: d.sku, NOT: { id } },
  });
  if (choque) return { error: `Ya hay un producto con el código ${d.sku}.` };

  if (d.codigoBarras) {
    const conEse = await prisma.producto.findFirst({
      where: { codigoBarras: d.codigoBarras, NOT: { id } },
    });
    if (conEse)
      return { error: `El código de barras ya pertenece a ${conEse.nombre}.` };
  }

  await prisma.producto.update({ where: { id }, data: d });
  revalidatePath("/productos");
  revalidatePath(`/productos/${id}`);
  redirect(`/productos/${id}`);
}

export async function eliminarProducto(id: number) {
  const sesion = await verifySession();
  if (sesion.rol !== "ADMIN") {
    redirect("/productos");
  }
  // Con historial no se borra: se desactiva, para no romper el libro.
  const conMovimientos = await prisma.movimiento.count({
    where: { productoId: id },
  });
  if (conMovimientos > 0) {
    await prisma.producto.update({
      where: { id },
      data: { activo: false },
    });
  } else {
    await prisma.producto.delete({ where: { id } });
  }
  revalidatePath("/productos");
  redirect("/productos");
}

export async function reactivarProducto(id: number) {
  await verifySession();
  await prisma.producto.update({ where: { id }, data: { activo: true } });
  revalidatePath("/productos");
  revalidatePath(`/productos/${id}`);
}
