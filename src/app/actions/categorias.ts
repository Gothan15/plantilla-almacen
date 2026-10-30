"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

export type FormState = { error?: string } | undefined;

export async function crearCategoria(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await verifySession();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;
  if (!nombre) return { error: "El nombre es obligatorio." };

  const existe = await prisma.categoria.findUnique({ where: { nombre } });
  if (existe) return { error: "Ya existe una categoría con ese nombre." };

  await prisma.categoria.create({ data: { nombre, descripcion } });
  revalidatePath("/categorias");
  return undefined;
}

export async function eliminarCategoria(id: number) {
  await verifySession();
  const enUso = await prisma.producto.count({ where: { categoriaId: id } });
  if (enUso === 0) {
    await prisma.categoria.delete({ where: { id } });
  }
  revalidatePath("/categorias");
}
