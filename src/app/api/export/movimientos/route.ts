import { cookies } from "next/headers";
import { decrypt } from "@/lib/sesion-core";
import { prisma } from "@/lib/prisma";

// Descarga el libro completo de movimientos en CSV. Exige sesión.
export async function GET() {
  const token = (await cookies()).get("sesion")?.value;
  const sesion = await decrypt(token);
  if (!sesion?.userId) return new Response("No autorizado", { status: 401 });

  const movimientos = await prisma.movimiento.findMany({
    orderBy: { creadoEn: "asc" },
    include: { producto: true, usuario: true, proveedor: true },
  });

  const escapar = (v: string | number) => {
    const s = String(v);
    return /[";\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };

  const filas = [
    ["Folio", "Fecha", "Tipo", "SKU", "Producto", "Cantidad", "Saldo resultante", "Motivo", "Proveedor", "Registró"].join(";"),
    ...movimientos.map((m) =>
      [
        m.id,
        m.creadoEn.toISOString().slice(0, 19).replace("T", " "),
        m.tipo,
        m.producto.sku,
        m.producto.nombre,
        m.cantidad,
        m.saldoResultante,
        m.motivo ?? "",
        m.proveedor?.nombre ?? "",
        m.usuario.nombre,
      ]
        .map(escapar)
        .join(";")
    ),
  ];

  return new Response("﻿" + filas.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="movimientos.csv"',
    },
  });
}
