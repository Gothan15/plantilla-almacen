import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { dinero, fechaHora } from "@/lib/formato";
import { Encabezado, claseBotonPrincipal } from "@/components/ui";

const ESTILO_ESTADO: Record<string, string> = {
  BORRADOR: "bg-ambar-claro text-ambar",
  CONFIRMADA: "bg-verde-claro text-verde",
  CANCELADA: "bg-rojo-claro text-rojo",
};

export default async function OrdenesPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; estado?: string }>;
}) {
  const { tipo, estado } = await searchParams;
  const ordenes = await prisma.orden.findMany({
    where: {
      ...(tipo === "COMPRA" || tipo === "VENTA" ? { tipo } : {}),
      ...(estado === "BORRADOR" || estado === "CONFIRMADA" || estado === "CANCELADA"
        ? { estado }
        : {}),
    },
    orderBy: { creadoEn: "desc" },
    take: 100,
    include: {
      proveedor: true,
      usuario: true,
      lineas: true,
    },
  });

  return (
    <div>
      <Encabezado
        titulo="Órdenes"
        descripcion="Compras a proveedores y ventas a clientes. Nacen en borrador; al confirmarlas mueven el stock y quedan en el libro."
      >
        <Link href="/ordenes/nueva?tipo=COMPRA" className={claseBotonPrincipal}>
          + Nueva compra
        </Link>
        <Link href="/ordenes/nueva?tipo=VENTA" className={claseBotonPrincipal}>
          + Nueva venta
        </Link>
      </Encabezado>

      <form method="get" className="mb-4 flex flex-wrap gap-2">
        <select name="tipo" defaultValue={tipo ?? ""} className="rounded-md border border-borde bg-white px-3 py-2 text-sm">
          <option value="">Compras y ventas</option>
          <option value="COMPRA">Solo compras</option>
          <option value="VENTA">Solo ventas</option>
        </select>
        <select name="estado" defaultValue={estado ?? ""} className="rounded-md border border-borde bg-white px-3 py-2 text-sm">
          <option value="">Todos los estados</option>
          <option value="BORRADOR">Borrador</option>
          <option value="CONFIRMADA">Confirmada</option>
          <option value="CANCELADA">Cancelada</option>
        </select>
        <button type="submit" className="rounded-md border border-borde bg-white px-4 py-2 text-sm font-medium hover:border-tinta-suave">
          Filtrar
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-borde bg-white">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead>
            <tr className="border-b border-borde bg-papel text-xs tracking-wide text-tinta-suave uppercase">
              <th className="px-4 py-3 font-semibold">N.º</th>
              <th className="px-4 py-3 font-semibold">Tipo</th>
              <th className="px-4 py-3 font-semibold">Contraparte</th>
              <th className="px-4 py-3 font-semibold">Fecha</th>
              <th className="px-4 py-3 text-right font-semibold">Líneas</th>
              <th className="px-4 py-3 text-right font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {ordenes.map((o) => (
              <tr key={o.id} className="hover:bg-papel">
                <td className="px-4 py-2.5 font-mono text-xs">#{o.id}</td>
                <td className="px-4 py-2.5">
                  <span className={`rounded px-1.5 py-0.5 font-mono text-[11px] font-bold ${o.tipo === "COMPRA" ? "bg-verde-claro text-verde" : "bg-ambar-claro text-ambar"}`}>
                    {o.tipo}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <Link href={`/ordenes/${o.id}`} className="font-medium hover:underline">
                    {o.tipo === "COMPRA" ? (o.proveedor?.nombre ?? "—") : (o.cliente ?? "—")}
                  </Link>
                  <span className="block text-xs text-tinta-suave">{o.usuario.nombre}</span>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs">{fechaHora(o.creadoEn)}</td>
                <td className="px-4 py-2.5 text-right font-mono">{o.lineas.length}</td>
                <td className="px-4 py-2.5 text-right font-mono font-semibold">
                  {dinero(o.lineas.reduce((s, l) => s + l.cantidad * Number(l.precio), 0))}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`rounded px-1.5 py-0.5 font-mono text-[11px] font-bold ${ESTILO_ESTADO[o.estado]}`}>
                    {o.estado}
                  </span>
                </td>
              </tr>
            ))}
            {ordenes.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-tinta-suave">
                  No hay órdenes con esos filtros. Crea la primera con los botones de arriba.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
