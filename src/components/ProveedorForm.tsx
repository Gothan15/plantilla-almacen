"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { FormState } from "@/app/actions/proveedores";
import { claseBotonPrincipal, claseBotonSecundario, claseInput, claseLabel } from "./ui";

export type ProveedorInicial = {
  nombre: string;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  notas: string | null;
};

export default function ProveedorForm({
  accion,
  inicial,
}: {
  accion: (prev: FormState, data: FormData) => Promise<FormState>;
  inicial?: ProveedorInicial;
}) {
  const [state, dispatch, pending] = useActionState(accion, undefined);

  return (
    <form action={dispatch} className="flex max-w-xl flex-col gap-4">
      <div>
        <label htmlFor="nombre" className={claseLabel}>
          Nombre *
        </label>
        <input id="nombre" name="nombre" required defaultValue={inicial?.nombre} className={claseInput} placeholder="Distribuidora o persona que suministra" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contacto" className={claseLabel}>
            Persona de contacto
          </label>
          <input id="contacto" name="contacto" defaultValue={inicial?.contacto ?? ""} className={claseInput} />
        </div>
        <div>
          <label htmlFor="telefono" className={claseLabel}>
            Teléfono
          </label>
          <input id="telefono" name="telefono" defaultValue={inicial?.telefono ?? ""} className={`${claseInput} font-mono`} placeholder="53..." />
        </div>
      </div>
      <div>
        <label htmlFor="email" className={claseLabel}>
          Correo
        </label>
        <input id="email" name="email" type="email" defaultValue={inicial?.email ?? ""} className={claseInput} />
      </div>
      <div>
        <label htmlFor="notas" className={claseLabel}>
          Notas
        </label>
        <textarea id="notas" name="notas" rows={2} defaultValue={inicial?.notas ?? ""} className={claseInput} placeholder="Días de entrega, condiciones, etc." />
      </div>
      {state?.error && (
        <p className="rounded-md bg-rojo-claro px-3 py-2 text-sm text-rojo">{state.error}</p>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={`${claseBotonPrincipal} disabled:opacity-50`}>
          {pending ? "Guardando..." : "Guardar proveedor"}
        </button>
        <Link href="/proveedores" className={claseBotonSecundario}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
