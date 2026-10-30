"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import type { FormState } from "@/app/actions/productos";
import { claseBotonPrincipal, claseBotonSecundario, claseInput, claseLabel } from "./ui";

type Opcion = { id: number; nombre: string };

export type ProductoInicial = {
  sku: string;
  codigoBarras?: string | null;
  foto?: string | null;
  nombre: string;
  descripcion: string | null;
  categoriaId: number;
  proveedorId: number | null;
  unidad: string;
  precioCosto: string;
  precioVenta: string;
  existencia: number;
  stockMinimo: number;
  ubicacion: string | null;
};

const UNIDADES = ["u", "kg", "g", "L", "mL", "caja", "saco", "paquete", "rollo", "par"];

export default function ProductoForm({
  accion,
  inicial,
  categorias,
  proveedores,
  esEdicion = false,
  codigoBarrasInicial,
}: {
  accion: (prev: FormState, data: FormData) => Promise<FormState>;
  inicial?: ProductoInicial;
  categorias: Opcion[];
  proveedores: Opcion[];
  esEdicion?: boolean;
  codigoBarrasInicial?: string;
}) {
  const [state, dispatch, pending] = useActionState(accion, undefined);

  return (
    <form action={dispatch} className="flex max-w-2xl flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        <div>
          <label htmlFor="sku" className={claseLabel}>
            Código (SKU) *
          </label>
          <input
            id="sku"
            name="sku"
            required
            defaultValue={inicial?.sku}
            placeholder="ALM-001"
            className={`${claseInput} font-mono`}
          />
        </div>
        <div>
          <label htmlFor="nombre" className={claseLabel}>
            Nombre *
          </label>
          <input
            id="nombre"
            name="nombre"
            required
            defaultValue={inicial?.nombre}
            placeholder="Arroz blanco, saco de 25 kg"
            className={claseInput}
          />
        </div>
      </div>

      <CampoFoto inicial={inicial?.foto ?? null} />

      <div>
        <label htmlFor="codigoBarras" className={claseLabel}>
          Código de barras (EAN)
        </label>
        <input
          id="codigoBarras"
          name="codigoBarras"
          inputMode="numeric"
          defaultValue={inicial?.codigoBarras ?? codigoBarrasInicial ?? ""}
          placeholder="Ej. 7501031311309 — el que trae el producto de fábrica"
          className={`${claseInput} font-mono`}
        />
        <p className="mt-1 text-xs text-tinta-suave">
          Con este código la app móvil y las pistolas de escáner encuentran el
          producto sin escribir nada.
        </p>
      </div>

      <div>
        <label htmlFor="descripcion" className={claseLabel}>
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={2}
          defaultValue={inicial?.descripcion ?? ""}
          className={claseInput}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="categoriaId" className={claseLabel}>
            Categoría *
          </label>
          <select
            id="categoriaId"
            name="categoriaId"
            required
            defaultValue={inicial?.categoriaId ?? ""}
            className={claseInput}
          >
            <option value="" disabled>
              Elige una categoría
            </option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="proveedorId" className={claseLabel}>
            Proveedor habitual
          </label>
          <select
            id="proveedorId"
            name="proveedorId"
            defaultValue={inicial?.proveedorId ?? ""}
            className={claseInput}
          >
            <option value="">Sin proveedor fijo</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="unidad" className={claseLabel}>
            Unidad
          </label>
          <select
            id="unidad"
            name="unidad"
            defaultValue={inicial?.unidad ?? "u"}
            className={claseInput}
          >
            {UNIDADES.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ubicacion" className={claseLabel}>
            Ubicación
          </label>
          <input
            id="ubicacion"
            name="ubicacion"
            defaultValue={inicial?.ubicacion ?? ""}
            placeholder="Pasillo A, estante 3"
            className={claseInput}
          />
        </div>
        <div>
          <label htmlFor="stockMinimo" className={claseLabel}>
            Stock mínimo
          </label>
          <input
            id="stockMinimo"
            name="stockMinimo"
            type="number"
            min={0}
            defaultValue={inicial?.stockMinimo ?? 0}
            className={`${claseInput} font-mono`}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="precioCosto" className={claseLabel}>
            Precio de costo (CUP)
          </label>
          <input
            id="precioCosto"
            name="precioCosto"
            type="number"
            min={0}
            step="0.01"
            defaultValue={inicial?.precioCosto ?? 0}
            className={`${claseInput} font-mono`}
          />
        </div>
        <div>
          <label htmlFor="precioVenta" className={claseLabel}>
            Precio de venta (CUP)
          </label>
          <input
            id="precioVenta"
            name="precioVenta"
            type="number"
            min={0}
            step="0.01"
            defaultValue={inicial?.precioVenta ?? 0}
            className={`${claseInput} font-mono`}
          />
        </div>
        {!esEdicion && (
          <div>
            <label htmlFor="existenciaInicial" className={claseLabel}>
              Existencia inicial
            </label>
            <input
              id="existenciaInicial"
              name="existenciaInicial"
              type="number"
              min={0}
              defaultValue={0}
              className={`${claseInput} font-mono`}
            />
          </div>
        )}
      </div>

      {esEdicion && (
        <p className="rounded-md bg-ambar-claro px-3 py-2 text-sm text-tinta">
          La existencia no se edita aquí: se corrige con un{" "}
          <strong>ajuste</strong> en Movimientos, para que quede registrado
          quién lo hizo y por qué.
        </p>
      )}

      {state?.error && (
        <p className="rounded-md bg-rojo-claro px-3 py-2 text-sm text-rojo">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={`${claseBotonPrincipal} disabled:opacity-50`}>
          {pending ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear producto"}
        </button>
        <Link href="/productos" className={claseBotonSecundario}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}

// Foto del producto: se reduce en el navegador (máx. 720 px, JPEG) y
// viaja como data URL en un campo oculto. Sin servicios externos: la
// plantilla se basta sola. Para un cliente grande, este es el punto
// donde se cambiaría por un almacén de objetos.
function CampoFoto({ inicial }: { inicial: string | null }) {
  const [foto, setFoto] = useState<string>(inicial ?? "");
  const [procesando, setProcesando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function alElegir(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setProcesando(true);
    const lector = new FileReader();
    lector.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX = 720;
        const escala = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setFoto(canvas.toDataURL("image/jpeg", 0.82));
        setProcesando(false);
      };
      img.src = String(lector.result);
    };
    lector.readAsDataURL(archivo);
  }

  return (
    <div>
      <span className={claseLabel}>Foto del producto</span>
      <input type="hidden" name="foto" value={foto} />
      <div className="flex items-center gap-3">
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={foto}
            alt="Foto del producto"
            className="h-20 w-20 rounded-md border border-borde object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed border-borde bg-papel text-2xl text-tinta-suave">
            ▦
          </div>
        )}
        <div className="flex flex-col items-start gap-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={claseBotonSecundario}
          >
            {procesando ? "Procesando..." : foto ? "Cambiar foto" : "Subir foto"}
          </button>
          {foto && (
            <button
              type="button"
              onClick={() => setFoto("")}
              className="text-xs font-semibold text-rojo hover:underline"
            >
              Quitar foto
            </button>
          )}
          <p className="text-xs text-tinta-suave">
            Se reduce sola a 720 px; sirve la de la cámara del teléfono.
          </p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={alElegir}
        className="hidden"
        aria-label="Subir foto del producto"
      />
    </div>
  );
}
