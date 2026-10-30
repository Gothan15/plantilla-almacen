"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

export type FormState = { error?: string } | undefined;

// Registra un movimiento y actualiza la existencia en la misma
// transacción: o pasan las dos cosas o no pasa ninguna.
export async function registrarMovimiento(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const sesion = await verifySession();
  const tipo = String(formData.get("tipo") ?? "");
  const productoId = Number(formData.get("productoId"));
  const cantidad = Math.trunc(Number(formData.get("cantidad")) || 0);
  const motivo = String(formData.get("motivo") ?? "").trim() || null;
  const proveedorId = Number(formData.get("proveedorId")) || null;

  if (!productoId) return { error: "Elige un producto." };
  if (tipo !== "ENTRADA" && tipo !== "SALIDA" && tipo !== "AJUSTE")
    return { error: "Tipo de movimiento no válido." };

  const producto = await prisma.producto.findUnique({
    where: { id: productoId },
  });
  if (!producto) return { error: "Ese producto ya no existe." };
  if (!producto.activo)
    return { error: "El producto está desactivado; actívalo antes de moverlo." };

  let delta: number;
  if (tipo === "ENTRADA") {
    if (cantidad <= 0) return { error: "La cantidad debe ser mayor que cero." };
    delta = cantidad;
  } else if (tipo === "SALIDA") {
    if (cantidad <= 0) return { error: "La cantidad debe ser mayor que cero." };
    if (cantidad > producto.existencia)
      return {
        error: `No hay suficiente existencia: quedan ${producto.existencia} ${producto.unidad}.`,
      };
    delta = -cantidad;
  } else {
    // AJUSTE: el campo cantidad trae la existencia real contada.
    if (cantidad < 0)
      return { error: "La existencia contada no puede ser negativa." };
    delta = cantidad - producto.existencia;
    if (delta === 0)
      return { error: "El conteo coincide con el sistema; no hay ajuste que hacer." };
  }

  const nuevoSaldo = producto.existencia + delta;
  await prisma.$transaction([
    prisma.producto.update({
      where: { id: productoId },
      data: { existencia: nuevoSaldo },
    }),
    prisma.movimiento.create({
      data: {
        tipo,
        productoId,
        cantidad: delta,
        saldoResultante: nuevoSaldo,
        motivo,
        proveedorId: tipo === "ENTRADA" ? proveedorId : null,
        usuarioId: sesion.userId,
      },
    }),
  ]);

  revalidatePath("/panel");
  revalidatePath("/productos");
  revalidatePath(`/productos/${productoId}`);
  revalidatePath("/movimientos");
  redirect(formData.get("volver") === "producto" ? `/productos/${productoId}` : "/movimientos");
}
