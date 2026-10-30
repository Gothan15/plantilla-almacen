"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="admin@almacen.cu"
          className="rounded-md border border-borde bg-white px-3 py-2 text-sm outline-none focus:border-ambar"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="admin123"
          className="rounded-md border border-borde bg-white px-3 py-2 text-sm outline-none focus:border-ambar"
        />
      </div>
      {state?.error && (
        <p className="rounded-md bg-rojo-claro px-3 py-2 text-sm text-rojo">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-carbon px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-carbon-suave disabled:opacity-50"
      >
        {pending ? "Entrando..." : "Entrar al almacén"}
      </button>
    </form>
  );
}
