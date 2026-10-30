"use client";

import { useRouter } from "next/navigation";

// Selector de almacén del panel: guarda la elección en una cookie y
// refresca; las vistas del servidor filtran por ese almacén.
export default function SelectorAlmacen({
  almacenes,
  actual,
}: {
  almacenes: { id: number; nombre: string }[];
  actual: number | null;
}) {
  const router = useRouter();
  if (almacenes.length <= 1) return null;

  return (
    <label className="mt-3 block">
      <span className="mb-1 block font-mono text-[10px] tracking-[0.25em] text-white/50 uppercase">
        Viendo
      </span>
      <select
        value={actual ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          document.cookie = v
            ? `almacen=${v}; path=/; max-age=31536000; samesite=lax`
            : "almacen=; path=/; max-age=0; samesite=lax";
          router.refresh();
        }}
        className="w-full rounded-md border border-white/20 bg-white/10 px-2.5 py-2 text-sm text-white [&>option]:text-black"
        aria-label="Almacén que se está viendo"
      >
        <option value="">Todos los almacenes</option>
        {almacenes.map((a) => (
          <option key={a.id} value={a.id}>
            {a.nombre}
          </option>
        ))}
      </select>
    </label>
  );
}
