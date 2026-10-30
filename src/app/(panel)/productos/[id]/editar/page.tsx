import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductoForm from "@/components/ProductoForm";
import { Encabezado } from "@/components/ui";
import { actualizarProducto } from "@/app/actions/productos";

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [producto, categorias, proveedores] = await Promise.all([
    prisma.producto.findUnique({ where: { id: Number(id) } }),
    prisma.categoria.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true } }),
    prisma.proveedor.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true } }),
  ]);
  if (!producto) notFound();

  return (
    <div>
      <Encabezado titulo={`Editar ${producto.nombre}`} descripcion={`Código ${producto.sku}`} />
      <ProductoForm
        accion={actualizarProducto.bind(null, producto.id)}
        esEdicion
        categorias={categorias}
        proveedores={proveedores}
        inicial={{
          sku: producto.sku,
          codigoBarras: producto.codigoBarras,
          foto: producto.foto,
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          categoriaId: producto.categoriaId,
          proveedorId: producto.proveedorId,
          unidad: producto.unidad,
          precioCosto: producto.precioCosto.toString(),
          precioVenta: producto.precioVenta.toString(),
          existencia: producto.existencia,
          stockMinimo: producto.stockMinimo,
          ubicacion: producto.ubicacion,
        }}
      />
    </div>
  );
}
