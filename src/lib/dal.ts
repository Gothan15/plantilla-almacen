import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { leerSesion } from "./session";

// Capa de acceso a datos: aquí se comprueba la sesión antes
// de tocar la base de datos. Úsala en páginas y en acciones.

export const verifySession = cache(async () => {
  const sesion = await leerSesion();
  if (!sesion?.userId) {
    redirect("/login");
  }
  return sesion;
});

export const getUsuarioActual = cache(async () => {
  const sesion = await verifySession();
  const user = await prisma.user.findUnique({
    where: { id: sesion.userId },
    select: { id: true, nombre: true, email: true, rol: true },
  });
  if (!user) {
    redirect("/login");
  }
  return user;
});
