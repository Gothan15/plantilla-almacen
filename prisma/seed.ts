import { encriptarClave } from "../src/lib/claves";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

// Datos de ejemplo: un almacén pequeño de víveres y útiles, con su
// libro de movimientos de la última semana ya poblado para que el
// panel se vea trabajando desde el primer día.
// Usuarios: admin@almacen.cu   / admin123   (ADMIN)
//           almacen@almacen.cu / almacen123 (ALMACENERO)
async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@almacen.cu" },
    update: {},
    create: {
      nombre: "Marta Delgado",
      email: "admin@almacen.cu",
      password: await encriptarClave("admin123"),
      rol: "ADMIN",
    },
  });
  const almacenero = await prisma.user.upsert({
    where: { email: "almacen@almacen.cu" },
    update: {},
    create: {
      nombre: "José Luis Peña",
      email: "almacen@almacen.cu",
      password: await encriptarClave("almacen123"),
      rol: "ALMACENERO",
    },
  });

  const categoriasNombres = [
    "Alimentos",
    "Bebidas",
    "Limpieza e higiene",
    "Ferretería ligera",
    "Útiles y papelería",
  ];
  const categorias: Record<string, { id: number }> = {};
  for (const nombre of categoriasNombres) {
    categorias[nombre] = await prisma.categoria.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }

  const proveedoresDatos = [
    { nombre: "Distribuidora Caribe", contacto: "Ana Rosa Gil", telefono: "53214567", notas: "Entrega martes y viernes" },
    { nombre: "Suministros Habana S.R.L.", contacto: "Pedro Santiesteban", telefono: "54128790", notas: "Pedir con 3 días de antelación" },
    { nombre: "Mayorista El Puente", contacto: "Yamila Torres", telefono: "55872341" },
    { nombre: "Comercial Vega", contacto: "Ernesto Vega", telefono: "52990123", notas: "Solo ferretería y papelería" },
  ];
  const proveedores: Record<string, { id: number }> = {};
  for (const p of proveedoresDatos) {
    const existe = await prisma.proveedor.findFirst({ where: { nombre: p.nombre } });
    proveedores[p.nombre] =
      existe ?? (await prisma.proveedor.create({ data: p }));
  }

  type Prod = {
    sku: string;
    nombre: string;
    categoria: string;
    proveedor: string;
    unidad: string;
    costo: number;
    venta: number;
    minimo: number;
    ubicacion: string;
  };
  const productosDatos: Prod[] = [
    { sku: "ALM-001", nombre: "Arroz blanco, saco de 25 kg", categoria: "Alimentos", proveedor: "Distribuidora Caribe", unidad: "saco", costo: 4200, venta: 4800, minimo: 5, ubicacion: "A-1" },
    { sku: "ALM-002", nombre: "Aceite vegetal 1 L", categoria: "Alimentos", proveedor: "Distribuidora Caribe", unidad: "u", costo: 850, venta: 980, minimo: 24, ubicacion: "A-2" },
    { sku: "ALM-003", nombre: "Azúcar refino, saco de 25 kg", categoria: "Alimentos", proveedor: "Suministros Habana S.R.L.", unidad: "saco", costo: 3900, venta: 4500, minimo: 4, ubicacion: "A-1" },
    { sku: "ALM-004", nombre: "Café molido 500 g", categoria: "Alimentos", proveedor: "Suministros Habana S.R.L.", unidad: "paquete", costo: 620, venta: 750, minimo: 20, ubicacion: "A-3" },
    { sku: "ALM-005", nombre: "Leche en polvo 1 kg", categoria: "Alimentos", proveedor: "Distribuidora Caribe", unidad: "paquete", costo: 1450, venta: 1680, minimo: 12, ubicacion: "A-3" },
    { sku: "BEB-001", nombre: "Refresco de cola 1,5 L (caja x 6)", categoria: "Bebidas", proveedor: "Mayorista El Puente", unidad: "caja", costo: 1560, venta: 1800, minimo: 6, ubicacion: "B-1" },
    { sku: "BEB-002", nombre: "Agua mineral 500 mL (caja x 12)", categoria: "Bebidas", proveedor: "Mayorista El Puente", unidad: "caja", costo: 720, venta: 900, minimo: 8, ubicacion: "B-1" },
    { sku: "LIM-001", nombre: "Detergente en polvo 1 kg", categoria: "Limpieza e higiene", proveedor: "Suministros Habana S.R.L.", unidad: "paquete", costo: 480, venta: 560, minimo: 15, ubicacion: "C-2" },
    { sku: "LIM-002", nombre: "Jabón de baño 100 g", categoria: "Limpieza e higiene", proveedor: "Distribuidora Caribe", unidad: "u", costo: 120, venta: 150, minimo: 30, ubicacion: "C-1" },
    { sku: "LIM-003", nombre: "Lejía 1 L", categoria: "Limpieza e higiene", proveedor: "Mayorista El Puente", unidad: "u", costo: 210, venta: 260, minimo: 12, ubicacion: "C-2" },
    { sku: "FER-001", nombre: "Bombillo LED 9 W", categoria: "Ferretería ligera", proveedor: "Comercial Vega", unidad: "u", costo: 340, venta: 420, minimo: 10, ubicacion: "D-1" },
    { sku: "FER-002", nombre: "Cinta aislante, rollo de 10 m", categoria: "Ferretería ligera", proveedor: "Comercial Vega", unidad: "rollo", costo: 95, venta: 130, minimo: 20, ubicacion: "D-1" },
    { sku: "PAP-001", nombre: "Papel bond A4, resma de 500", categoria: "Útiles y papelería", proveedor: "Comercial Vega", unidad: "paquete", costo: 1100, venta: 1350, minimo: 6, ubicacion: "D-2" },
  ];

  const productos: Record<string, { id: number }> = {};
  for (const p of productosDatos) {
    productos[p.sku] = await prisma.producto.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        sku: p.sku,
        nombre: p.nombre,
        categoriaId: categorias[p.categoria].id,
        proveedorId: proveedores[p.proveedor].id,
        unidad: p.unidad,
        precioCosto: p.costo,
        precioVenta: p.venta,
        stockMinimo: p.minimo,
        ubicacion: p.ubicacion,
        existencia: 0,
      },
    });
  }

  // Libro de la última semana. Solo se siembra si está vacío, para
  // no duplicar movimientos si el seed se corre dos veces.
  const yaHay = await prisma.movimiento.count();
  if (yaHay === 0) {
    const saldos = new Map<number, number>();
    async function registrar(
      sku: string,
      tipo: "ENTRADA" | "SALIDA" | "AJUSTE",
      delta: number,
      diasAtras: number,
      hora: number,
      motivo: string,
      usuarioId: number,
      conProveedor = false
    ) {
      const prod = await prisma.producto.findUnique({
        where: { sku },
        select: { id: true, proveedorId: true },
      });
      if (!prod) return;
      const saldo = (saldos.get(prod.id) ?? 0) + delta;
      saldos.set(prod.id, saldo);
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - diasAtras);
      fecha.setHours(hora, 15, 0, 0);
      await prisma.movimiento.create({
        data: {
          tipo,
          productoId: prod.id,
          cantidad: delta,
          saldoResultante: saldo,
          motivo,
          usuarioId,
          proveedorId: conProveedor ? prod.proveedorId : null,
          creadoEn: fecha,
        },
      });
      await prisma.producto.update({
        where: { id: prod.id },
        data: { existencia: saldo },
      });
    }

    const A = admin.id;
    const J = almacenero.id;
    // Día −6: apertura del libro con las existencias iniciales
    await registrar("ALM-001", "ENTRADA", 18, 6, 9, "Existencia inicial", A, true);
    await registrar("ALM-002", "ENTRADA", 96, 6, 9, "Existencia inicial", A, true);
    await registrar("ALM-003", "ENTRADA", 12, 6, 9, "Existencia inicial", A, true);
    await registrar("ALM-004", "ENTRADA", 60, 6, 9, "Existencia inicial", A, true);
    await registrar("ALM-005", "ENTRADA", 40, 6, 9, "Existencia inicial", A, true);
    await registrar("BEB-001", "ENTRADA", 20, 6, 10, "Existencia inicial", A, true);
    await registrar("BEB-002", "ENTRADA", 25, 6, 10, "Existencia inicial", A, true);
    await registrar("LIM-001", "ENTRADA", 45, 6, 10, "Existencia inicial", A, true);
    await registrar("LIM-002", "ENTRADA", 120, 6, 10, "Existencia inicial", A, true);
    await registrar("LIM-003", "ENTRADA", 36, 6, 10, "Existencia inicial", A, true);
    await registrar("FER-001", "ENTRADA", 30, 6, 11, "Existencia inicial", A, true);
    await registrar("FER-002", "ENTRADA", 50, 6, 11, "Existencia inicial", A, true);
    await registrar("PAP-001", "ENTRADA", 15, 6, 11, "Existencia inicial", A, true);
    // Día −5
    await registrar("ALM-002", "SALIDA", -24, 5, 10, "Vale de salida para la tienda", J);
    await registrar("LIM-002", "SALIDA", -40, 5, 12, "Vale de salida para la tienda", J);
    await registrar("BEB-001", "SALIDA", -6, 5, 16, "Pedido del café de la esquina", J);
    // Día −4
    await registrar("ALM-001", "SALIDA", -4, 4, 9, "Venta a cliente mayorista", J);
    await registrar("ALM-004", "ENTRADA", 30, 4, 11, "Compra semanal, factura 2214", J, true);
    await registrar("FER-001", "SALIDA", -12, 4, 13, "Vale de salida para la tienda", J);
    // Día −3
    await registrar("LIM-003", "SALIDA", -18, 3, 10, "Vale de salida para la tienda", J);
    await registrar("ALM-005", "SALIDA", -10, 3, 12, "Pedido de la cafetería El Sol", J);
    await registrar("PAP-001", "SALIDA", -3, 3, 15, "Uso interno, oficina", A);
    // Día −2
    await registrar("ALM-003", "ENTRADA", 6, 2, 9, "Compra, factura 0891", J, true);
    await registrar("FER-001", "SALIDA", -18, 2, 11, "Venta a cliente mayorista", J);
    await registrar("LIM-002", "SALIDA", -35, 2, 16, "Vale de salida para la tienda", J);
    // Día −1
    await registrar("LIM-003", "SALIDA", -15, 1, 10, "Vale de salida para la tienda", J);
    await registrar("BEB-002", "SALIDA", -5, 1, 12, "Pedido del café de la esquina", J);
    await registrar("ALM-002", "ENTRADA", 48, 1, 14, "Compra semanal, factura 2230", J, true);
    await registrar("FER-002", "AJUSTE", -2, 1, 17, "Conteo físico: dos rollos dañados por humedad", A);
    // Hoy
    await registrar("LIM-002", "SALIDA", -15, 0, 9, "Vale de salida para la tienda", J);
    await registrar("ALM-004", "SALIDA", -8, 0, 10, "Pedido de la cafetería El Sol", J);
  }

  console.log("Seed listo:", { admin: admin.email, almacenero: almacenero.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
