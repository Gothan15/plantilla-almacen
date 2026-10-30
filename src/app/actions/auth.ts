"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { crearSesion, borrarSesion } from "@/lib/session";

export type LoginState = { error?: string } | undefined;

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Escribe tu correo y tu contraseña." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "Correo o contraseña incorrectos." };
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return { error: "Correo o contraseña incorrectos." };
  }

  await crearSesion(user.id, user.rol);
  redirect("/panel");
}

export async function logout() {
  await borrarSesion();
  redirect("/login");
}
