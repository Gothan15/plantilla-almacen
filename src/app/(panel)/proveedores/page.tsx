import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Encabezado, claseBotonPrincipal } from "@/components/ui";
import { eliminarProveedor } from "@/app/actions/proveedores";

export default async function ProveedoresPage() {
  const proveedores = await prisma.proveedor.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { productos: true, movimientos: true } } },
  });

  return (
    <div>
      <Encabezado
        titulo="Proveedores"
        descripcion="Quién suministra qué: el directorio para reponer a tiempo"
      >
        <Link href="/proveedores/nuevo" className={claseBotonPrincipal}>
          + Nuevo proveedor
        </Link>
      </Encabezado>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {proveedores.map((p) => {
          const enUso = p._count.productos > 0 || p._count.movimientos > 0;
          return (
            <article key={p.id} className="rounded-lg border border-borde bg-white px-4 py-4">
              <h2 className="font-semibold">{p.nombre}</h2>
              <dl className="mt-2 space-y-1 text-sm text-tinta-suave">
                {p.contacto && <div>Contacto: {p.contacto}</div>}
                {p.telefono && <div className="font-mono text-xs">Tel. {p.telefono}</div>}
                {p.email && <div className="truncate">{p.email}</div>}
                {p.notas && <div className="text-xs">{p.notas}</div>}
              </dl>
              <div className="corte my-3" />
              <div className="flex items-center gap-3 text-sm">
                <span className="font-mono text-xs text-tinta-suave">
                  {p._count.productos} producto{p._count.productos === 1 ? "" : "s"}
                </span>
                <Link href={`/proveedores/${p.id}/editar`} className="ml-auto font-semibold text-ambar hover:underline">
                  Editar
                </Link>
                {!enUso && (
                  <form action={eliminarProveedor.bind(null, p.id)}>
                    <button type="submit" className="font-semibold text-rojo hover:underline">
                      Eliminar
                    </button>
                  </form>
                )}
              </div>
            </article>
          );
        })}
        {proveedores.length === 0 && (
          <p className="text-sm text-tinta-suave">Todavía no hay proveedores registrados.</p>
        )}
      </div>
    </div>
  );
}
