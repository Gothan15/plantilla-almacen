import { prisma } from "@/lib/prisma";
import CategoriasVista from "@/components/CategoriasVista";

export default async function CategoriasPage() {
  const categorias = await prisma.categoria.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { productos: true } } },
  });
  return <CategoriasVista categorias={categorias} />;
}
