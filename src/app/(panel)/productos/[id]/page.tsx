import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUsuarioActual } from "@/lib/dal";
import { dinero, fechaHora, folio } from "@/lib/formato";
import { Semaforo, claseBotonPrincipal, claseBotonSecundario } from "@/components/ui";
import MovimientoForm from "@/components/MovimientoForm";
import { eliminarProducto, reactivarProducto } from "@/app/actions/productos";

export default async function ProductoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productoId = Number(id);
  const usuario = await getUsuarioActual();

  const [producto, movimientos, proveedores] = await Promise.all([
    prisma.producto.findUnique({
      where: { id: productoId },
      include: { categoria: true, proveedor: true },
    }),
    prisma.movimiento.findMany({
      where: { productoId },
      orderBy: { creadoEn: "desc" },
      take: 30,
      include: { usuario: true, proveedor: true },
    }),
    prisma.proveedor.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true } }),
  ]);

  if (!producto) notFound();

  const valor = producto.existencia * Number(producto.precioCosto);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs tracking-widest text-tinta-suave">
            {producto.sku} · {producto.categoria.nombre.toUpperCase()}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{producto.nombre}</h1>
          {producto.descripcion && (
            <p className="mt-0.5 max-w-xl text-sm text-tinta-suave">{producto.descripcion}</p>
          )}
        </div>
        <Link href={`/productos/${producto.id}/editar`} className={claseBotonSecundario}>
          Editar
        </Link>
        <Link href="/productos" className={claseBotonSecundario}>
          Volver
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="rounded-lg border border-borde bg-white px-4 py-3">
          <p className="text-[11px] font-semibold tracking-wide text-tinta-suave uppercase">Existencia</p>
          <p className="mt-1 font-mono text-2xl font-bold">
            {producto.existencia} <span className="text-sm font-normal text-tinta-suave">{producto.unidad}</span>
          </p>
          <div className="mt-1">
            <Semaforo existencia={producto.existencia} stockMinimo={producto.stockMinimo} />
          </div>
        </div>
        <div className="rounded-lg border border-borde bg-white px-4 py-3">
          <p className="text-[11px] font-semibold tracking-wide text-tinta-suave uppercase">Stock mínimo</p>
          <p className="mt-1 font-mono text-2xl font-bold">{producto.stockMinimo}</p>
          <p className="text-xs text-tinta-suave">la alerta salta al llegar aquí</p>
        </div>
        <div className="rounded-lg border border-borde bg-white px-4 py-3">
          <p className="text-[11px] font-semibold tracking-wide text-tinta-suave uppercase">Costo / Venta</p>
          <p className="mt-1 font-mono text-lg font-bold">
            {dinero(producto.precioCosto.toString())} / {dinero(producto.precioVenta.toString())}
          </p>
          <p className="text-xs text-tinta-suave">CUP por {producto.unidad}</p>
        </div>
        <div className="rounded-lg border border-borde bg-white px-4 py-3">
          <p className="text-[11px] font-semibold tracking-wide text-tinta-suave uppercase">Valor en almacén</p>
          <p className="mt-1 font-mono text-2xl font-bold">{dinero(valor)}</p>
          <p className="text-xs text-tinta-suave">
            CUP · {producto.ubicacion ? `Ubicación ${producto.ubicacion}` : "sin ubicación"}
            {producto.proveedor ? ` · ${producto.proveedor.nombre}` : ""}
          </p>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="rounded-lg border border-borde bg-white px-4 py-4">
          <h2 className="mb-4 text-sm font-bold tracking-wide uppercase">
            Registrar movimiento de este producto
          </h2>
          {producto.activo ? (
            <MovimientoForm
              productos={[]}
              proveedores={proveedores}
              productoFijo={{
                id: producto.id,
                sku: producto.sku,
                nombre: producto.nombre,
                unidad: producto.unidad,
                existencia: producto.existencia,
              }}
              volver="producto"
            />
          ) : (
            <div>
              <p className="mb-3 text-sm text-tinta-suave">
                Este producto está desactivado y no admite movimientos.
              </p>
              <form action={reactivarProducto.bind(null, producto.id)}>
                <button type="submit" className={claseBotonPrincipal}>
                  Reactivar producto
                </button>
              </form>
            </div>
          )}

          {usuario.rol === "ADMIN" && producto.activo && (
            <>
              <div className="corte my-5" />
              <form action={eliminarProducto.bind(null, producto.id)}>
                <button type="submit" className="text-sm font-semibold text-rojo hover:underline">
                  Desactivar producto
                </button>
                <p className="mt-1 text-xs text-tinta-suave">
                  Con historial no se borra: se desactiva y deja de aparecer
                  como disponible, pero el libro conserva sus movimientos.
                </p>
              </form>
            </>
          )}
        </section>

        <section className="overflow-hidden rounded-lg border border-borde bg-white">
          <h2 className="border-b border-borde px-4 py-3 text-sm font-bold tracking-wide uppercase">
            Historial de este producto
          </h2>
          {movimientos.length === 0 ? (
            <p className="px-4 py-4 text-sm text-tinta-suave">Sin movimientos todavía.</p>
          ) : (
            <ul className="divide-y divide-borde">
              {movimientos.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="font-mono text-xs text-tinta-suave">{folio(m.id)}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 font-mono text-[11px] font-bold ${
                      m.tipo === "ENTRADA"
                        ? "bg-verde-claro text-verde"
                        : m.tipo === "SALIDA"
                          ? "bg-rojo-claro text-rojo"
                          : "bg-ambar-claro text-ambar"
                    }`}
                  >
                    {m.tipo}
                  </span>
                  <span className={`font-mono font-bold ${m.cantidad > 0 ? "text-verde" : m.cantidad < 0 ? "text-rojo" : ""}`}>
                    {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs text-tinta-suave">
                    {m.motivo ?? "—"}
                    <span className="block">
                      {m.usuario.nombre} · {fechaHora(m.creadoEn)}
                      {m.proveedor ? ` · ${m.proveedor.nombre}` : ""}
                    </span>
                  </span>
                  <span className="font-mono text-xs text-tinta-suave">saldo {m.saldoResultante}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
