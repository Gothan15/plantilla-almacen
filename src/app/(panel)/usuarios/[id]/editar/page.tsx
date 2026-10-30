import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUsuarioActual } from "@/lib/dal";
import UsuarioForm from "@/components/UsuarioForm";
import { Encabezado } from "@/components/ui";
import { actualizarUsuario } from "@/app/actions/usuarios";

export default async function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actual = await getUsuarioActual();
  if (actual.rol !== "ADMIN") redirect("/panel");

  const { id } = await params;
  const usuario = await prisma.user.findUnique({ where: { id: Number(id) } });
  if (!usuario) notFound();

  return (
    <div>
      <Encabezado titulo={`Editar ${usuario.nombre}`} />
      <UsuarioForm
        accion={actualizarUsuario.bind(null, usuario.id)}
        inicial={usuario}
      />
    </div>
  );
}
