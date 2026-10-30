"use client";

import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import { CONFIG } from "@/lib/config";
import { dinero } from "@/lib/formato";
import { claseBotonPrincipal, claseInput } from "./ui";

// Etiqueta imprimible de un producto: nombre del negocio, nombre del
// producto, precio y el código de barras. Si el producto trae EAN de
// fábrica se dibuja ese; si no, se genera un Code128 con el SKU, que
// la propia página de escaneo también sabe leer (busca por SKU).
export default function EtiquetaVista({
  nombre,
  sku,
  codigoBarras,
  precioVenta,
}: {
  nombre: string;
  sku: string;
  codigoBarras: string | null;
  precioVenta: string;
}) {
  const [copias, setCopias] = useState(4);
  const refs = useRef<(SVGSVGElement | null)[]>([]);
  const valor = codigoBarras ?? sku;
  const esEan13 = !!codigoBarras && /^\d{13}$/.test(codigoBarras);

  useEffect(() => {
    refs.current.forEach((svg) => {
      if (!svg) return;
      try {
        JsBarcode(svg, valor, {
          format: esEan13 ? "EAN13" : "CODE128",
          displayValue: true,
          fontSize: 13,
          height: 44,
          margin: 4,
        });
      } catch {
        // EAN con dígito de control inválido u otro problema: Code128
        // acepta cualquier texto y el escáner lo lee igual.
        JsBarcode(svg, valor, {
          format: "CODE128",
          displayValue: true,
          fontSize: 13,
          height: 44,
          margin: 4,
        });
      }
    });
  }, [valor, esEan13, copias]);

  return (
    <div>
      <div className="no-imprimir mx-auto mb-6 flex max-w-xl flex-wrap items-end gap-3">
        <div>
          <label htmlFor="copias" className="mb-1 block text-sm font-medium">
            Copias en la hoja
          </label>
          <input
            id="copias"
            type="number"
            min={1}
            max={30}
            value={copias}
            onChange={(e) =>
              setCopias(Math.max(1, Math.min(30, Number(e.target.value) || 1)))
            }
            className={`${claseInput} w-24 font-mono`}
          />
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className={claseBotonPrincipal}
        >
          Imprimir
        </button>
        <p className="w-full text-xs text-tinta-suave">
          Etiquetas de 70 × 40 mm con línea de corte. En el diálogo de
          impresión, márgenes «ninguno» o «mínimos» dan el mejor resultado.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: copias }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col justify-between overflow-hidden border border-dashed border-neutral-400 bg-white px-2 py-1.5"
            style={{ width: "70mm", height: "40mm" }}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[9px] font-semibold tracking-widest text-neutral-500 uppercase">
                {CONFIG.nombreNegocio}
              </span>
              <span className="font-mono text-[9px] text-neutral-500">{sku}</span>
            </div>
            <p className="truncate text-[13px] leading-tight font-bold text-black">
              {nombre}
            </p>
            <svg
              ref={(el) => {
                refs.current[i] = el;
              }}
              className="w-full"
              aria-label={`Código de barras ${valor}`}
            />
            <div className="flex items-end justify-between">
              <span className="text-[9px] text-neutral-500">
                {esEan13 ? "EAN de fábrica" : "Código interno"}
              </span>
              <span className="font-mono text-[15px] font-bold text-black">
                {dinero(precioVenta)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
