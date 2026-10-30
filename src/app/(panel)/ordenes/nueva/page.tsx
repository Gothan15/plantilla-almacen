import { prisma } from "@/lib/prisma";
import { almacenActualId } from "@/lib/almacen-actual";
import OrdenForm, { type ProductoOrden } from "@/components/OrdenForm";
import { Encabezado } from "@/components/ui";
import { crearOrden } from "@/app/actions/ordenes";

export default async function NuevaOrdenPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo: tipoParam } = await searchParams;
  const tipo = tipoParam === "VENTA" ? "VENTA" : "COMPRA";
  const almacenId = await almacenActualId();

  const [productosCrudos, proveedores] = await Promise.all([
    prisma.producto.findMany({
      where: { activo: true, ...(almacenId ? { almacenId } : {}) },
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
        titulo={tipo === "COMPRA" ? "Nueva orden de compra" : "Nueva orden de venta"}
        descripcion={
          tipo === "COMPRA"
            ? "Lo que se va a pedir a un proveedor. Al confirmarla, la mercancía entra en el almacén."
            : "Lo que se va a vender a un cliente. Al confirmarla, la mercancía sale del almacén."
        }
      />
      {productos.length === 0 ? (
        <p className="rounded-md bg-ambar-claro px-3 py-2 text-sm">
          Todavía no hay productos activos en el almacén que estás viendo.
        </p>
      ) : (
        <OrdenForm accion={crearOrden} tipo={tipo} productos={productos} proveedores={proveedores} />
      )}
    </div>
  );
}
