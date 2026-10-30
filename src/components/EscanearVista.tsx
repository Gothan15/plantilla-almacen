"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { registrarMovimientoRapido } from "@/app/actions/movimientos";
import { Semaforo, claseBotonPrincipal, claseInput } from "./ui";

// --- Tipos mínimos de las APIs de escaneo (no están en la lib de TS) ---
interface CodigoDetectado {
  rawValue: string;
}
interface DetectorCodigos {
  detect(fuente: HTMLVideoElement): Promise<CodigoDetectado[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (opciones?: {
      formats?: string[];
    }) => DetectorCodigos;
  }
}

interface PluginEscaneo {
  scan(opciones?: Record<string, unknown>): Promise<{
    barcodes?: { rawValue?: string; displayValue?: string }[];
  }>;
}
interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  Plugins?: Record<string, PluginEscaneo | undefined>;
}

export type ProductoEscaneado = {
  id: number;
  sku: string;
  codigoBarras: string | null;
  foto: string | null;
  nombre: string;
  categoria: string;
  proveedor: string | null;
  unidad: string;
  existencia: number;
  stockMinimo: number;
  ubicacion: string | null;
  activo: boolean;
  precioCosto: string;
  precioVenta: string;
};

function vibrar() {
  try {
    navigator.vibrate?.(80);
  } catch {
    /* sin vibración no pasa nada */
  }
}

export default function EscanearVista() {
  const [codigo, setCodigo] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [producto, setProducto] = useState<ProductoEscaneado | null>(null);
  const [noEncontrado, setNoEncontrado] = useState<string | null>(null);
  const [camara, setCamara] = useState(false);
  const [avisoCamara, setAvisoCamara] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function buscar(valor: string) {
    const limpio = valor.trim();
    if (!limpio) return;
    setBuscando(true);
    setNoEncontrado(null);
    try {
      const r = await fetch(
        `/api/productos/por-codigo?codigo=${encodeURIComponent(limpio)}`
      );
      const datos = (await r.json()) as { producto: ProductoEscaneado | null };
      if (datos.producto) {
        vibrar();
        setProducto(datos.producto);
      } else {
        setProducto(null);
        setNoEncontrado(limpio);
      }
    } catch {
      setNoEncontrado(null);
      setProducto(null);
      setAvisoCamara("No se pudo buscar: revisa la conexión con el servidor.");
    } finally {
      setBuscando(false);
    }
  }

  async function escanear() {
    setAvisoCamara(null);
    // 1) App nativa (Capacitor): plugin ML Kit, sin pasar por la web.
    const cap = (
      window as unknown as { Capacitor?: CapacitorGlobal }
    ).Capacitor;
    if (cap?.isNativePlatform?.()) {
      const plugin =
        cap.Plugins?.MLKitBarcodeScanner ?? cap.Plugins?.BarcodeScanner;
      if (plugin?.scan) {
        try {
          const res = await plugin.scan();
          const valor =
            res.barcodes?.[0]?.rawValue ?? res.barcodes?.[0]?.displayValue;
          if (valor) {
            setCodigo(valor);
            void buscar(valor);
          }
          return;
        } catch {
          /* si el plugin falla, seguimos con la cámara web */
        }
      }
    }
    // 2) Navegador con BarcodeDetector (Chrome/Android).
    if ("BarcodeDetector" in window) {
      setCamara(true);
      return;
    }
    // 3) Sin lector: queda la entrada manual o la pistola USB.
    setAvisoCamara(
      "Este navegador no trae lector de códigos. Escribe el código o usa una pistola USB, que funciona como teclado."
    );
    inputRef.current?.focus();
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void buscar(codigo);
        }}
        className="flex flex-col gap-3"
      >
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Código de barras o SKU..."
            autoFocus
            className={`${claseInput} font-mono text-base`}
            aria-label="Código de barras o SKU"
          />
          <button
            type="submit"
            disabled={buscando}
            className={`${claseBotonPrincipal} shrink-0 disabled:opacity-50`}
          >
            {buscando ? "Buscando..." : "Buscar"}
          </button>
        </div>
        <button
          type="button"
          onClick={() => void escanear()}
          className="rounded-md bg-ambar px-4 py-3.5 text-base font-bold text-white transition hover:brightness-110"
        >
          ▦ Escanear con la cámara
        </button>
        {avisoCamara && (
          <p className="rounded-md bg-ambar-claro px-3 py-2 text-sm">
            {avisoCamara}
          </p>
        )}
        <p className="text-xs text-tinta-suave">
          También sirve una pistola de códigos USB: lee sobre este campo y el
          producto aparece solo. Y en el teléfono, esta misma página es la que
          abre la app de Android.
        </p>
      </form>

      {noEncontrado && (
        <div className="mt-5 rounded-lg border border-borde bg-white px-4 py-4">
          <p className="font-semibold">
            El código <span className="font-mono">{noEncontrado}</span> no está
            en el almacén.
          </p>
          <p className="mt-1 text-sm text-tinta-suave">
            Puede ser un producto nuevo: créalo con el código ya puesto.
          </p>
          <Link
            href={`/productos/nuevo?codigoBarras=${encodeURIComponent(noEncontrado)}`}
            className={`${claseBotonPrincipal} mt-3 inline-block`}
          >
            + Crear producto con este código
          </Link>
        </div>
      )}

      {producto && (
        <FichaProducto
          key={producto.id}
          producto={producto}
          alActualizar={(saldo) =>
            setProducto((p) => (p ? { ...p, existencia: saldo } : p))
          }
        />
      )}

      {camara && (
        <CamaraLector
          alDetectar={(valor) => {
            setCamara(false);
            setCodigo(valor);
            void buscar(valor);
          }}
          alCerrar={() => setCamara(false)}
        />
      )}
    </div>
  );
}

