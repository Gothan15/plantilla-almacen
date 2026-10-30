import { cookies } from "next/headers";
import { decrypt } from "@/lib/sesion-core";
import { aplicarMovimiento } from "@/lib/movimientos-core";

// Registra un movimiento rápido por JSON. Lo usa la cola offline de
// la página de escaneo: el teléfono guarda los movimientos sin
// conexión y los envía por aquí cuando vuelve la red. Mismas reglas
// que el panel (nada de salidas sin existencia) y firmado con la
// sesión de quien lo envía. Exige sesión: sin cookie, 401.
export async function POST(req: Request) {
  const token = (await cookies()).get("sesion")?.value;
  const sesion = await decrypt(token);
  if (!sesion?.userId)
    return Response.json({ error: "No autorizado" }, { status: 401 });

  let datos: {
    productoId?: number;
    tipo?: string;
    cantidad?: number;
    motivo?: string | null;
  };
  try {
    datos = await req.json();
  } catch {
    return Response.json({ error: "Cuerpo no válido" }, { status: 400 });
  }

  const resultado = await aplicarMovimiento(
    {
      tipo: String(datos.tipo ?? ""),
      productoId: Number(datos.productoId) || 0,
      cantidad: Math.trunc(Number(datos.cantidad) || 0),
      motivo: datos.motivo?.toString().trim() || null,
      proveedorId: null,
    },
    sesion.userId
  );

  if ("error" in resultado) return Response.json({ error: resultado.error });
  return Response.json({ ok: true, saldo: resultado.saldo });
}
