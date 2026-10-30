# App Android del almacén

La compañera móvil de la plantilla: una envoltura **Capacitor** de la
misma aplicación web, con escáner de códigos de barras nativo
(**ML Kit de Google**, funciona sin internet). No duplica pantallas ni
datos: lo que registras con el teléfono aparece al momento en la
computadora, firmado con tu mismo usuario.

## Antes de compilar: la dirección del servidor

La app necesita saber dónde está el panel. Edita `capacitor.config.ts`:

```ts
server: {
  url: "http://192.168.1.50:3000", // ← tu dirección
  cleartext: true,
}
```

- **Para probar en casa:** la IP de la computadora que corre el panel, en
  el mismo WiFi (ej. `http://192.168.1.50:3000`).
- **Para usarla de verdad:** la URL del despliegue (ej.
  `https://tu-almacen.vercel.app`). Con https puedes quitar `cleartext`.

## Compilar el APK

Requisitos: Node 20+ y Android Studio (o el SDK de Android) instalados.

```bash
cd movil
npm install
npm run apk:debug
```

El APK queda en
`android/app/build/outputs/apk/debug/app-debug.apk`. Se instala en
cualquier Android pasándolo por WhatsApp/Telegram/USB, sin Play Store
(hay que permitir "instalar apps desconocidas" esa primera vez).

Si cambias la URL del servidor, vuelve a correr `npm run cap:sync` antes
de compilar.

## Cómo trabaja el almacenero con ella

1. Abre la app e inicia sesión con su usuario de siempre.
2. Toca **Escanear** (o el botón ámbar del panel).
3. Apunta al código del producto: aparece su ficha con la existencia.
4. **Entrada / Salida / Conteo**, cantidad, Registrar. Queda en el libro
   con su firma, igual que si lo hiciera en la computadora.

Si el código no existe, la propia pantalla ofrece crear el producto con
el código ya puesto. Y si un día no hay teléfono a mano, la web también
lee códigos: con la cámara en Chrome/Android (BarcodeDetector) o con una
pistola USB en la PC, que funciona como teclado.

## Piezas

- `capacitor.config.ts` — nombre, id (`cu.gothan.almacen`) y URL del servidor.
- `android/` — proyecto Android generado por Capacitor (se versiona para
  poder compilar sin regenerar).
- `@capacitor-mlkit/barcode-scanning` — el escáner; la web lo llama desde
  `src/components/EscanearVista.tsx` cuando corre dentro de la app.

## Pendiente honesto

- Modo sin conexión con cola de movimientos (hoy la app necesita llegar
  al servidor, por WiFi o internet).
- Icono propio (ahora usa el de Capacitor).
