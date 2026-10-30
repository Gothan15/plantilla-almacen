import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { dinero, fechaHora } from "@/lib/formato";
import { claseBotonSecundario } from "@/components/ui";
import {
  cancelarOrden,
  confirmarOrden,
  eliminarOrden,
} from "@/app/actions/ordenes";

const ESTILO_ESTADO: Record<string, string> = {
  BORRADOR: "bg-ambar-claro text-ambar",
  CONFIRMADA: "bg-verde-claro text-verde",
  CANCELADA: "bg-rojo-claro text-rojo",
};

const MENSAJES_ERROR: Record<string, string> = {
  "sin-stock": "No se pudo confirmar: alguna línea pide más de lo que hay en existencia. Revisa las líneas y el stock.",
  "producto-inactivo": "No se pudo confirmar: alguna línea tiene un producto desactivado.",
};

export default async function OrdenDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const orden = await prisma.orden.findUnique({
    where: { id: Number(id) },
    include: {
      proveedor: true,
      usuario: true,
      lineas: {
        include: { producto: { include: { almacen: true } } },
        orderBy: { id: "asc" },
      },
      movimientos: {
        orderBy: { creadoEn: "asc" },
        include: { producto: true, usuario: true },
      },
    },
  });
  if (!orden) notFound();

  const total = orden.lineas.reduce(
    (s, l) => s + l.cantidad * Number(l.precio),
    0
  );
  const enBorrador = orden.estado === "BORRADOR";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs tracking-widest text-tinta-suave">
            ORDEN #{orden.id} · {orden.tipo}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            {orden.tipo === "COMPRA"
              ? (orden.proveedor?.nombre ?? "Compra")
              : (orden.cliente ?? "Venta")}
          </h1>
          <p className="mt-0.5 text-sm text-tinta-suave">
            Creada por {orden.usuario.nombre} · {fechaHora(orden.creadoEn)}
            {orden.confirmadaEn
              ? ` · confirmada el ${fechaHora(orden.confirmadaEn)}`
              : ""}
          </p>
          {orden.notas && (
            <p className="mt-1 max-w-xl text-sm text-tinta-suave">{orden.notas}</p>
          )}
        </div>
        <span
          className={`rounded px-2 py-1 font-mono text-xs font-bold ${ESTILO_ESTADO[orden.estado]}`}
        >
          {orden.estado}
        </span>
        <Link href="/ordenes" className={claseBotonSecundario}>
          Volver
        </Link>
      </div>

      {error && MENSAJES_ERROR[error] && (
        <p className="mb-4 rounded-md bg-rojo-claro px-3 py-2 text-sm text-rojo">
          {MENSAJES_ERROR[error]}
        </p>
      )}

      {enBorrador && (
        <div className="mb-6 flex flex-wrap gap-2">
          <form action={confirmarOrden.bind(null, orden.id)}>
            <button
              type="submit"
              className="rounded-md bg-verde px-4 py-2 text-sm font-bold text-white transition hover:brightness-110"
            >
              {orden.tipo === "COMPRA"
                ? "Confirmar y dar entrada"
                : "Confirmar y dar salida"}
            </button>
          </form>
          <Link
            href={`/ordenes/${orden.id}/editar`}
            className={claseBotonSecundario}
          >
            Editar líneas
          </Link>
          <form action={cancelarOrden.bind(null, orden.id)}>
            <button type="submit" className={claseBotonSecundario}>
              Cancelar orden
            </button>
          </form>
          <form action={eliminarOrden.bind(null, orden.id)}>
            <button
              type="submit"
              className="rounded-md px-4 py-2 text-sm font-medium text-rojo hover:bg-rojo-claro"
            >
              Eliminar
            </button>
          </form>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-borde bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-borde bg-papel text-xs tracking-wide text-tinta-suave uppercase">
              <th className="px-4 py-3 font-semibold">Producto</th>
              <th className="px-4 py-3 font-semibold">Almacén</th>
              <th className="px-4 py-3 text-right font-semibold">Cantidad</th>
              <th className="px-4 py-3 text-right font-semibold">Precio</th>
              <th className="px-4 py-3 text-right font-semibold">Importe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {orden.lineas.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-2.5">
                  <Link
                    href={`/productos/${l.productoId}`}
                    className="font-medium hover:underline"
                  >
                    {l.producto.nombre}
                  </Link>
                  <span className="block font-mono text-xs text-tinta-suave">
                    {l.producto.sku}
                  </span>
                </td>
                <td className="px-4 py-2.5">{l.producto.almacen.nombre}</td>
                <td className="px-4 py-2.5 text-right font-mono">
                  {l.cantidad} {l.producto.unidad}
                </td>
                <td className="px-4 py-2.5 text-right font-mono">
                  {dinero(l.precio.toString())}
                </td>
                <td className="px-4 py-2.5 text-right font-mono font-semibold">
                  {dinero(l.cantidad * Number(l.precio))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-borde bg-papel">
              <td colSpan={4} className="px-4 py-3 text-right font-semibold">
                Total
              </td>
              <td className="px-4 py-3 text-right font-mono text-base font-bold">
                {dinero(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {orden.movimientos.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-bold tracking-wide uppercase">
            Asientos en el libro
          </h2>
          <div className="overflow-hidden rounded-lg border border-borde bg-white">
            {orden.movimientos.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-borde px-4 py-2.5 text-sm last:border-0"
              >
                <span className="font-mono text-xs text-tinta-suave">
                  #{m.id}
                </span>
                <span className="font-medium">{m.producto.nombre}</span>
                <span
                  className={`font-mono font-bold ${m.cantidad > 0 ? "text-verde" : "text-rojo"}`}
                >
                  {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                </span>
                <span className="text-tinta-suave">
                  saldo {m.saldoResultante} · firmado por {m.usuario.nombre} ·{" "}
                  {fechaHora(m.creadoEn)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
