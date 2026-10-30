import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUsuarioActual } from "@/lib/dal";
import { Encabezado, claseBotonPrincipal } from "@/components/ui";
import { eliminarUsuario } from "@/app/actions/usuarios";

export default async function UsuariosPage() {
  const actual = await getUsuarioActual();
  if (actual.rol !== "ADMIN") redirect("/panel");

  const usuarios = await prisma.user.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { movimientos: true } } },
  });

  return (
    <div>
      <Encabezado
        titulo="Usuarios"
        descripcion="Quién puede entrar al sistema y con qué rol"
      >
        <Link href="/usuarios/nuevo" className={claseBotonPrincipal}>
          + Nuevo usuario
        </Link>
      </Encabezado>

      <div className="overflow-x-auto rounded-lg border border-borde bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-borde bg-papel text-xs tracking-wide text-tinta-suave uppercase">
              <th className="px-4 py-3 font-semibold">Nombre</th>
              <th className="px-4 py-3 font-semibold">Correo</th>
              <th className="px-4 py-3 font-semibold">Rol</th>
              <th className="px-4 py-3 text-right font-semibold">Movimientos</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {usuarios.map((u) => (
              <tr key={u.id} className="hover:bg-papel">
                <td className="px-4 py-2.5 font-medium">
                  {u.nombre}
                  {u.id === actual.id && (
                    <span className="ml-2 text-xs text-tinta-suave">(tú)</span>
                  )}
                </td>
                <td className="px-4 py-2.5">{u.email}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded px-1.5 py-0.5 font-mono text-[11px] font-bold ${
                      u.rol === "ADMIN" ? "bg-carbon text-white" : "bg-papel-oscuro text-tinta"
                    }`}
                  >
                    {u.rol === "ADMIN" ? "ADMINISTRADOR" : "ALMACENERO"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right font-mono">{u._count.movimientos}</td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                  <Link href={`/usuarios/${u.id}/editar`} className="font-semibold text-ambar hover:underline">
                    Editar
                  </Link>
                  {u.id !== actual.id && u._count.movimientos === 0 && (
                    <form action={eliminarUsuario.bind(null, u.id)} className="ml-3 inline">
                      <button type="submit" className="font-semibold text-rojo hover:underline">
                        Eliminar
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-tinta-suave">
        Un usuario con movimientos registrados no se puede eliminar: su firma
        forma parte del libro.
      </p>
    </div>
  );
}
