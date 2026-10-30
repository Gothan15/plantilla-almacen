# Plantilla de almacén e inventario

Plantilla que construí para negocios que necesitan llevar el control
de un almacén o de cualquier cosa que entre y salga: una tienda, un
taller, un depósito de una mipyme. Trae login con roles, catálogo de
productos, libro de movimientos con entradas, salidas y ajustes,
alertas de stock bajo, proveedores y reportes con exportación a CSV.

No es un demo de mentira: la existencia de cada producto se mueve
solo a través de movimientos registrados, cada movimiento queda
firmado por el usuario que lo hizo con el saldo que quedó después,
y una salida mayor que la existencia se rechaza. Si mañana hay que
cuadrar el almacén contra el papel, el libro está aquí.

## Qué incluye

- **Login con sesión JWT y dos roles**: Administrador (todo, más
  gestión de usuarios y desactivar productos) y Almacenero (la
  operación diaria).
- **Panel que abre con lo urgente**: productos agotados o bajo el
  stock mínimo con acceso directo a registrar su entrada, cifras
  generales, flujo de entradas/salidas de los últimos 7 días y los
  últimos movimientos.
- **Productos**: código SKU y **código de barras de fábrica (EAN)**,
  categoría, proveedor habitual, unidad (u, kg, caja, saco...),
  ubicación en el almacén, precios de costo y venta, stock mínimo.
  Búsqueda por nombre, SKU o código de barras, y filtros por
  categoría y estado de stock.
- **Página de escaneo** (`/escanear`): lee el código con la cámara
  (BarcodeDetector en Chrome/Android, ML Kit dentro de la app móvil)
  o con pistola USB, muestra la ficha y registra entrada, salida o
  conteo físico sin salir de la pantalla. Si el código no existe,
  ofrece crear el producto con el código ya puesto.
- **App Android compañera** (carpeta `movil/`): envoltura Capacitor
  de esta misma web con escáner ML Kit nativo; se compila en un APK
  instalable sin Play Store. Instrucciones en `movil/README.md`.
- **Libro de movimientos**: entradas, salidas y ajustes por conteo
  físico. El ajuste pide la existencia real contada y el sistema
  calcula y registra la diferencia. Folio correlativo en todo.
- **Categorías y proveedores**: CRUD completo; lo que está en uso no
  se puede borrar, para no dejar el historial cojo.
- **Reportes**: entradas/salidas/ajustes del mes, valor del
  inventario por categoría, productos con más valor en almacén y
  productos sin movimiento en 30 días. Inventario y libro completos
  descargables en CSV.
- **Usuarios** (solo administrador): crear, cambiar rol y
  contraseña, con la regla de que quien tiene movimientos firmados
  no se elimina.

## Cómo se adapta a otro negocio

Casi todo es datos, no código: el nombre del negocio y la moneda
salen de `src/lib/config.ts`, y categorías, productos y proveedores
se cargan desde el panel o editando `prisma/seed.ts`. El diseño
(papel, carbón, ámbar, tipografía mono para códigos y cifras) está
documentado en `INSPIRACION.md` por si quieres cambiar la identidad
sin tocar la lógica.

## Puesta en marcha

Necesitas Node 20+ y una base PostgreSQL (local o gratis en Neon o
Supabase).

```bash
cp .env.example .env   # rellena DATABASE_URL y SESSION_SECRET
npm install
npm run db:push        # crea las tablas
npm run db:seed        # usuarios y datos de ejemplo
npm run dev            # http://localhost:3000
```

Usuarios tras el seed:

| Correo | Contraseña | Rol |
| --- | --- | --- |
| admin@almacen.cu | admin123 | Administrador |
| almacen@almacen.cu | almacen123 | Almacenero |

El seed trae un almacén de ejemplo ya trabajando: 13 productos en 5
categorías, 4 proveedores y el libro de la última semana poblado,
con un producto agotado y dos en stock bajo para ver las alertas.

## Tecnología

Next.js 16 (App Router, Server Actions) + TypeScript + Tailwind
CSS 4 + Prisma 6 con PostgreSQL. Sesión con cookie firmada (jose) y
contraseñas con bcrypt. Sin librerías de gráficos: las barras del
panel son CSS.

## Lo que falta (siendo honesto)

- La app móvil necesita conexión con el servidor (WiFi o internet);
  el modo sin conexión con cola de movimientos queda para la v2.
- No lleva control por lotes ni fechas de vencimiento; para
  alimentos perecederos habría que añadir el modelo Lote.
- Los reportes son del mes en curso; un selector de rango de fechas
  es el siguiente paso natural.
- Sin pruebas automatizadas todavía; la lógica crítica (que ninguna
  salida deje el stock en negativo) está concentrada en
  `src/app/actions/movimientos.ts` para poder probarla primero.
