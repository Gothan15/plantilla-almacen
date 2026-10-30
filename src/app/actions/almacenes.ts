"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

export type FormState = { error?: string } | undefined;

// Los almacenes los gestiona solo el ADMIN, como los usuarios.
async function verificarAdmin() {
  const sesion = await verifySession();
  if (sesion.rol !== "ADMIN") redirect("/panel");
  return sesion;
}

export async function crearAlmacen(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await verificarAdmin();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;
  if (!nombre) return { error: "El nombre es obligatorio." };

  const existe = await prisma.almacen.findUnique({ where: { nombre } });
  if (existe) return { error: "Ya existe un almacén con ese nombre." };

  await prisma.almacen.create({ data: { nombre, descripcion } });
  revalidatePath("/almacenes");
  revalidatePath("/panel");
  return undefined;
}

export async function cambiarActivoAlmacen(
  id: number,
  formData: FormData
): Promise<void> {
  await verificarAdmin();
  const almacen = await prisma.almacen.findUnique({ where: { id } });
  if (!almacen) return;

  if (almacen.activo) {
    // No se desactiva un local con mercancía dentro ni el último activo.
    const conStock = await prisma.producto.count({
      where: { almacenId: id, existencia: { gt: 0 } },
    });
    if (conStock > 0) redirect("/almacenes?error=con-stock");
    const activos = await prisma.almacen.count({ where: { activo: true } });
    if (activos <= 1) redirect("/almacenes?error=ultimo");
    await prisma.almacen.update({ where: { id }, data: { activo: false } });
  } else {
    await prisma.almacen.update({ where: { id }, data: { activo: true } });
  }
  void formData;
  revalidatePath("/almacenes");
  revalidatePath("/panel");
}
