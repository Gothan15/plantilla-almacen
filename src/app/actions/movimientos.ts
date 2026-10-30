"use server";

import { redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";
import {
  aplicarMovimiento,
  aplicarTraspaso,
  type DatosMovimiento,
} from "@/lib/movimientos-core";

export type FormState = { error?: string } | undefined;
export type RapidoState =
  | { error?: string; ok?: boolean; saldo?: number }
  | undefined;

function leerDatos(formData: FormData): DatosMovimiento {
  return {
    tipo: String(formData.get("tipo") ?? ""),
    productoId: Number(formData.get("productoId")),
    cantidad: Math.trunc(Number(formData.get("cantidad")) || 0),
    motivo: String(formData.get("motivo") ?? "").trim() || null,
    proveedorId: Number(formData.get("proveedorId")) || null,
  };
}

export async function registrarMovimiento(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const sesion = await verifySession();
  const d = leerDatos(formData);

  if (d.tipo === "TRASPASO") {
    const r = await aplicarTraspaso(
      {
        productoId: d.productoId,
        cantidad: d.cantidad,
        almacenDestinoId: Number(formData.get("almacenDestinoId")) || 0,
        motivo: d.motivo,
      },
      sesion.userId
    );
    if ("error" in r) return { error: r.error };
  } else {
    const r = await aplicarMovimiento(d, sesion.userId);
    if ("error" in r) return { error: r.error };
  }

  redirect(
    formData.get("volver") === "producto"
      ? `/productos/${d.productoId}`
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
