import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProveedorForm from "@/components/ProveedorForm";
import { Encabezado } from "@/components/ui";
import { actualizarProveedor } from "@/app/actions/proveedores";

export default async function EditarProveedorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const proveedor = await prisma.proveedor.findUnique({
    where: { id: Number(id) },
  });
  if (!proveedor) notFound();

  return (
    <div>
      <Encabezado titulo={`Editar ${proveedor.nombre}`} />
      <ProveedorForm
        accion={actualizarProveedor.bind(null, proveedor.id)}
        inicial={proveedor}
      />
    </div>
  );
}
