import { cookies } from "next/headers";
import { decrypt } from "@/lib/sesion-core";
import { prisma } from "@/lib/prisma";

// Busca un producto por su código de barras (o por su SKU interno).
// Lo usa la página de escaneo, tanto en el navegador como en la app
// móvil. Exige sesión: sin cookie válida responde 401.
export async function GET(req: Request) {
  const token = (await cookies()).get("sesion")?.value;
  const sesion = await decrypt(token);
  if (!sesion?.userId) return Response.json({ error: "No autorizado" }, { status: 401 });

  const codigo = new URL(req.url).searchParams.get("codigo")?.trim();
  if (!codigo) return Response.json({ error: "Falta el código" }, { status: 400 });

  const producto = await prisma.producto.findFirst({
    where: { OR: [{ codigoBarras: codigo }, { sku: codigo.toUpperCase() }] },
    include: { categoria: true, proveedor: true },
  });

  if (!producto) return Response.json({ producto: null });

  return Response.json({
    producto: {
      id: producto.id,
      sku: producto.sku,
      codigoBarras: producto.codigoBarras,
      foto: producto.foto,
      nombre: producto.nombre,
      categoria: producto.categoria.nombre,
      proveedor: producto.proveedor?.nombre ?? null,
      unidad: producto.unidad,
      existencia: producto.existencia,
      stockMinimo: producto.stockMinimo,
      ubicacion: producto.ubicacion,
      activo: producto.activo,
      precioCosto: producto.precioCosto.toString(),
      precioVenta: producto.precioVenta.toString(),
    },
  });
}
