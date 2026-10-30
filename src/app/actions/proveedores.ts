"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

export type FormState = { error?: string } | undefined;

function leerDatos(formData: FormData) {
  return {
    nombre: String(formData.get("nombre") ?? "").trim(),
    contacto: String(formData.get("contacto") ?? "").trim() || null,
    telefono: String(formData.get("telefono") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    notas: String(formData.get("notas") ?? "").trim() || null,
  };
}

export async function crearProveedor(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await verifySession();
  const d = leerDatos(formData);
  if (!d.nombre) return { error: "El nombre es obligatorio." };
  await prisma.proveedor.create({ data: d });
  revalidatePath("/proveedores");
  redirect("/proveedores");
}

export async function actualizarProveedor(
  id: number,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await verifySession();
  const d = leerDatos(formData);
  if (!d.nombre) return { error: "El nombre es obligatorio." };
  await prisma.proveedor.update({ where: { id }, data: d });
  revalidatePath("/proveedores");
  redirect("/proveedores");
}

export async function eliminarProveedor(id: number) {
  await verifySession();
  // Solo se borra si no está referenciado: con productos o con
  // movimientos en el libro se mantiene, para no perder el rastro.
  const productos = await prisma.producto.count({ where: { proveedorId: id } });
  const movimientos = await prisma.movimiento.count({
    where: { proveedorId: id },
  });
  if (productos === 0 && movimientos === 0) {
    await prisma.proveedor.delete({ where: { id } });
  }
  revalidatePath("/proveedores");
}
