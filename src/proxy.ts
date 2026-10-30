import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/sesion-core";

// En Next.js 16 el middleware se llama proxy. Hace la comprobación
// rápida: sin cookie de sesión válida no se entra al panel. La
// comprobación segura de verdad está en el DAL (lib/dal.ts).
const RUTAS_PROTEGIDAS = [
  "/panel",
  "/escanear",
  "/productos",
  "/movimientos",
  "/categorias",
  "/proveedores",
  "/reportes",
  "/usuarios",
];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const esProtegida = RUTAS_PROTEGIDAS.some(
    (ruta) => path === ruta || path.startsWith(ruta + "/")
  );

  const sesion = await decrypt(req.cookies.get("sesion")?.value);

  if (esProtegida && !sesion?.userId) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
  if (path === "/login" && sesion?.userId) {
    return NextResponse.redirect(new URL("/panel", req.nextUrl));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
