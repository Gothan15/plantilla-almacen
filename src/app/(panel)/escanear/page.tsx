import EscanearVista from "@/components/EscanearVista";
import { Encabezado } from "@/components/ui";

export default function EscanearPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Encabezado
        titulo="Escanear"
        descripcion="Encuentra un producto por su código y registra el movimiento sin salir de esta pantalla."
      />
      <EscanearVista />
    </div>
  );
}
