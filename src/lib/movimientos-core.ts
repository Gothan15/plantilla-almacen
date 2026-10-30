import "server-only";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";

// Núcleo de los movimientos, compartido por las acciones del panel,
// la API que usa la app móvil y las órdenes. Regla de oro del libro:
// ningún asiento sin actualizar la existencia, y ninguna salida que
// deje el stock en negativo.

export type DatosMovimiento = {
  tipo: string;
  productoId: number;
  cantidad: number;
  motivo: string | null;
  proveedorId: number | null;
  ordenId?: number | null;
};

export type ResultadoMovimiento = { error: string } | { saldo: number };

export function revalidarInventario(productoId?: number) {
  revalidatePath("/panel");
  revalidatePath("/productos");
  if (productoId) revalidatePath(`/productos/${productoId}`);
  revalidatePath("/movimientos");
  revalidatePath("/reportes");
  revalidatePath("/ordenes");
}

export async function aplicarMovimiento(
  d: DatosMovimiento,
  usuarioId: number
): Promise<ResultadoMovimiento> {
  if (!d.productoId) return { error: "Elige un producto." };
  if (d.tipo !== "ENTRADA" && d.tipo !== "SALIDA" && d.tipo !== "AJUSTE")
    return { error: "Tipo de movimiento no válido." };

  const producto = await prisma.producto.findUnique({
    where: { id: d.productoId },
  });
  if (!producto) return { error: "Ese producto ya no existe." };
  if (!producto.activo)
    return { error: "El producto está desactivado; actívalo antes de moverlo." };

  let delta: number;
  if (d.tipo === "ENTRADA") {
    if (d.cantidad <= 0)
      return { error: "La cantidad debe ser mayor que cero." };
    delta = d.cantidad;
  } else if (d.tipo === "SALIDA") {
    if (d.cantidad <= 0)
      return { error: "La cantidad debe ser mayor que cero." };
    if (d.cantidad > producto.existencia)
      return {
        error: `No hay suficiente existencia: quedan ${producto.existencia} ${producto.unidad}.`,
      };
    delta = -d.cantidad;
  } else {
    if (d.cantidad < 0)
      return { error: "La existencia contada no puede ser negativa." };
    delta = d.cantidad - producto.existencia;
    if (delta === 0)
      return {
        error: "El conteo coincide con el sistema; no hay ajuste que hacer.",
      };
  }

  const nuevoSaldo = producto.existencia + delta;
  await prisma.$transaction([
    prisma.producto.update({
      where: { id: d.productoId },
      data: { existencia: nuevoSaldo },
    }),
    prisma.movimiento.create({
      data: {
        tipo: d.tipo,
        productoId: d.productoId,
        cantidad: delta,
        saldoResultante: nuevoSaldo,
        motivo: d.motivo,
        proveedorId: d.tipo === "ENTRADA" ? d.proveedorId : null,
        ordenId: d.ordenId ?? null,
        usuarioId,
      },
    }),
  ]);

  revalidarInventario(d.productoId);
  return { saldo: nuevoSaldo };
}

// Traspaso entre almacenes: dos asientos TRASPASO enlazados por el
// motivo (salida en el origen, entrada en el destino). Si el producto
// no existe en el destino, se crea su ficha espejo con los mismos
// datos. Todo en una transacción: o se mueve completo o no se mueve.
export async function aplicarTraspaso(
  d: {
    productoId: number;
    cantidad: number;
    almacenDestinoId: number;
    motivo: string | null;
  },
  usuarioId: number
): Promise<{ error: string } | { saldo: number; saldoDestino: number }> {
  if (!d.productoId) return { error: "Elige un producto." };
  if (d.cantidad <= 0)
    return { error: "La cantidad debe ser mayor que cero." };
  if (!d.almacenDestinoId)
    return { error: "Elige el almacén de destino." };

  const origen = await prisma.producto.findUnique({
    where: { id: d.productoId },
    include: { almacen: true },
  });
  if (!origen) return { error: "Ese producto ya no existe." };
  if (!origen.activo)
    return { error: "El producto está desactivado; actívalo antes de moverlo." };
  if (origen.almacenId === d.almacenDestinoId)
    return { error: "El destino es el mismo almacén del producto." };
  if (d.cantidad > origen.existencia)
    return {
      error: `No hay suficiente existencia: quedan ${origen.existencia} ${origen.unidad}.`,
    };

  const destino = await prisma.almacen.findUnique({
    where: { id: d.almacenDestinoId },
  });
  if (!destino || !destino.activo)
    return { error: "El almacén de destino no está activo." };

  const sufijo = d.motivo ? ` — ${d.motivo}` : "";
  const saldoOrigen = origen.existencia - d.cantidad;

  const saldoDestino = await prisma.$transaction(async (tx) => {
    let espejo = await tx.producto.findFirst({
      where: { almacenId: destino.id, sku: origen.sku },
    });
    if (!espejo) {
      espejo = await tx.producto.create({
        data: {
          almacenId: destino.id,
          sku: origen.sku,
          codigoBarras: origen.codigoBarras,
          foto: origen.foto,
          nombre: origen.nombre,
          descripcion: origen.descripcion,
          categoriaId: origen.categoriaId,
          proveedorId: origen.proveedorId,
          unidad: origen.unidad,
          precioCosto: origen.precioCosto,
          precioVenta: origen.precioVenta,
          stockMinimo: origen.stockMinimo,
          existencia: 0,
        },
      });
    }
    const nuevoSaldoDestino = espejo.existencia + d.cantidad;
    await tx.producto.update({
      where: { id: origen.id },
      data: { existencia: saldoOrigen },
    });
    await tx.movimiento.create({
      data: {
        tipo: "TRASPASO",
        productoId: origen.id,
        cantidad: -d.cantidad,
        saldoResultante: saldoOrigen,
        motivo: `Traspaso a ${destino.nombre}${sufijo}`,
        usuarioId,
      },
    });
    await tx.producto.update({
      where: { id: espejo.id },
      data: { existencia: nuevoSaldoDestino },
    });
    await tx.movimiento.create({
      data: {
        tipo: "TRASPASO",
        productoId: espejo.id,
        cantidad: d.cantidad,
        saldoResultante: nuevoSaldoDestino,
        motivo: `Traspaso desde ${origen.almacen.nombre}${sufijo}`,
        usuarioId,
      },
    });
    return nuevoSaldoDestino;
  });

  revalidarInventario(d.productoId);
  return { saldo: saldoOrigen, saldoDestino };
}