function FichaProducto({
  producto,
  alActualizar,
}: {
  producto: ProductoEscaneado;
  alActualizar: (saldo: number) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [tipo, setTipo] = useState("SALIDA");
  const [cantidad, setCantidad] = useState("");
  const [resultado, setResultado] = useState<
    { error: string } | { saldo: number } | null
  >(null);

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setResultado(null);
    startTransition(async () => {
      const r = await registrarMovimientoRapido(undefined, fd);
      if (r?.error) {
        setResultado({ error: r.error });
      } else if (r?.ok && typeof r.saldo === "number") {
        alActualizar(r.saldo);
        setCantidad("");
        setResultado({ saldo: r.saldo });
      }
    });
  }

  return (
    <section className="mt-5 overflow-hidden rounded-lg border border-borde bg-white">
      <div className="border-b border-borde bg-papel px-4 py-3">
        <div className="flex items-start gap-3">
          {producto.foto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={producto.foto}
              alt=""
              className="h-14 w-14 shrink-0 rounded-md border border-borde object-cover"
            />
          )}
          <div className="min-w-0">
            <p className="font-mono text-[11px] tracking-widest text-tinta-suave">
              {producto.sku}
              {producto.codigoBarras ? ` · EAN ${producto.codigoBarras}` : ""} ·{" "}
              {producto.categoria.toUpperCase()}
            </p>
            <h2 className="mt-0.5 text-lg leading-snug font-bold">
              {producto.nombre}
            </h2>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="font-mono text-2xl font-bold">
            {producto.existencia}{" "}
            <span className="text-sm font-normal text-tinta-suave">
              {producto.unidad}
            </span>
          </span>
          <Semaforo
            existencia={producto.existencia}
            stockMinimo={producto.stockMinimo}
          />
          <span className="text-xs text-tinta-suave">
            mín. {producto.stockMinimo}
            {producto.ubicacion ? ` · ubicación ${producto.ubicacion}` : ""}
          </span>
          <span className="ml-auto flex gap-3 text-sm font-semibold text-ambar">
            <Link
              href={`/productos/${producto.id}/etiqueta`}
              className="hover:underline"
            >
              ⌑ Etiqueta
            </Link>
            <Link href={`/productos/${producto.id}`} className="hover:underline">
              Ver ficha completa
            </Link>
          </span>
        </div>
      </div>

      {!producto.activo ? (
        <p className="px-4 py-4 text-sm text-tinta-suave">
          Este producto está desactivado y no admite movimientos.
        </p>
      ) : (
        <form onSubmit={enviar} className="flex flex-col gap-3 px-4 py-4">
          <input type="hidden" name="productoId" value={producto.id} />
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { valor: "ENTRADA", texto: "Entrada", activo: "border-verde bg-verde-claro text-verde" },
                { valor: "SALIDA", texto: "Salida", activo: "border-rojo bg-rojo-claro text-rojo" },
                { valor: "AJUSTE", texto: "Conteo", activo: "border-ambar bg-ambar-claro text-ambar" },
              ] as const
            ).map((op) => (
              <label
                key={op.valor}
                className={`cursor-pointer rounded-md border px-3 py-2.5 text-center text-sm font-semibold transition ${
                  tipo === op.valor
                    ? op.activo
                    : "border-borde bg-white text-tinta-suave"
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
          <div className="flex gap-2">
            <input
              name="cantidad"
              type="number"
              min={0}
              required
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder={
                tipo === "AJUSTE" ? "Existencia contada" : "Cantidad"
              }
              className={`${claseInput} font-mono text-lg`}
              aria-label={tipo === "AJUSTE" ? "Existencia contada" : "Cantidad"}
            />
            <button
              type="submit"
              disabled={pending}
              className={`${claseBotonPrincipal} shrink-0 px-5 disabled:opacity-50`}
            >
              {pending ? "..." : "Registrar"}
            </button>
          </div>
          <input
            name="motivo"
            placeholder="Motivo (opcional): vale, factura, conteo..."
            className={claseInput}
          />
          {tipo === "AJUSTE" && (
            <p className="text-xs text-tinta-suave">
              Conteo físico: escribe lo que hay de verdad en el estante y el
              sistema registra la diferencia como ajuste firmado por ti.
            </p>
          )}
          {resultado && "error" in resultado && (
            <p className="rounded-md bg-rojo-claro px-3 py-2 text-sm text-rojo">
              {resultado.error}
            </p>
          )}
          {resultado && "saldo" in resultado && (
            <p className="rounded-md bg-verde-claro px-3 py-2 text-sm font-semibold text-verde">
              Registrado. Existencia ahora: {resultado.saldo} {producto.unidad}.
            </p>
          )}
        </form>
      )}
    </section>
  );
}

function CamaraLector({
  alDetectar,
  alCerrar,
}: {
  alDetectar: (valor: string) => void;
  alCerrar: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let intervalo: ReturnType<typeof setInterval> | null = null;
    let cancelado = false;

    async function iniciar() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelado || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const Detector = window.BarcodeDetector;
        if (!Detector) {
          setError("Este navegador no trae lector de códigos.");
          return;
        }
        const detector = new Detector({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "qr_code"],
        });
        intervalo = setInterval(async () => {
          if (!videoRef.current || cancelado) return;
          try {
            const codigos = await detector.detect(videoRef.current);
            const valor = codigos[0]?.rawValue;
            if (valor) {
              vibrar();
              alDetectar(valor);
            }
          } catch {
            /* fotograma no válido; seguir intentando */
          }
        }, 350);
      } catch {
        setError("No se pudo abrir la cámara. Revisa el permiso.");
      }
    }
    void iniciar();
    return () => {
      cancelado = true;
      if (intervalo) clearInterval(intervalo);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [alDetectar]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 p-4">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <p className="py-2 text-center text-sm font-semibold text-white">
          Apunta al código de barras
        </p>
        <div className="relative flex-1 overflow-hidden rounded-lg border-2 border-ambar">
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        </div>
        {error && (
          <p className="mt-3 rounded-md bg-rojo-claro px-3 py-2 text-sm text-rojo">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={alCerrar}
          className="mt-4 rounded-md bg-white px-4 py-3 font-semibold text-tinta"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
