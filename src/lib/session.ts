import "server-only";

import { cookies } from "next/headers";
import { encrypt, decrypt, type SesionPayload } from "./sesion-core";

export const COOKIE_SESION = "sesion";

export async function crearSesion(userId: number, rol: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const token = await encrypt({ userId, rol });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_SESION, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function leerSesion(): Promise<SesionPayload | null> {
  const token = (await cookies()).get(COOKIE_SESION)?.value;
  return decrypt(token);
}

export async function borrarSesion() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_SESION);
}
