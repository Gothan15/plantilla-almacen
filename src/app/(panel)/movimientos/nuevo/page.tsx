import { prisma } from "@/lib/prisma";
import MovimientoForm from "@/components/MovimientoForm";
import { Encabezado } from "@/components/ui";

export default async function NuevoMovimientoPage({
  searchParams,
}: {
  searchParams: Promise<{ producto?: string; tipo?: string }>;
}) {
  const { producto, tipo } = await searchParams;
  const [productos, proveedores] = await Promise.all([
    prisma.producto.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: { id: true, sku: true, nombre: true, unidad: true, existencia: true },
    }),
    prisma.proveedor.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true } }),
  ]);

  const fijo = producto
    ? productos.find((p) => p.id === Number(producto))
    : undefined;

  return (
    <div>
      <Encabezado
        titulo="Registrar movimiento"
        descripcion="Entrada, salida o ajuste de conteo. Queda firmado con tu usuario y la hora exacta."
      />
      {productos.length === 0 ? (
        <p className="rounded-md bg-ambar-claro px-3 py-2 text-sm">
          Todavía no hay productos activos. Crea el primero en Productos.
        </p>
      ) : (
        <MovimientoForm
          productos={productos}
          proveedores={proveedores}
          productoFijo={fijo}
          tipoInicial={tipo}
        />
      )}
    </div>
  );
}
