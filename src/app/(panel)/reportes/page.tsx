import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { dinero, entero, fechaCorta } from "@/lib/formato";
import { Encabezado } from "@/components/ui";

export default async function ReportesPage() {
  await connection(); // la página depende de la fecha actual: siempre en vivo
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const hace30 = new Date(ahora);
  hace30.setDate(hace30.getDate() - 30);

  const [productos, movimientosMes, ultimosPorProducto] = await Promise.all([
    prisma.producto.findMany({
      where: { activo: true },
      include: { categoria: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.movimiento.findMany({
      where: { creadoEn: { gte: inicioMes } },
      select: { tipo: true, cantidad: true },
    }),
    prisma.movimiento.groupBy({
      by: ["productoId"],
      _max: { creadoEn: true },
    }),
  ]);

  // Valor por categoría
  const porCategoria = new Map<string, { productos: number; unidades: number; valor: number }>();
  for (const p of productos) {
    const k = p.categoria.nombre;
    const fila = porCategoria.get(k) ?? { productos: 0, unidades: 0, valor: 0 };
    fila.productos += 1;
    fila.unidades += p.existencia;
    fila.valor += p.existencia * Number(p.precioCosto);
    porCategoria.set(k, fila);
  }
  const categorias = [...porCategoria.entries()].sort((a, b) => b[1].valor - a[1].valor);
  const valorTotal = categorias.reduce((s, [, f]) => s + f.valor, 0);

  // Top por valor en almacén
  const top = [...productos]
    .sort((a, b) => b.existencia * Number(b.precioCosto) - a.existencia * Number(a.precioCosto))
    .slice(0, 5);

  // Resumen del mes
  let entradasMes = 0;
  let salidasMes = 0;
  let ajustesMes = 0;
  for (const m of movimientosMes) {
    if (m.tipo === "ENTRADA") entradasMes += m.cantidad;
    else if (m.tipo === "SALIDA") salidasMes += -m.cantidad;
    else ajustesMes += 1;
  }

  // Sin movimiento en 30 días (o nunca)
  const ultimoMap = new Map(ultimosPorProducto.map((g) => [g.productoId, g._max.creadoEn]));
  const sinMovimiento = productos.filter((p) => {
    const u = ultimoMap.get(p.id);
    return !u || u < hace30;
  });

  return (
    <div>
      <Encabezado
        titulo="Reportes"
        descripcion="Las cuentas claras del almacén, sin salir de la aplicación"
      >
        <a href="/api/export/productos" className="rounded-md border border-borde bg-white px-4 py-2 text-sm font-medium hover:border-tinta-suave">
          Inventario en CSV
        </a>
        <a href="/api/export/movimientos" className="rounded-md border border-borde bg-white px-4 py-2 text-sm font-medium hover:border-tinta-suave">
          Movimientos en CSV
        </a>
      </Encabezado>

      <section className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-borde bg-white px-4 py-3">
          <p className="text-[11px] font-semibold tracking-wide text-tinta-suave uppercase">Entradas del mes</p>
          <p className="mt-1 font-mono text-2xl font-bold text-verde">+{entero(entradasMes)}</p>
          <p className="text-xs text-tinta-suave">unidades recibidas</p>
        </div>
        <div className="rounded-lg border border-borde bg-white px-4 py-3">
          <p className="text-[11px] font-semibold tracking-wide text-tinta-suave uppercase">Salidas del mes</p>
          <p className="mt-1 font-mono text-2xl font-bold text-rojo">−{entero(salidasMes)}</p>
          <p className="text-xs text-tinta-suave">unidades entregadas</p>
        </div>
        <div className="rounded-lg border border-borde bg-white px-4 py-3">
          <p className="text-[11px] font-semibold tracking-wide text-tinta-suave uppercase">Ajustes del mes</p>
          <p className="mt-1 font-mono text-2xl font-bold">{entero(ajustesMes)}</p>
          <p className="text-xs text-tinta-suave">correcciones de conteo</p>
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section className="overflow-hidden rounded-lg border border-borde bg-white">
          <h2 className="border-b border-borde px-4 py-3 text-sm font-bold tracking-wide uppercase">
            Valor por categoría
          </h2>
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-borde">
              {categorias.map(([nombre, f]) => (
                <tr key={nombre}>
                  <td className="px-4 py-2.5 font-medium">{nombre}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-tinta-suave">
                    {f.productos} prod. · {entero(f.unidades)} u
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-semibold">{dinero(f.valor)}</td>
                </tr>
              ))}
              <tr className="bg-papel font-bold">
                <td className="px-4 py-2.5" colSpan={2}>Total a costo</td>
                <td className="px-4 py-2.5 text-right font-mono">{dinero(valorTotal)} CUP</td>
              </tr>
            </tbody>
          </table>
        </section>

        <div className="flex flex-col gap-6">
          <section className="overflow-hidden rounded-lg border border-borde bg-white">
            <h2 className="border-b border-borde px-4 py-3 text-sm font-bold tracking-wide uppercase">
              Más valor en almacén
            </h2>
            <ul className="divide-y divide-borde">
              {top.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <Link href={`/productos/${p.id}`} className="min-w-0 flex-1 truncate font-medium hover:underline">
                    {p.nombre}
                  </Link>
                  <span className="font-mono text-xs text-tinta-suave">{p.existencia} {p.unidad}</span>
                  <span className="font-mono font-semibold">{dinero(p.existencia * Number(p.precioCosto))}</span>
                </li>
              ))}
              {top.length === 0 && <li className="px-4 py-4 text-sm text-tinta-suave">Sin productos.</li>}
            </ul>
          </section>

          <section className="overflow-hidden rounded-lg border border-borde bg-white">
            <h2 className="border-b border-borde px-4 py-3 text-sm font-bold tracking-wide uppercase">
              Sin movimiento en 30 días ({sinMovimiento.length})
            </h2>
            <ul className="divide-y divide-borde">
              {sinMovimiento.slice(0, 8).map((p) => {
                const u = ultimoMap.get(p.id);
                return (
                  <li key={p.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <Link href={`/productos/${p.id}`} className="min-w-0 flex-1 truncate font-medium hover:underline">
                      {p.nombre}
                    </Link>
                    <span className="font-mono text-xs text-tinta-suave">
                      {u ? `último: ${fechaCorta(u)}` : "nunca"}
                    </span>
                    <span className="font-mono text-xs">{p.existencia} {p.unidad}</span>
                  </li>
                );
              })}
              {sinMovimiento.length === 0 && (
                <li className="px-4 py-4 text-sm text-tinta-suave">
                  Todo el inventario se ha movido en el último mes.
                </li>
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
