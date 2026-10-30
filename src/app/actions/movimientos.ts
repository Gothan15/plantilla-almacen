"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

export type FormState = { error?: string } | undefined;
export type RapidoState =
  | { error?: string; ok?: boolean; saldo?: number }
  | undefined;

type DatosMovimiento = {
  tipo: string;
  productoId: number;
  cantidad: number;
  motivo: string | null;
  proveedorId: number | null;
};

function leerDatos(formData: FormData): DatosMovimiento {
  return {
    tipo: String(formData.get("tipo") ?? ""),
    productoId: Number(formData.get("productoId")),
    cantidad: Math.trunc(Number(formData.get("cantidad")) || 0),
    motivo: String(formData.get("motivo") ?? "").trim() || null,
    proveedorId: Number(formData.get("proveedorId")) || null,
  };
}

// Núcleo compartido: valida y aplica el movimiento en una
// transacción (existencia + asiento en el libro, o ninguna de las
// dos). Devuelve el error o el saldo que quedó.
async function aplicarMovimiento(
  d: DatosMovimiento,
  usuarioId: number
): Promise<{ error: string } | { saldo: number }> {
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
    // AJUSTE: el campo cantidad trae la existencia real contada.
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
        usuarioId,
      },
    }),
  ]);

  revalidatePath("/panel");
  revalidatePath("/productos");
  revalidatePath(`/productos/${d.productoId}`);
  revalidatePath("/movimientos");
  return { saldo: nuevoSaldo };
}

export async function registrarMovimiento(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const sesion = await verifySession();
  const resultado = await aplicarMovimiento(leerDatos(formData), sesion.userId);
  if ("error" in resultado) return { error: resultado.error };
  redirect(
    formData.get("volver") === "producto"
      ? `/productos/${Number(formData.get("productoId"))}`
      : "/movimientos"
  );
}

// Variante para la página de escaneo: no redirige; devuelve el nuevo
// saldo para seguir trabajando sobre el mismo producto.
export async function registrarMovimientoRapido(
  _prev: RapidoState,
  formData: FormData
): Promise<RapidoState> {
  const sesion = await verifySession();
  const resultado = await aplicarMovimiento(leerDatos(formData), sesion.userId);
  if ("error" in resultado) return { error: resultado.error };
  return { ok: true, saldo: resultado.saldo };
}
