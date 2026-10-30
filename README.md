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
- **Foto por producto**: se sube desde el formulario y se reduce en
  el navegador a 720 px (JPEG) antes de guardarse; aparece en la
  lista, la ficha y la pantalla de escaneo. Se guarda como data URL
  en la base para que la plantilla no dependa de ningún servicio
  externo; en un despliegue grande, este es el punto donde se
  cambiaría por un almacén de objetos.
- **Etiquetas imprimibles**: desde la ficha, una hoja de etiquetas
  de 70 × 40 mm con nombre del negocio, producto, precio y el código
  de barras dibujado (el EAN de fábrica si lo trae; si no, un Code128
  con el SKU que el propio escáner sabe leer).
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
- **Varios almacenes** (v2): cada producto vive en un local; el
  panel tiene un selector «Viendo» que filtra productos, libro,
  panel y reportes por almacén (o muestra todos). Los locales los
  crea el administrador; uno con stock dentro no se puede
  desactivar.
- **Traspasos entre almacenes** (v2): mover mercancía de un local a
  otro deja dos asientos TRASPASO enlazados en el libro (la salida
  aquí y la entrada allá). Si el producto no existe en el destino,
  se crea su ficha con los mismos datos.
- **Órdenes de compra y de venta** (v2): documentos con líneas que
  nacen en BORRADOR sin tocar el stock. Al confirmar, cada línea se
  aplica como asiento del libro (entrada en compras, salida en
  ventas) y la orden queda cerrada con sus asientos a la vista. Una
  venta que pida más de lo que hay no se puede confirmar.
- **Modo sin conexión en el escáner** (v2): si se cae la red, la
  página de escaneo guarda los movimientos en una cola en el propio
  teléfono y los envía solos al volver la conexión; los que el
  servidor rechace quedan marcados con el motivo para decidir. Las
  fichas ya vistas se guardan en el teléfono, así que un código ya
  conocido se puede identificar y registrar sin red. Si un código
  existe en varios almacenes, el escáner pregunta cuál es el tuyo.

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

El seed trae el negocio de ejemplo ya trabajando: dos almacenes
(el Central y un Depósito Anexo con dos productos espejo), 13
productos en 5 categorías, 4 proveedores, el libro de la última
semana poblado —con un producto agotado y dos en stock bajo para
ver las alertas— y una orden de compra en borrador de ejemplo.

## Tecnología

Next.js 16 (App Router, Server Actions) + TypeScript + Tailwind
CSS 4 + Prisma 6 con PostgreSQL. Sesión con cookie firmada (jose) y
contraseñas con bcrypt. Sin librerías de gráficos: las barras del
panel son CSS.

## Lo que falta (siendo honesto)

- La cola sin conexión guarda el trabajo del escáner, pero la app
  sigue necesitando conexión para consultar fichas nuevas y para el
  resto del panel; no es un modo offline completo con réplica local.
- No lleva control por lotes ni fechas de vencimiento; para
  alimentos perecederos habría que añadir el modelo Lote.
- Los reportes son del mes en curso; un selector de rango de fechas
  es el siguiente paso natural.
- Sin pruebas automatizadas todavía; la lógica crítica (que ninguna
  salida deje el stock en negativo, traspasos, confirmación de
  órdenes) está concentrada en `src/lib/movimientos-core.ts` para
  poder probarla primero.
