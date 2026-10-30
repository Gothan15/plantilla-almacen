"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { FormState } from "@/app/actions/usuarios";
import { claseBotonPrincipal, claseBotonSecundario, claseInput, claseLabel } from "./ui";

export type UsuarioInicial = {
  nombre: string;
  email: string;
  rol: string;
};

export default function UsuarioForm({
  accion,
  inicial,
}: {
  accion: (prev: FormState, data: FormData) => Promise<FormState>;
  inicial?: UsuarioInicial;
}) {
  const [state, dispatch, pending] = useActionState(accion, undefined);
  const esEdicion = Boolean(inicial);

  return (
    <form action={dispatch} className="flex max-w-xl flex-col gap-4">
      <div>
        <label htmlFor="nombre" className={claseLabel}>
          Nombre *
        </label>
        <input id="nombre" name="nombre" required defaultValue={inicial?.nombre} className={claseInput} />
      </div>
      <div>
        <label htmlFor="email" className={claseLabel}>
          Correo *
        </label>
        <input id="email" name="email" type="email" required defaultValue={inicial?.email} className={claseInput} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="rol" className={claseLabel}>
            Rol
          </label>
          <select id="rol" name="rol" defaultValue={inicial?.rol ?? "ALMACENERO"} className={claseInput}>
            <option value="ALMACENERO">Almacenero</option>
            <option value="ADMIN">Administrador</option>
          </select>
          <p className="mt-1 text-xs text-tinta-suave">
            El administrador además gestiona usuarios y puede eliminar
            productos.
          </p>
        </div>
        <div>
          <label htmlFor="password" className={claseLabel}>
            Contraseña {esEdicion ? "(vacía = no cambiar)" : "*"}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required={!esEdicion}
            minLength={6}
            autoComplete="new-password"
            className={claseInput}
          />
        </div>
      </div>
      {state?.error && (
        <p className="rounded-md bg-rojo-claro px-3 py-2 text-sm text-rojo">{state.error}</p>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={`${claseBotonPrincipal} disabled:opacity-50`}>
          {pending ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear usuario"}
        </button>
        <Link href="/usuarios" className={claseBotonSecundario}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
