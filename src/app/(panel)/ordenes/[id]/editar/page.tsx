import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OrdenForm, { type ProductoOrden } from "@/components/OrdenForm";
import { Encabezado } from "@/components/ui";
import { actualizarOrden } from "@/app/actions/ordenes";

export default async function EditarOrdenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orden = await prisma.orden.findUnique({
    where: { id: Number(id) },
    include: { lineas: true },
  });
  if (!orden) notFound();
  if (orden.estado !== "BORRADOR") redirect(`/ordenes/${orden.id}`);

  const [productosCrudos, proveedores] = await Promise.all([
    prisma.producto.findMany({
      where: { activo: true },
      orderBy: [{ almacenId: "asc" }, { nombre: "asc" }],
      select: {
        id: true,
        sku: true,
        nombre: true,
        unidad: true,
        existencia: true,
        precioCosto: true,
        precioVenta: true,
        almacen: { select: { nombre: true } },
      },
    }),
    prisma.proveedor.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true } }),
  ]);

  const productos: ProductoOrden[] = productosCrudos.map((p) => ({
    id: p.id,
    sku: p.sku,
    nombre: p.nombre,
    unidad: p.unidad,
    existencia: p.existencia,
    almacenNombre: p.almacen.nombre,
    precioCosto: p.precioCosto.toString(),
    precioVenta: p.precioVenta.toString(),
  }));

  return (
    <div>
      <Encabezado
        titulo={`Editar orden #${orden.id}`}
        descripcion="Solo se puede editar mientras está en borrador."
      />
      <OrdenForm
        accion={actualizarOrden.bind(null, orden.id)}
        tipo={orden.tipo}
        productos={productos}
        proveedores={proveedores}
        inicial={{
          proveedorId: orden.proveedorId,
          cliente: orden.cliente,
          notas: orden.notas,
          lineas: orden.lineas.map((l) => ({
            productoId: l.productoId,
            cantidad: l.cantidad,
            precio: Number(l.precio),
          })),
        }}
      />
    </div>
  );
}
