"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearAlmacen, cambiarActivoAlmacen } from "@/app/actions/almacenes";
import { claseBotonPrincipal, claseInput, claseLabel } from "./ui";

export type AlmacenConConteo = {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  _count: { productos: number };
};

const ERRORES: Record<string, string> = {
  "con-stock": "No se puede desactivar: todavía tiene productos con existencia. Traspasa o vende ese stock primero.",
  ultimo: "No se puede desactivar el último almacén activo.",
};

export default function AlmacenesVista({
  almacenes,
  error,
}: {
  almacenes: AlmacenConConteo[];
  error?: string;
}) {
  const [state, dispatch, pending] = useActionState(crearAlmacen, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const totalRef = useRef(almacenes.length);

  useEffect(() => {
    if (almacenes.length > totalRef.current) formRef.current?.reset();
    totalRef.current = almacenes.length;
  }, [almacenes.length]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Almacenes</h1>
        <p className="mt-0.5 text-sm text-tinta-suave">
          Los locales del negocio. Cada producto vive en uno; la mercancía se
          mueve entre ellos con traspasos.
        </p>
      </div>

      {error && ERRORES[error] && (
        <p className="mb-4 rounded-md bg-rojo-claro px-3 py-2 text-sm text-rojo">
          {ERRORES[error]}
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.4fr]">
        <form
          ref={formRef}
          action={dispatch}
          className="rounded-lg border border-borde bg-white px-4 py-4"
        >
          <h2 className="mb-3 text-sm font-bold tracking-wide uppercase">
            Nuevo almacén
          </h2>
          <div className="flex flex-col gap-3">
            <div>
              <label htmlFor="nombre" className={claseLabel}>
                Nombre *
              </label>
              <input
                id="nombre"
                name="nombre"
                required
                className={claseInput}
                placeholder="Ej. Sucursal Centro"
              />
            </div>
            <div>
              <label htmlFor="descripcion" className={claseLabel}>
                Descripción
              </label>
              <input id="descripcion" name="descripcion" className={claseInput} />
            </div>
            {state?.error && (
              <p className="rounded-md bg-rojo-claro px-3 py-2 text-sm text-rojo">
                {state.error}
              </p>
            )}
            <button
              type="submit"
              disabled={pending}
              className={`${claseBotonPrincipal} disabled:opacity-50`}
            >
              {pending ? "Creando..." : "Crear almacén"}
            </button>
          </div>
        </form>

        <div className="overflow-hidden rounded-lg border border-borde bg-white">
          {almacenes.map((a) => (
            <div
              key={a.id}
              className={`flex items-center gap-3 border-b border-borde px-4 py-3 last:border-0 ${a.activo ? "" : "opacity-50"}`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{a.nombre}</p>
                <p className="text-xs text-tinta-suave">
                  {a._count.productos} producto(s)
                  {a.descripcion ? ` · ${a.descripcion}` : ""}
                  {!a.activo ? " · desactivado" : ""}
                </p>
              </div>
              <form action={cambiarActivoAlmacen.bind(null, a.id)}>
                <button
                  type="submit"
                  className="rounded-md border border-borde px-3 py-1.5 text-xs font-semibold hover:bg-papel"
                >
                  {a.activo ? "Desactivar" : "Activar"}
                </button>
              </form>
            </div>
          ))}
          {almacenes.length === 0 && (
            <p className="px-4 py-6 text-sm text-tinta-suave">
              No hay almacenes todavía.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
