import { prisma } from "@/lib/prisma";
import MovimientoForm from "@/components/MovimientoForm";
import { Encabezado } from "@/components/ui";

export default async function NuevoMovimientoPage({
  searchParams,
}: {
  searchParams: Promise<{ producto?: string; tipo?: string }>;
}) {
  const { producto, tipo } = await searchParams;
  const [productosCrudos, proveedores, almacenes] = await Promise.all([
    prisma.producto.findMany({
      where: { activo: true },
      orderBy: [{ almacenId: "asc" }, { nombre: "asc" }],
      select: {
        id: true,
        sku: true,
        nombre: true,
        unidad: true,
        existencia: true,
        almacenId: true,
        almacen: { select: { nombre: true } },
      },
    }),
    prisma.proveedor.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true } }),
    prisma.almacen.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
  ]);

  const productos = productosCrudos.map((p) => ({
    id: p.id,
    sku: p.sku,
    nombre: p.nombre,
    unidad: p.unidad,
    existencia: p.existencia,
    almacenId: p.almacenId,
    almacenNombre: p.almacen.nombre,
  }));

  const fijo = producto
    ? productos.find((p) => p.id === Number(producto))
    : undefined;

  return (
    <div>
      <Encabezado
        titulo="Registrar movimiento"
        descripcion="Entrada, salida, ajuste de conteo o traspaso entre almacenes. Queda firmado con tu usuario y la hora exacta."
      />
      {productos.length === 0 ? (
        <p className="rounded-md bg-ambar-claro px-3 py-2 text-sm">
          Todavía no hay productos activos. Crea el primero en Productos.
        </p>
      ) : (
        <MovimientoForm
          productos={productos}
          proveedores={proveedores}
          almacenes={almacenes}
          productoFijo={fijo}
          tipoInicial={tipo}
        />
      )}
    </div>
  );
}
