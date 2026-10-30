import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUsuarioActual } from "@/lib/dal";
import AlmacenesVista from "@/components/AlmacenesVista";

export default async function AlmacenesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const usuario = await getUsuarioActual();
  if (usuario.rol !== "ADMIN") redirect("/panel");
  const { error } = await searchParams;

  const almacenes = await prisma.almacen.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { productos: true } } },
  });
  return <AlmacenesVista almacenes={almacenes} error={error} />;
}
