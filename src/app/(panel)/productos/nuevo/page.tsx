import { prisma } from "@/lib/prisma";
import ProductoForm from "@/components/ProductoForm";
import { Encabezado } from "@/components/ui";
import { crearProducto } from "@/app/actions/productos";

export default async function NuevoProductoPage({
  searchParams,
}: {
  searchParams: Promise<{ codigoBarras?: string }>;
}) {
  const { codigoBarras } = await searchParams;
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
      {codigoBarras && (
        <p className="mb-4 max-w-2xl rounded-md bg-ambar-claro px-3 py-2 text-sm">
          Vienes del escáner: el código{" "}
          <span className="font-mono font-semibold">{codigoBarras}</span> no
          estaba registrado, así que ya viene puesto en el formulario.
        </p>
      )}
      {categorias.length === 0 ? (
        <p className="rounded-md bg-ambar-claro px-3 py-2 text-sm">
          Primero crea al menos una categoría en la sección Categorías.
        </p>
      ) : (
        <ProductoForm
          accion={crearProducto}
          categorias={categorias}
          proveedores={proveedores}
          codigoBarrasInicial={codigoBarras}
        />
      )}
    </div>
  );
}
