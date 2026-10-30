// Formato de números, dinero y fechas para todo el panel.

export function dinero(valor: number | string | { toString(): string }): string {
  const n = typeof valor === "number" ? valor : Number(valor.toString());
  return n.toLocaleString("es-CU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function entero(n: number): string {
  return n.toLocaleString("es-CU");
}

export function fechaCorta(fecha: Date): string {
  return fecha.toLocaleDateString("es-CU", {
    day: "numeric",
    month: "short",
  });
}

export function fechaHora(fecha: Date): string {
  return fecha.toLocaleString("es-CU", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function folio(id: number): string {
  return `#${String(id).padStart(4, "0")}`;
}

// Estado de stock de un producto: agotado / bajo / ok.
export type EstadoStock = "agotado" | "bajo" | "ok";

export function estadoStock(existencia: number, stockMinimo: number): EstadoStock {
  if (existencia <= 0) return "agotado";
  if (existencia <= stockMinimo) return "bajo";
  return "ok";
}
