"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearCategoria, eliminarCategoria } from "@/app/actions/categorias";
import { claseBotonPrincipal, claseInput, claseLabel } from "@/components/ui";

export type CategoriaConConteo = {
  id: number;
  nombre: string;
  descripcion: string | null;
  _count: { productos: number };
};

export default function CategoriasVista({
  categorias,
}: {
  categorias: CategoriaConConteo[];
}) {
  const [state, dispatch, pending] = useActionState(crearCategoria, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const totalRef = useRef(categorias.length);

  // Cuando la lista crece, la categoría se creó: limpiar el formulario.
  useEffect(() => {
    if (categorias.length > totalRef.current) formRef.current?.reset();
    totalRef.current = categorias.length;
  }, [categorias.length]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Categorías</h1>
        <p className="mt-0.5 text-sm text-tinta-suave">
          Los grupos del catálogo: alimentos, limpieza, ferretería...
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.4fr]">
        <form
          ref={formRef}
          action={dispatch}
          className="rounded-lg border border-borde bg-white px-4 py-4"
        >
          <h2 className="mb-3 text-sm font-bold tracking-wide uppercase">
            Nueva categoría
          </h2>
          <div className="flex flex-col gap-3">
            <div>
              <label htmlFor="nombre" className={claseLabel}>
                Nombre *
              </label>
              <input id="nombre" name="nombre" required className={claseInput} placeholder="Ej. Bebidas" />
            </div>
            <div>
              <label htmlFor="descripcion" className={claseLabel}>
                Descripción
              </label>
              <input id="descripcion" name="descripcion" className={claseInput} />
            </div>
            {state?.error && (
              <p className="rounded-md bg-rojo-claro px-3 py-2 text-sm text-rojo">{state.error}</p>
            )}
            <button type="submit" disabled={pending} className={`${claseBotonPrincipal} disabled:opacity-50`}>
              {pending ? "Creando..." : "Crear categoría"}
            </button>
          </div>
        </form>

        <div className="overflow-hidden rounded-lg border border-borde bg-white">
          <ul className="divide-y divide-borde">
            {categorias.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{c.nombre}</p>
                  {c.descripcion && (
                    <p className="truncate text-xs text-tinta-suave">{c.descripcion}</p>
                  )}
                </div>
                <span className="font-mono text-xs text-tinta-suave">
                  {c._count.productos} producto{c._count.productos === 1 ? "" : "s"}
                </span>
                {c._count.productos === 0 ? (
                  <form action={eliminarCategoria.bind(null, c.id)}>
                    <button type="submit" className="text-sm font-semibold text-rojo hover:underline">
                      Eliminar
                    </button>
                  </form>
                ) : (
                  <span className="text-xs text-tinta-suave">en uso</span>
                )}
              </li>
            ))}
            {categorias.length === 0 && (
              <li className="px-4 py-6 text-sm text-tinta-suave">
                Sin categorías todavía.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
