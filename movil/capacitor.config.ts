import type { CapacitorConfig } from "@capacitor/cli";

// La app es una envoltura nativa de la MISMA aplicación web del
// almacén: no duplica pantallas ni datos. Solo aporta lo que el
// navegador no da bien: el escáner ML Kit y el icono en el teléfono.
//
// ⚠️ CAMBIA LA URL por la dirección donde corra tu panel:
//   - Desplegado:  "https://tu-almacen.vercel.app"
//   - En tu WiFi:  "http://192.168.1.50:3000" (la IP de la PC con el servidor)
// La IP de ejemplo permite probar sin desplegar nada.
const config: CapacitorConfig = {
  appId: "cu.gothan.almacen",
  appName: "Almacén",
  webDir: "www",
  server: {
    url: "http://192.168.1.50:3000",
    cleartext: true, // necesario solo para http en red local; con https sobra
  },
};

export default config;
