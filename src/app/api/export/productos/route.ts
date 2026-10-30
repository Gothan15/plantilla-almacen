import { cookies } from "next/headers";
import { decrypt } from "@/lib/sesion-core";
import { prisma } from "@/lib/prisma";

// Descarga el inventario completo en CSV (para Excel / LibreOffice).
// Exige sesión: sin cookie válida responde 401.
export async function GET() {
  const token = (await cookies()).get("sesion")?.value;
  const sesion = await decrypt(token);
  if (!sesion?.userId) return new Response("No autorizado", { status: 401 });

  const productos = await prisma.producto.findMany({
    include: { categoria: true, proveedor: true },
    orderBy: [{ categoria: { nombre: "asc" } }, { nombre: "asc" }],
  });

  const escapar = (v: string | number) => {
    const s = String(v);
    return /[";\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };

  const filas = [
    ["SKU", "Producto", "Categoría", "Proveedor", "Unidad", "Ubicación", "Existencia", "Stock mínimo", "Precio costo", "Precio venta", "Valor a costo", "Activo"].join(";"),
    ...productos.map((p) =>
      [
        p.sku,
        p.nombre,
        p.categoria.nombre,
        p.proveedor?.nombre ?? "",
        p.unidad,
        p.ubicacion ?? "",
        p.existencia,
        p.stockMinimo,
        p.precioCosto.toString(),
        p.precioVenta.toString(),
        (p.existencia * Number(p.precioCosto)).toFixed(2),
        p.activo ? "Sí" : "No",
      ]
        .map(escapar)
        .join(";")
    ),
  ];

  return new Response("﻿" + filas.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="inventario.csv"',
    },
  });
}
