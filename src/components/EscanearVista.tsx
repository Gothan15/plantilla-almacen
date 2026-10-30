"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { registrarMovimientoRapido } from "@/app/actions/movimientos";
import {
  buscarEnCache,
  guardarCola,
  guardarEnCache,
  leerCola,
  type ItemCola,
} from "@/lib/cola";
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
  almacenId: number;
  almacenNombre: string;
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
  const [candidatos, setCandidatos] = useState<ProductoEscaneado[] | null>(null);
  const [desdeCache, setDesdeCache] = useState(false);
  const [cola, setCola] = useState<ItemCola[]>([]);
  const [enLinea, setEnLinea] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Envía los movimientos guardados sin conexión, en orden. Los que
  // el servidor rechaza (p. ej. ya no hay existencia) quedan marcados
  // con el motivo para que la persona decida.
  async function procesarCola() {
    const items = leerCola();
    if (items.length === 0) return;
    setSincronizando(true);
    const restantes: ItemCola[] = [];
    for (const item of items) {
      if (item.estado === "error") {
        restantes.push(item);
        continue;
      }
      try {
        const r = await fetch("/api/movimientos/rapido", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productoId: item.productoId,
            tipo: item.tipo,
            cantidad: item.cantidad,
            motivo: item.motivo,
          }),
        });
        const datos = (await r.json()) as { ok?: boolean; error?: string };
        if (!datos.ok) {
          restantes.push({
            ...item,
            estado: "error",
            error: datos.error ?? "El servidor lo rechazó.",
          });
        }
      } catch {
        restantes.push(item); // sigue sin conexión: queda pendiente
      }
    }
    guardarCola(restantes);
    setCola(restantes);
    setSincronizando(false);
  }

  useEffect(() => {
    const alConectar = () => {
      setEnLinea(true);
      void procesarCola();
    };
    const alDesconectar = () => setEnLinea(false);
    window.addEventListener("online", alConectar);
    window.addEventListener("offline", alDesconectar);
    const intervalo = setInterval(() => void procesarCola(), 30000);
    void (async () => {
      setCola(leerCola());
      setEnLinea(navigator.onLine);
      await procesarCola();
    })();
    return () => {
      window.removeEventListener("online", alConectar);
      window.removeEventListener("offline", alDesconectar);
      clearInterval(intervalo);
    };
    // procesarCola lee localStorage y la red; no es dependencia reactiva.
  }, []);

  function encolar(item: Omit<ItemCola, "id" | "ts" | "estado">) {
    const nuevo: ItemCola = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ts: Date.now(),
      estado: "pendiente",
    };
    const items = [...leerCola(), nuevo];
    guardarCola(items);
    setCola(items);
  }

  async function buscar(valor: string) {
    const limpio = valor.trim();
    if (!limpio) return;
    setBuscando(true);
    setNoEncontrado(null);
    setCandidatos(null);
    setDesdeCache(false);
    try {
      const r = await fetch(
        `/api/productos/por-codigo?codigo=${encodeURIComponent(limpio)}`
      );
      const datos = (await r.json()) as { productos: ProductoEscaneado[] };
      const encontrados = datos.productos ?? [];
      for (const p of encontrados) {
        if (p.codigoBarras) guardarEnCache(p.codigoBarras, p);
        guardarEnCache(p.sku, p);
      }
      if (encontrados.length === 1) {
        vibrar();
        setProducto(encontrados[0]);
      } else if (encontrados.length > 1) {
        vibrar();
        setProducto(null);
        setCandidatos(encontrados);
      } else {
        setProducto(null);
        setNoEncontrado(limpio);
      }
    } catch {
      // Sin conexión: se busca en las fichas guardadas del teléfono.
      const guardado = buscarEnCache<ProductoEscaneado>(limpio);
      if (guardado) {
        vibrar();
        setProducto(guardado);
        setDesdeCache(true);
      } else {
        setProducto(null);
        setAvisoCamara(
          "Sin conexión y este código no está guardado en el teléfono. Búscalo una vez con conexión para poder usarlo sin red."
        );
      }
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

      <div className="mt-3 flex items-center gap-2 text-xs">
        <span
          className={`inline-block h-2 w-2 rounded-full ${enLinea ? "bg-verde" : "bg-rojo"}`}
        />
        <span className="text-tinta-suave">
          {enLinea
            ? "Con conexión al servidor"
            : "Sin conexión: los movimientos se guardan en el teléfono"}
        </span>
      </div>

      {cola.length > 0 && (
        <div className="mt-3 rounded-lg border border-ambar bg-ambar-claro px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="flex-1 text-sm font-semibold">
              {cola.length} movimiento(s) esperando sincronización
            </p>
            <button
              type="button"
              disabled={sincronizando}
              onClick={() => void procesarCola()}
              className="rounded-md bg-ambar px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
            >
              {sincronizando ? "Enviando..." : "Enviar ahora"}
            </button>
          </div>
          <ul className="mt-2 flex flex-col gap-1.5">
            {cola.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-2 rounded bg-white/70 px-2.5 py-1.5 text-xs"
              >
                <span className="font-mono font-bold">
                  {item.tipo === "SALIDA" ? "−" : item.tipo === "ENTRADA" ? "+" : "="}
                  {item.cantidad}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {item.nombre}
                  {item.estado === "error" && (
                    <span className="block text-rojo">{item.error}</span>
                  )}
                </span>
                {item.estado === "error" && (
                  <button
                    type="button"
                    className="font-semibold text-ambar"
                    onClick={() => {
                      const items = leerCola().map((x) =>
                        x.id === item.id
                          ? { ...x, estado: "pendiente" as const, error: undefined }
                          : x
                      );
                      guardarCola(items);
                      setCola(items);
                      void procesarCola();
                    }}
                  >
                    Reintentar
                  </button>
                )}
                <button
                  type="button"
                  className="font-semibold text-rojo"
                  onClick={() => {
                    const items = leerCola().filter((x) => x.id !== item.id);
                    guardarCola(items);
                    setCola(items);
                  }}
                >
                  Descartar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {candidatos && (
        <div className="mt-5 rounded-lg border border-borde bg-white px-4 py-4">
          <p className="font-semibold">
            Ese código existe en {candidatos.length} almacenes. ¿Cuál es el
            tuyo?
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {candidatos.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setProducto(c);
                  setCandidatos(null);
                }}
                className="rounded-md border border-borde px-3 py-2.5 text-left transition hover:border-ambar"
              >
                <span className="block font-semibold">{c.almacenNombre}</span>
                <span className="block text-sm text-tinta-suave">
                  {c.nombre} · quedan {c.existencia} {c.unidad}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

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

      {producto && desdeCache && (
        <p className="mt-5 rounded-md bg-ambar-claro px-3 py-2 text-sm">
          Ficha guardada en el teléfono (sin conexión): la existencia puede
          haber cambiado en el servidor.
        </p>
      )}
      {producto && (
        <FichaProducto
          key={producto.id}
          producto={producto}
          encolar={encolar}
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
  encolar,
}: {
  producto: ProductoEscaneado;
  alActualizar: (saldo: number) => void;
  encolar: (item: {
    productoId: number;
    codigo: string;
    nombre: string;
    tipo: string;
    cantidad: number;
    motivo: string | null;
  }) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [tipo, setTipo] = useState("SALIDA");
  const [cantidad, setCantidad] = useState("");
  const [resultado, setResultado] = useState<
    { error: string } | { saldo: number } | { encolado: true } | null
  >(null);

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const motivo = String(fd.get("motivo") ?? "").trim() || null;
    const cantidadNum = Math.trunc(Number(fd.get("cantidad")) || 0);
    setResultado(null);

    const guardarEnCola = () => {
      encolar({
        productoId: producto.id,
        codigo: producto.codigoBarras ?? producto.sku,
        nombre: `${producto.nombre} (${producto.almacenNombre})`,
        tipo,
        cantidad: cantidadNum,
        motivo,
      });
      // Saldo optimista en pantalla: el real se confirma al sincronizar.
      const saldo =
        tipo === "AJUSTE"
          ? cantidadNum
          : tipo === "ENTRADA"
            ? producto.existencia + cantidadNum
            : producto.existencia - cantidadNum;
      alActualizar(saldo);
      setCantidad("");
      setResultado({ encolado: true });
    };

    if (!navigator.onLine) {
      guardarEnCola();
      return;
    }
    startTransition(async () => {
      try {
        const r = await registrarMovimientoRapido(undefined, fd);
        if (r?.error) {
          setResultado({ error: r.error });
        } else if (r?.ok && typeof r.saldo === "number") {
          alActualizar(r.saldo);
          setCantidad("");
          setResultado({ saldo: r.saldo });
        }
      } catch {
        guardarEnCola(); // se cayó la conexión a mitad de camino
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
              {producto.categoria.toUpperCase()} ·{" "}
              {producto.almacenNombre.toUpperCase()}
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
          {resultado && "encolado" in resultado && (
            <p className="rounded-md bg-ambar-claro px-3 py-2 text-sm font-semibold">
              Sin conexión: quedó guardado en la cola del teléfono y se
              registrará solo cuando vuelva la red.
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
