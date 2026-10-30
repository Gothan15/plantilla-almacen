"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { FormState } from "@/app/actions/ordenes";
import { dinero } from "@/lib/formato";
import { claseBotonPrincipal, claseBotonSecundario, claseInput, claseLabel } from "./ui";

export type ProductoOrden = {
  id: number;
  sku: string;
  nombre: string;
  unidad: string;
  existencia: number;
  almacenNombre: string;
  precioCosto: string;
  precioVenta: string;
};

type Linea = { productoId: number; cantidad: number; precio: number };

export default function OrdenForm({
  accion,
  tipo,
  productos,
  proveedores,
  inicial,
}: {
  accion: (prev: FormState, data: FormData) => Promise<FormState>;
  tipo: "COMPRA" | "VENTA";
  productos: ProductoOrden[];
  proveedores: { id: number; nombre: string }[];
  inicial?: {
    proveedorId: number | null;
    cliente: string | null;
    notas: string | null;
    lineas: Linea[];
  };
}) {
  const [state, dispatch, pending] = useActionState(accion, undefined);
  const [lineas, setLineas] = useState<Linea[]>(
    inicial?.lineas.length
      ? inicial.lineas
      : [{ productoId: 0, cantidad: 1, precio: 0 }]
  );

  const precioDe = (id: number) => {
    const p = productos.find((x) => x.id === id);
    if (!p) return 0;
    return Number(tipo === "COMPRA" ? p.precioCosto : p.precioVenta);
  };

  const setLinea = (i: number, cambios: Partial<Linea>) =>
    setLineas((prev) =>
      prev.map((l, j) => (j === i ? { ...l, ...cambios } : l))
    );

  const total = lineas.reduce((s, l) => s + l.cantidad * l.precio, 0);

  return (
    <form action={dispatch} className="flex max-w-3xl flex-col gap-4">
      <input type="hidden" name="tipo" value={tipo} />

      {tipo === "COMPRA" ? (
        <div>
          <label htmlFor="proveedorId" className={claseLabel}>
            Proveedor *
          </label>
          <select
            id="proveedorId"
            name="proveedorId"
            required
            defaultValue={inicial?.proveedorId ?? ""}
            className={claseInput}
          >
            <option value="" disabled>
              Elige el proveedor...
            </option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <label htmlFor="cliente" className={claseLabel}>
            Cliente *
          </label>
          <input
            id="cliente"
            name="cliente"
            required
            defaultValue={inicial?.cliente ?? ""}
            className={claseInput}
            placeholder="Ej. Cafetería El Sol"
          />
        </div>
      )}

      <fieldset className="rounded-lg border border-borde bg-white px-4 py-4">
        <legend className="px-1 text-sm font-bold tracking-wide uppercase">
          Líneas de la orden
        </legend>
        <div className="flex flex-col gap-2">
          {lineas.map((l, i) => (
            <div key={i} className="flex flex-wrap items-end gap-2">
              <div className="min-w-56 flex-1">
                <label className={claseLabel}>Producto</label>
                <select
                  name="lineaProducto"
                  value={l.productoId}
                  onChange={(e) =>
                    setLinea(i, {
                      productoId: Number(e.target.value),
                      precio: precioDe(Number(e.target.value)),
                    })
                  }
                  className={claseInput}
                >
                  <option value={0}>Elige un producto...</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} — {p.nombre} · {p.almacenNombre} (quedan{" "}
                      {p.existencia} {p.unidad})
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <label className={claseLabel}>Cantidad</label>
                <input
                  name="lineaCantidad"
                  type="number"
                  min={1}
                  value={l.cantidad || ""}
                  onChange={(e) =>
                    setLinea(i, { cantidad: Number(e.target.value) || 0 })
                  }
                  className={`${claseInput} font-mono`}
                />
              </div>
              <div className="w-32">
                <label className={claseLabel}>
                  Precio {tipo === "COMPRA" ? "costo" : "venta"}
                </label>
                <input
                  name="lineaPrecio"
                  type="number"
                  min={0}
                  step="0.01"
                  value={l.precio || ""}
                  onChange={(e) =>
                    setLinea(i, { precio: Number(e.target.value) || 0 })
                  }
                  className={`${claseInput} font-mono`}
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  setLineas((prev) => prev.filter((_, j) => j !== i))
                }
                disabled={lineas.length <= 1}
                className="rounded-md border border-borde px-2.5 py-2 text-sm text-tinta-suave hover:text-rojo disabled:opacity-40"
                aria-label="Quitar línea"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() =>
              setLineas((prev) => [...prev, { productoId: 0, cantidad: 1, precio: 0 }])
            }
            className="text-sm font-semibold text-ambar hover:underline"
          >
            + Añadir línea
          </button>
          <p className="font-mono text-sm">
            Total: <span className="font-bold">{dinero(total)}</span>
          </p>
        </div>
      </fieldset>

      <div>
        <label htmlFor="notas" className={claseLabel}>
          Notas
        </label>
        <input
          id="notas"
          name="notas"
          defaultValue={inicial?.notas ?? ""}
          className={claseInput}
          placeholder="Opcional"
        />
      </div>

      {state?.error && (
        <p className="rounded-md bg-rojo-claro px-3 py-2 text-sm text-rojo">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className={`${claseBotonPrincipal} disabled:opacity-50`}
        >
          {pending ? "Guardando..." : "Guardar orden (borrador)"}
        </button>
        <Link href="/ordenes" className={claseBotonSecundario}>
          Cancelar
        </Link>
      </div>
      <p className="text-xs text-tinta-suave">
        La orden nace en borrador y no toca el stock. Al confirmarla desde su
        ficha, cada línea entra en el libro de movimientos.
      </p>
    </form>
  );
}
