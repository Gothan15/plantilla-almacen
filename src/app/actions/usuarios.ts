"use server";

import { encriptarClave } from "@/lib/claves";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

export type FormState = { error?: string } | undefined;

// La gestión de usuarios es solo para ADMIN.
async function verifyAdmin() {
  const sesion = await verifySession();
  if (sesion.rol !== "ADMIN") redirect("/panel");
  return sesion;
}

export async function crearUsuario(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await verifyAdmin();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const rol = String(formData.get("rol") ?? "ALMACENERO");

  if (!nombre || !email) return { error: "Nombre y correo son obligatorios." };
  if (password.length < 6)
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  if (rol !== "ADMIN" && rol !== "ALMACENERO")
    return { error: "Rol no válido." };

  const existe = await prisma.user.findUnique({ where: { email } });
  if (existe) return { error: "Ya hay un usuario con ese correo." };

  await prisma.user.create({
    data: { nombre, email, password: await encriptarClave(password), rol },
  });
  revalidatePath("/usuarios");
  redirect("/usuarios");
}

export async function actualizarUsuario(
  id: number,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await verifyAdmin();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const rol = String(formData.get("rol") ?? "ALMACENERO");

  if (!nombre || !email) return { error: "Nombre y correo son obligatorios." };
  if (password && password.length < 6)
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  if (rol !== "ADMIN" && rol !== "ALMACENERO")
    return { error: "Rol no válido." };

  const choque = await prisma.user.findFirst({
    where: { email, NOT: { id } },
  });
  if (choque) return { error: "Ya hay un usuario con ese correo." };

  await prisma.user.update({
    where: { id },
    data: {
      nombre,
      email,
      rol,
      ...(password ? { password: await encriptarClave(password) } : {}),
    },
  });
  revalidatePath("/usuarios");
  redirect("/usuarios");
}

export async function eliminarUsuario(id: number) {
  const sesion = await verifyAdmin();
  if (id === sesion.userId) redirect("/usuarios"); // no borrarse a uno mismo
  const conMovimientos = await prisma.movimiento.count({
    where: { usuarioId: id },
  });
  if (conMovimientos === 0) {
    await prisma.user.delete({ where: { id } });
  }
  revalidatePath("/usuarios");
  redirect("/usuarios");
}
