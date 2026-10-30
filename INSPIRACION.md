# Inspiración de diseño

Esta plantilla no salió de un generador: el diseño se armó mirando
trabajo real de diseñadores de dashboards de inventario y almacén, y
cruzándolo con cómo se trabaja en un almacén de verdad (tarjetas de
estiba, libros de registro, etiquetas con código). Lo que tomé de
cada fuente:

## Referencias

1. **ShelfOps — Warehouse Storage & Inventory Management** (Nickelfox,
   Dribbble). Dashboard de almacén con lista de existencias densa y
   legible: la información manda, la decoración sobra.
   https://dribbble.com/shots (buscar "ShelfOps")

2. **Stockroom** (UI Cookies, plantilla real y usable). El flujo
   completo de un almacén chico: alerta de stock bajo → reposición,
   libro de movimientos (ledger) como fuente de la verdad, puntos de
   reorden, ubicaciones por estante y la regla de oro: ningún ajuste
   puede dejar la existencia en negativo.
   https://uicookies.com/downloads/stockroom/

3. **WareTrack** (Agensip, reseñado entre las agencias de dashboards
   de 2026). Reportes de almacén con secciones modulares y jerarquía
   visual sobria para datos grandes.
   https://dribbble.com/resources/agencies/trendsetter-ui-ux-design-agencies-of-2026

4. **"Warehouse inventory management dashboard UI: best practices
   for 2027"** (Medium, oct. 2026). La regla que ordena el panel:
   primero las excepciones (qué producto está en riesgo y qué acción
   toca), después las cifras generales y los gráficos. Un dashboard
   que abre con cuatro gráficos y esconde la lista de problemas no
   sirve para trabajar.
   https://medium.com/@iosapps/warehouse-inventory-management-dashboard-ui-examples-best-practices-for-2027-402431eeee87

5. **Sistemas POS/inventario en Behance** (ZenaSoft y similares):
   barra lateral fija con las secciones del negocio (Productos,
   Movimientos, Reportes, Personas) y tarjetas de KPI con la cifra en
   tipografía monoespaciada, como las calculadoras y básculas del
   mostrador.

## Decisiones que salen de ahí

- **El panel abre con "Necesita atención"**: productos agotados o bajo
  el mínimo, cada uno con su botón directo a registrar la entrada.
  Las cifras van debajo.
- **Libro de movimientos, no "historial"**: folio correlativo, tipo,
  cantidad con signo, saldo resultante y firma de quién lo hizo. Es
  el documento legal del almacén; por eso los productos con
  historial no se borran, se desactivan.
- **Estética de etiqueta y papel**: fondo papel cálido, barra lateral
  carbón, ámbar de seguridad como acento, líneas de corte punteadas
  y JetBrains Mono para códigos, folios y cantidades. Nada de
  degradados morados ni tarjetas flotantes genéricas.
- **Semáforo de stock** en todas las listas: punto verde/ámbar/rojo
  con la palabra, visible de un vistazo como en las tarjetas de
  estiba físicas.
