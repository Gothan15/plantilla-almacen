import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { almacenActualId } from "@/lib/almacen-actual";
import { dinero, estadoStock } from "@/lib/formato";
import { Encabezado, Semaforo, claseBotonPrincipal, claseInput } from "@/components/ui";

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string; estado?: string }>;
}) {
  const { q, categoria, estado } = await searchParams;
  const almacenId = await almacenActualId();

  const [categorias, productos] = await Promise.all([
    prisma.categoria.findMany({ orderBy: { nombre: "asc" } }),
    prisma.producto.findMany({
      where: {
        ...(almacenId ? { almacenId } : {}),
        ...(q
          ? {
              OR: [
                { nombre: { contains: q, mode: "insensitive" } },
                { sku: { contains: q.toUpperCase() } },
                { codigoBarras: { contains: q } },
              ],
            }
          : {}),
        ...(categoria ? { categoriaId: Number(categoria) } : {}),
      },
      include: { categoria: true, proveedor: true, almacen: true },
      orderBy: [{ almacenId: "asc" }, { nombre: "asc" }],
    }),
  ]);

  const visibles = productos.filter((p) => {
    if (!estado) return true;
    if (estado === "inactivos") return !p.activo;
    if (!p.activo) return false;
    const e = estadoStock(p.existencia, p.stockMinimo);
    if (estado === "bajo") return e !== "ok";
    return e === estado;
  });

  return (
    <div>
      <Encabezado
        titulo="Productos"
        descripcion={`${visibles.length} en la lista · el inventario completo del almacén`}
      >
        <a href="/api/export/productos" className="rounded-md border border-borde bg-white px-4 py-2 text-sm font-medium hover:border-tinta-suave">
          Exportar CSV
        </a>
        <Link href="/productos/nuevo" className={claseBotonPrincipal}>
          + Nuevo producto
        </Link>
      </Encabezado>

      <form method="get" className="mb-4 flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por nombre o código..."
          className={`${claseInput} max-w-xs`}
        />
        <select name="categoria" defaultValue={categoria ?? ""} className="w-auto rounded-md border border-borde bg-white px-3 py-2 text-sm">
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <select name="estado" defaultValue={estado ?? ""} className="w-auto rounded-md border border-borde bg-white px-3 py-2 text-sm">
          <option value="">Todo el stock</option>
          <option value="bajo">Stock bajo o agotado</option>
          <option value="agotado">Solo agotados</option>
          <option value="ok">Solo en stock</option>
          <option value="inactivos">Desactivados</option>
        </select>
        <button type="submit" className="rounded-md border border-borde bg-white px-4 py-2 text-sm font-medium hover:border-tinta-suave">
          Filtrar
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-borde bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-borde bg-papel text-xs tracking-wide text-tinta-suave uppercase">
              <th className="px-4 py-3 font-semibold">Código</th>
              <th className="px-4 py-3 font-semibold">Producto</th>
              <th className="px-4 py-3 font-semibold">Almacén</th>
              <th className="px-4 py-3 font-semibold">Categoría</th>
              <th className="px-4 py-3 font-semibold">Ubicación</th>
              <th className="px-4 py-3 text-right font-semibold">Existencia</th>
              <th className="px-4 py-3 text-right font-semibold">Costo</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {visibles.map((p) => (
              <tr key={p.id} className={`hover:bg-papel ${p.activo ? "" : "opacity-50"}`}>
                <td className="px-4 py-2.5 font-mono text-xs">{p.sku}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    {p.foto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.foto}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded border border-borde object-cover"
                      />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-dashed border-borde bg-papel text-xs text-tinta-suave">
                        ▦
                      </span>
                    )}
                    <span className="min-w-0">
                      <Link href={`/productos/${p.id}`} className="font-medium hover:underline">
                        {p.nombre}
                      </Link>
                      {p.proveedor && (
                        <span className="block text-xs text-tinta-suave">{p.proveedor.nombre}</span>
                      )}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2.5">{p.almacen.nombre}</td>
                <td className="px-4 py-2.5">{p.categoria.nombre}</td>
                <td className="px-4 py-2.5 font-mono text-xs">{p.ubicacion ?? "—"}</td>
                <td className="px-4 py-2.5 text-right font-mono font-semibold">
                  {p.existencia} <span className="font-normal text-tinta-suave">{p.unidad}</span>
                </td>
                <td className="px-4 py-2.5 text-right font-mono">{dinero(p.precioCosto.toString())}</td>
                <td className="px-4 py-2.5">
                  {p.activo ? (
                    <Semaforo existencia={p.existencia} stockMinimo={p.stockMinimo} />
                  ) : (
                    <span className="text-xs font-semibold text-tinta-suave">Desactivado</span>
                  )}
                </td>
              </tr>
            ))}
            {visibles.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-tinta-suave">
                  Ningún producto coincide con ese filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
