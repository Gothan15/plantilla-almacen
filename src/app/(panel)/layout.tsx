import Link from "next/link";
import { getUsuarioActual } from "@/lib/dal";
import { almacenActualId } from "@/lib/almacen-actual";
import { prisma } from "@/lib/prisma";
import { logout } from "@/app/actions/auth";
import { CONFIG } from "@/lib/config";
import SelectorAlmacen from "@/components/SelectorAlmacen";

const ENLACES = [
  { href: "/panel", texto: "Panel", icono: "▦" },
  { href: "/escanear", texto: "Escanear", icono: "▣" },
  { href: "/productos", texto: "Productos", icono: "▤" },
  { href: "/movimientos", texto: "Movimientos", icono: "⇄" },
  { href: "/ordenes", texto: "Órdenes", icono: "▧" },
  { href: "/categorias", texto: "Categorías", icono: "❏" },
  { href: "/proveedores", texto: "Proveedores", icono: "⚲" },
  { href: "/reportes", texto: "Reportes", icono: "▨" },
];

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await getUsuarioActual();
  const [almacenes, almacenActual] = await Promise.all([
    prisma.almacen.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    }),
    almacenActualId(),
  ]);
  const enlaces =
    usuario.rol === "ADMIN"
      ? [
          ...ENLACES,
          { href: "/almacenes", texto: "Almacenes", icono: "⌂" },
          { href: "/usuarios", texto: "Usuarios", icono: "⚇" },
        ]
      : ENLACES;

  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <aside className="bg-carbon text-white md:sticky md:top-0 md:flex md:h-screen md:w-60 md:flex-col">
        <div className="flex items-center gap-3 px-4 pt-4 md:flex-col md:items-stretch md:px-5 md:pt-6">
          <div>
            <p className="font-mono text-[10px] tracking-[0.25em] text-ambar">
              {CONFIG.subtitulo.toUpperCase()}
            </p>
            <p className="text-lg leading-tight font-bold tracking-tight">
              {CONFIG.nombreNegocio}
            </p>
            <p className="mt-1 hidden text-xs text-white/60 md:block">
              {usuario.nombre} ·{" "}
              {usuario.rol === "ADMIN" ? "Administrador" : "Almacenero"}
            </p>
            <SelectorAlmacen almacenes={almacenes} actual={almacenActual} />
          </div>
          <form action={logout} className="ml-auto md:hidden">
            <button
              type="submit"
              className="rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/10"
            >
              Salir
            </button>
          </form>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 py-3 md:flex-col md:px-3 md:py-5">
          {enlaces.map((enlace) => (
            <Link
              key={enlace.href}
              href={enlace.href}
              className="flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <span className="font-mono text-xs text-ambar">
                {enlace.icono}
              </span>
              {enlace.texto}
            </Link>
          ))}
        </nav>
        <form action={logout} className="mt-auto hidden p-3 md:block">
          <button
            type="submit"
            className="w-full rounded-md px-3 py-2 text-left text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            Salir
          </button>
        </form>
      </aside>
      <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}

// Panel privado: los datos son por usuario y en vivo, nada de prerender.
export const instant = false;
