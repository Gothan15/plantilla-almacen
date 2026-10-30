import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/dal";
import UsuarioForm from "@/components/UsuarioForm";
import { Encabezado } from "@/components/ui";
import { crearUsuario } from "@/app/actions/usuarios";

export default async function NuevoUsuarioPage() {
  const actual = await getUsuarioActual();
  if (actual.rol !== "ADMIN") redirect("/panel");
  return (
    <div>
      <Encabezado titulo="Nuevo usuario" />
      <UsuarioForm accion={crearUsuario} />
    </div>
  );
}
