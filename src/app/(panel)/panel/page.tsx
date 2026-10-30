import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUsuarioActual } from "@/lib/dal";
import { dinero, entero, estadoStock, fechaHora, folio } from "@/lib/formato";
import { Semaforo, claseBotonPrincipal } from "@/components/ui";

function inicioDelDia(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default async function PanelPage() {
  await connection(); // el panel es "hoy": siempre en vivo
  const usuario = await getUsuarioActual();
  const hoy = inicioDelDia(new Date());
  const hace7 = new Date(hoy);
  hace7.setDate(hace7.getDate() - 6);

  const [productos, movimientosHoy, ultimos, semana] = await Promise.all([
    prisma.producto.findMany({
      where: { activo: true },
      include: { categoria: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.movimiento.count({ where: { creadoEn: { gte: hoy } } }),
    prisma.movimiento.findMany({
      take: 8,
      orderBy: { creadoEn: "desc" },
      include: { producto: true, usuario: true },
    }),
    prisma.movimiento.findMany({
      where: { creadoEn: { gte: hace7 } },
      select: { tipo: true, cantidad: true, creadoEn: true },
    }),
  ]);

  const unidades = productos.reduce((s, p) => s + p.existencia, 0);
  const valor = productos.reduce(
    (s, p) => s + p.existencia * Number(p.precioCosto),
    0
  );
  const alertas = productos
    .filter((p) => estadoStock(p.existencia, p.stockMinimo) !== "ok")
    .sort((a, b) => a.existencia - b.existencia);

  // Serie de 7 días: unidades que entraron y salieron por día.
  const dias: { etiqueta: string; entradas: number; salidas: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(hace7);
    d.setDate(d.getDate() + i);
    dias.push({
      etiqueta: d.toLocaleDateString("es-CU", { weekday: "narrow" }),
      entradas: 0,
      salidas: 0,
    });
  }
  for (const m of semana) {
    const idx = Math.floor(
      (inicioDelDia(m.creadoEn).getTime() - hace7.getTime()) / 86_400_000
    );
    if (idx < 0 || idx > 6) continue;
    if (m.cantidad > 0) dias[idx].entradas += m.cantidad;
    if (m.cantidad < 0) dias[idx].salidas += -m.cantidad;
  }
  const maxDia = Math.max(1, ...dias.map((d) => Math.max(d.entradas, d.salidas)));

  const kpis = [
    { etiqueta: "Productos activos", valor: entero(productos.length), nota: "en el catálogo" },
    { etiqueta: "Unidades en existencia", valor: entero(unidades), nota: "suma de todos los productos" },
    { etiqueta: "Valor del inventario", valor: `${dinero(valor)} CUP`, nota: "a precio de costo" },
    { etiqueta: "Movimientos de hoy", valor: entero(movimientosHoy), nota: "entradas, salidas y ajustes" },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Hola, {usuario.nombre.split(" ")[0]}
          </h1>
          <p className="mt-0.5 text-sm text-tinta-suave">
            Esto es lo que necesita atención en el almacén hoy.
          </p>
        </div>
        <Link href="/movimientos/nuevo" className={claseBotonPrincipal}>
          + Registrar movimiento
        </Link>
      </div>

      {/* Primero las excepciones: lo que hay que resolver */}
      <section className="mb-6 rounded-lg border border-borde bg-white">
        <div className="flex items-center gap-2 border-b border-borde px-4 py-3">
          <span className={`h-2 w-2 rounded-full ${alertas.length ? "bg-rojo" : "bg-verde"}`} />
          <h2 className="text-sm font-bold tracking-wide uppercase">
            Necesita atención ({alertas.length})
          </h2>
        </div>
        {alertas.length === 0 ? (
          <p className="px-4 py-4 text-sm text-tinta-suave">
            Ningún producto está por debajo de su stock mínimo. Buen trabajo.
          </p>
        ) : (
          <ul className="divide-y divide-borde">
            {alertas.slice(0, 6).map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                <Semaforo existencia={p.existencia} stockMinimo={p.stockMinimo} />
                <Link href={`/productos/${p.id}`} className="min-w-[150px] flex-1 truncate text-sm font-medium hover:underline">
                  {p.nombre}
                  <span className="ml-2 font-mono text-xs text-tinta-suave">{p.sku}</span>
                </Link>
                <span className="font-mono text-sm">
                  {p.existencia} / mín. {p.stockMinimo} {p.unidad}
                </span>
                <Link
                  href={`/movimientos/nuevo?producto=${p.id}&tipo=ENTRADA`}
                  className="text-sm font-semibold text-verde hover:underline"
                >
                  Registrar entrada
                </Link>
              </li>
            ))}
          </ul>
        )}
        {alertas.length > 6 && (
          <p className="border-t border-borde px-4 py-2 text-xs text-tinta-suave">
            Y {alertas.length - 6} más en{" "}
            <Link href="/productos?estado=bajo" className="font-semibold underline">
              Productos
            </Link>
            .
          </p>
        )}
      </section>

      {/* Cifras generales */}
      <section className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.etiqueta} className="rounded-lg border border-borde bg-white px-4 py-3">
            <p className="text-[11px] font-semibold tracking-wide text-tinta-suave uppercase">
              {k.etiqueta}
            </p>
            <p className="mt-1 font-mono text-2xl font-bold">{k.valor}</p>
            <p className="text-xs text-tinta-suave">{k.nota}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Flujo de la semana */}
        <section className="rounded-lg border border-borde bg-white px-4 py-3">
          <h2 className="mb-3 text-sm font-bold tracking-wide uppercase">
            Flujo de los últimos 7 días
          </h2>
          <div className="flex h-36 items-end gap-2">
            {dias.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-24 w-full items-end justify-center gap-1">
                  <div
                    className="w-2.5 rounded-t bg-verde"
                    style={{ height: `${(d.entradas / maxDia) * 100}%` }}
                    title={`Entraron ${d.entradas}`}
                  />
                  <div
                    className="w-2.5 rounded-t bg-rojo"
                    style={{ height: `${(d.salidas / maxDia) * 100}%` }}
                    title={`Salieron ${d.salidas}`}
                  />
                </div>
                <span className="font-mono text-[10px] text-tinta-suave">{d.etiqueta}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-4 text-xs text-tinta-suave">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-verde" /> Entradas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-rojo" /> Salidas
            </span>
          </div>
        </section>

        {/* Últimos movimientos del libro */}
        <section className="overflow-hidden rounded-lg border border-borde bg-white">
          <div className="flex items-center justify-between border-b border-borde px-4 py-3">
            <h2 className="text-sm font-bold tracking-wide uppercase">
              Últimos movimientos
            </h2>
            <Link href="/movimientos" className="text-sm font-semibold text-ambar hover:underline">
              Ver el libro completo
            </Link>
          </div>
          {ultimos.length === 0 ? (
            <p className="px-4 py-4 text-sm text-tinta-suave">
              Todavía no hay movimientos registrados.
            </p>
          ) : (
            <ul className="divide-y divide-borde">
              {ultimos.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="font-mono text-xs text-tinta-suave">{folio(m.id)}</span>
                  <span
                    className={`font-mono font-bold ${
                      m.cantidad > 0 ? "text-verde" : m.cantidad < 0 ? "text-rojo" : "text-tinta-suave"
                    }`}
                  >
                    {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {m.producto.nombre}
                    <span className="block text-xs text-tinta-suave">
                      {m.usuario.nombre} · {fechaHora(m.creadoEn)}
                    </span>
                  </span>
                  <span className="font-mono text-xs text-tinta-suave">
                    saldo {m.saldoResultante}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
