import { estadoStock, type EstadoStock } from "@/lib/formato";

// Semáforo de stock, como el de las tarjetas de estiba:
// punto de color + palabra corta.
const ESTILOS: Record<EstadoStock, { punto: string; clase: string; texto: string }> = {
  ok: { punto: "bg-verde", clase: "bg-verde-claro text-verde", texto: "En stock" },
  bajo: { punto: "bg-ambar", clase: "bg-ambar-claro text-ambar", texto: "Stock bajo" },
  agotado: { punto: "bg-rojo", clase: "bg-rojo-claro text-rojo", texto: "Agotado" },
};

export function Semaforo({
  existencia,
  stockMinimo,
}: {
  existencia: number;
  stockMinimo: number;
}) {
  const estado = estadoStock(existencia, stockMinimo);
  const e = ESTILOS[estado];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${e.clase}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${e.punto}`} />
      {e.texto}
    </span>
  );
}

export function Encabezado({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start gap-3">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
        {descripcion && (
          <p className="mt-0.5 text-sm text-tinta-suave">{descripcion}</p>
        )}
      </div>
      {children}
    </div>
  );
}

export const claseBotonPrincipal =
  "rounded-md bg-carbon px-4 py-2 text-sm font-semibold text-white transition hover:bg-carbon-suave";
export const claseBotonSecundario =
  "rounded-md border border-borde bg-white px-4 py-2 text-sm font-medium transition hover:border-tinta-suave";
export const claseInput =
  "w-full rounded-md border border-borde bg-white px-3 py-2 text-sm outline-none focus:border-ambar";
export const claseLabel = "mb-1 block text-sm font-medium";
