import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { almacenActualId } from "@/lib/almacen-actual";
import { fechaHora, folio } from "@/lib/formato";
import { Encabezado, claseBotonPrincipal } from "@/components/ui";

const LIMITE = 50;

export default async function MovimientosPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; producto?: string }>;
}) {
  const { tipo, producto } = await searchParams;
  const almacenId = await almacenActualId();

  const [productos, movimientos, total] = await Promise.all([
    prisma.producto.findMany({ orderBy: { nombre: "asc" }, select: { id: true, sku: true, nombre: true } }),
    prisma.movimiento.findMany({
      where: {
        ...(tipo ? { tipo: tipo as "ENTRADA" | "SALIDA" | "AJUSTE" | "TRASPASO" } : {}),
        ...(almacenId && !producto ? { producto: { almacenId } } : {}),
        ...(producto ? { productoId: Number(producto) } : {}),
      },
      orderBy: { creadoEn: "desc" },
      take: LIMITE,
      include: { producto: true, usuario: true, proveedor: true },
    }),
    prisma.movimiento.count(),
  ]);

  return (
    <div>
      <Encabezado
        titulo="Libro de movimientos"
        descripcion={`${total} registros en total · cada movimiento queda firmado por quien lo hizo`}
      >
        <a href="/api/export/movimientos" className="rounded-md border border-borde bg-white px-4 py-2 text-sm font-medium hover:border-tinta-suave">
          Exportar CSV
        </a>
        <Link href="/movimientos/nuevo" className={claseBotonPrincipal}>
          + Registrar movimiento
        </Link>
      </Encabezado>

      <form method="get" className="mb-4 flex flex-wrap gap-2">
        <select name="tipo" defaultValue={tipo ?? ""} className="w-auto rounded-md border border-borde bg-white px-3 py-2 text-sm">
          <option value="">Entradas, salidas y ajustes</option>
          <option value="ENTRADA">Solo entradas</option>
          <option value="SALIDA">Solo salidas</option>
          <option value="AJUSTE">Solo ajustes</option>
          <option value="TRASPASO">Solo traspasos</option>
        </select>
        <select name="producto" defaultValue={producto ?? ""} className="w-auto max-w-full rounded-md border border-borde bg-white px-3 py-2 text-sm">
          <option value="">Todos los productos</option>
          {productos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.sku} — {p.nombre}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md border border-borde bg-white px-4 py-2 text-sm font-medium hover:border-tinta-suave">
          Filtrar
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-borde bg-white">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-borde bg-papel text-xs tracking-wide text-tinta-suave uppercase">
              <th className="px-4 py-3 font-semibold">Folio</th>
              <th className="px-4 py-3 font-semibold">Fecha</th>
              <th className="px-4 py-3 font-semibold">Producto</th>
              <th className="px-4 py-3 font-semibold">Tipo</th>
              <th className="px-4 py-3 text-right font-semibold">Cantidad</th>
              <th className="px-4 py-3 text-right font-semibold">Saldo</th>
              <th className="px-4 py-3 font-semibold">Motivo</th>
              <th className="px-4 py-3 font-semibold">Registró</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {movimientos.map((m) => (
              <tr key={m.id} className="hover:bg-papel">
                <td className="px-4 py-2.5 font-mono text-xs">{folio(m.id)}</td>
                <td className="px-4 py-2.5 whitespace-nowrap">{fechaHora(m.creadoEn)}</td>
                <td className="px-4 py-2.5">
                  <Link href={`/productos/${m.productoId}`} className="font-medium hover:underline">
                    {m.producto.nombre}
                  </Link>
                  <span className="block font-mono text-xs text-tinta-suave">{m.producto.sku}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded px-1.5 py-0.5 font-mono text-[11px] font-bold ${
                      m.tipo === "ENTRADA"
                        ? "bg-verde-claro text-verde"
                        : m.tipo === "SALIDA"
                          ? "bg-rojo-claro text-rojo"
                          : m.tipo === "TRASPASO"
                            ? "bg-tinta text-white"
                            : "bg-ambar-claro text-ambar"
                    }`}
                  >
                    {m.tipo}
                  </span>
                </td>
                <td className={`px-4 py-2.5 text-right font-mono font-bold ${m.cantidad > 0 ? "text-verde" : m.cantidad < 0 ? "text-rojo" : ""}`}>
                  {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                </td>
                <td className="px-4 py-2.5 text-right font-mono">{m.saldoResultante}</td>
                <td className="px-4 py-2.5 text-tinta-suave">
                  {m.motivo ?? "—"}
                  {m.proveedor && <span className="block text-xs">{m.proveedor.nombre}</span>}
                </td>
                <td className="px-4 py-2.5">{m.usuario.nombre}</td>
              </tr>
            ))}
            {movimientos.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-tinta-suave">
                  No hay movimientos con ese filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {total > LIMITE && (
        <p className="mt-3 text-xs text-tinta-suave">
          Mostrando los {LIMITE} más recientes de {total}. Para el historial
          completo usa Exportar CSV.
        </p>
      )}
    </div>
  );
}
