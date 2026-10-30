import "server-only";

import { cookies } from "next/headers";

// Almacén elegido en el selector del panel, guardado en una cookie.
// null significa "Todos": las vistas muestran el negocio completo.
export async function almacenActualId(): Promise<number | null> {
  const v = (await cookies()).get("almacen")?.value;
  const n = Number(v);
  return v && Number.isFinite(n) && n > 0 ? n : null;
}
