"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registrarMovimiento } from "@/app/actions/movimientos";
import { claseBotonPrincipal, claseBotonSecundario, claseInput, claseLabel } from "./ui";

export type ProductoOpcion = {
  id: number;
  sku: string;
  nombre: string;
  unidad: string;
  existencia: number;
};

export default function MovimientoForm({
  productos,
  proveedores,
  productoFijo,
  volver,
  tipoInicial,
}: {
  productos: ProductoOpcion[];
  proveedores: { id: number; nombre: string }[];
  productoFijo?: ProductoOpcion;
  volver?: string;
  tipoInicial?: string;
}) {
  const [state, dispatch, pending] = useActionState(registrarMovimiento, undefined);
  const [tipo, setTipo] = useState(tipoInicial ?? "ENTRADA");
  const [productoId, setProductoId] = useState<number>(
    productoFijo?.id ?? productos[0]?.id ?? 0
  );
  const producto =
    productoFijo ?? productos.find((p) => p.id === productoId);

  return (
    <form action={dispatch} className="flex max-w-xl flex-col gap-4">
      {volver && <input type="hidden" name="volver" value={volver} />}

      <div>
        <span className={claseLabel}>Tipo de movimiento</span>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { valor: "ENTRADA", texto: "Entrada", activo: "border-verde bg-verde-claro text-verde" },
              { valor: "SALIDA", texto: "Salida", activo: "border-rojo bg-rojo-claro text-rojo" },
              { valor: "AJUSTE", texto: "Ajuste", activo: "border-ambar bg-ambar-claro text-ambar" },
            ] as const
          ).map((op) => (
            <label
              key={op.valor}
              className={`cursor-pointer rounded-md border px-3 py-2 text-center text-sm font-semibold transition ${
                tipo === op.valor
                  ? op.activo
                  : "border-borde bg-white text-tinta-suave hover:border-tinta-suave"
              }`}
            >
              <input
                type="radio"
                name="tipo"
                value={op.valor}
                checked={tipo === op.valor}
                onChange={() => setTipo(op.valor)}
                className="sr-only"
              />
              {op.texto}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="productoId" className={claseLabel}>
          Producto *
        </label>
        {productoFijo ? (
          <>
            <input type="hidden" name="productoId" value={productoFijo.id} />
            <p className={`${claseInput} bg-papel`}>
              <span className="font-mono text-xs">{productoFijo.sku}</span>{" "}
              {productoFijo.nombre}
            </p>
          </>
        ) : (
          <select
            id="productoId"
            name="productoId"
            value={productoId}
            onChange={(e) => setProductoId(Number(e.target.value))}
            className={claseInput}
          >
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} — {p.nombre} (quedan {p.existencia} {p.unidad})
              </option>
            ))}
          </select>
        )}
        {producto && (
          <p className="mt-1 text-xs text-tinta-suave">
            Existencia actual:{" "}
            <span className="font-mono font-semibold">
              {producto.existencia} {producto.unidad}
            </span>
          </p>
        )}
      </div>

      <div>
        <label htmlFor="cantidad" className={claseLabel}>
          {tipo === "AJUSTE" ? "Existencia real contada *" : "Cantidad *"}
        </label>
        <input
          id="cantidad"
          name="cantidad"
          type="number"
          min={0}
          required
          className={`${claseInput} font-mono`}
          placeholder={tipo === "AJUSTE" ? "Lo que contaste físicamente" : "0"}
        />
        {tipo === "AJUSTE" && (
          <p className="mt-1 text-xs text-tinta-suave">
            El sistema calcula la diferencia contra la existencia actual y la
            deja registrada como ajuste.
          </p>
        )}
      </div>

      {tipo === "ENTRADA" && (
        <div>
          <label htmlFor="proveedorId" className={claseLabel}>
            Proveedor que entrega
          </label>
          <select id="proveedorId" name="proveedorId" className={claseInput}>
            <option value="">Sin especificar</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="motivo" className={claseLabel}>
          Motivo / referencia
        </label>
        <input
          id="motivo"
          name="motivo"
          className={claseInput}
          placeholder={
            tipo === "ENTRADA"
              ? "Ej. Factura 1123, compra semanal"
              : tipo === "SALIDA"
                ? "Ej. Vale de salida para la tienda"
                : "Ej. Conteo físico de fin de mes"
          }
        />
      </div>

      {state?.error && (
        <p className="rounded-md bg-rojo-claro px-3 py-2 text-sm text-rojo">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={`${claseBotonPrincipal} disabled:opacity-50`}>
          {pending ? "Registrando..." : "Registrar movimiento"}
        </button>
        <Link href="/movimientos" className={claseBotonSecundario}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
