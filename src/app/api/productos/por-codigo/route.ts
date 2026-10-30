import { cookies } from "next/headers";
import { decrypt } from "@/lib/sesion-core";
import { prisma } from "@/lib/prisma";

// Busca productos por código de barras (o SKU interno). Lo usa la
// página de escaneo, en el navegador y en la app móvil. Desde la v2
// devuelve TODAS las coincidencias: el mismo código puede existir en
// varios almacenes y quien escanea elige el suyo. Exige sesión.
export async function GET(req: Request) {
  const token = (await cookies()).get("sesion")?.value;
  const sesion = await decrypt(token);
  if (!sesion?.userId) return Response.json({ error: "No autorizado" }, { status: 401 });

  const codigo = new URL(req.url).searchParams.get("codigo")?.trim();
  if (!codigo) return Response.json({ error: "Falta el código" }, { status: 400 });

  const productos = await prisma.producto.findMany({
    where: { OR: [{ codigoBarras: codigo }, { sku: codigo.toUpperCase() }] },
    include: { categoria: true, proveedor: true, almacen: true },
    orderBy: { almacenId: "asc" },
  });

  return Response.json({
    productos: productos.map((p) => ({
      id: p.id,
      sku: p.sku,
      codigoBarras: p.codigoBarras,
      foto: p.foto,
      nombre: p.nombre,
      categoria: p.categoria.nombre,
      proveedor: p.proveedor?.nombre ?? null,
      almacenId: p.almacenId,
      almacenNombre: p.almacen.nombre,
      unidad: p.unidad,
      existencia: p.existencia,
      stockMinimo: p.stockMinimo,
      ubicacion: p.ubicacion,
      activo: p.activo,
      precioCosto: p.precioCosto.toString(),
      precioVenta: p.precioVenta.toString(),
    })),
  });
}
