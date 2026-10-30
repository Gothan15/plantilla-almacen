// Cola offline del teléfono (solo cliente): cuando no hay conexión
// con el servidor, los movimientos del escáner se guardan aquí, en
// localStorage, y se envían en orden cuando la conexión vuelve.
// También se guarda la última ficha vista de cada producto, para
// poder identificarlo escaneando sin conexión.

export type ItemCola = {
  id: string;
  productoId: number;
  codigo: string;
  nombre: string;
  tipo: string; // ENTRADA | SALIDA | AJUSTE
  cantidad: number;
  motivo: string | null;
  ts: number;
  estado: "pendiente" | "error";
  error?: string;
};

const CLAVE_COLA = "almacen:cola";
const CLAVE_CACHE = "almacen:cache";

export function leerCola(): ItemCola[] {
  try {
    const crudo = localStorage.getItem(CLAVE_COLA);
    const datos = crudo ? (JSON.parse(crudo) as ItemCola[]) : [];
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

export function guardarCola(items: ItemCola[]) {
  try {
    localStorage.setItem(CLAVE_COLA, JSON.stringify(items));
  } catch {
    /* almacenamiento lleno o bloqueado: la cola vive en memoria */
  }
}

type CacheProductos = Record<string, unknown>;

export function leerCache(): CacheProductos {
  try {
    const crudo = localStorage.getItem(CLAVE_CACHE);
    return crudo ? (JSON.parse(crudo) as CacheProductos) : {};
  } catch {
    return {};
  }
}

export function guardarEnCache(clave: string, producto: unknown) {
  try {
    const cache = leerCache();
    cache[clave.toUpperCase()] = producto;
    // Tope prudente: las últimas 200 fichas.
    const claves = Object.keys(cache);
    if (claves.length > 200) {
      for (const k of claves.slice(0, claves.length - 200)) delete cache[k];
    }
    localStorage.setItem(CLAVE_CACHE, JSON.stringify(cache));
  } catch {
    /* sin caché no pasa nada: solo se pierde el modo offline de fichas */
  }
}

export function buscarEnCache<T>(clave: string): T | null {
  const cache = leerCache();
  return (cache[clave.toUpperCase()] as T) ?? null;
}
