import { prisma } from "@/lib/prisma";
import ProductoForm from "@/components/ProductoForm";
import { Encabezado } from "@/components/ui";
import { crearProducto } from "@/app/actions/productos";

export default async function NuevoProductoPage() {
  const [categorias, proveedores] = await Promise.all([
    prisma.categoria.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true } }),
    prisma.proveedor.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true } }),
  ]);

  return (
    <div>
      <Encabezado
        titulo="Nuevo producto"
        descripcion="La existencia inicial queda registrada como la primera entrada del libro."
      />
      {categorias.length === 0 ? (
        <p className="rounded-md bg-ambar-claro px-3 py-2 text-sm">
          Primero crea al menos una categoría en la sección Categorías.
        </p>
      ) : (
        <ProductoForm accion={crearProducto} categorias={categorias} proveedores={proveedores} />
      )}
    </div>
  );
}
