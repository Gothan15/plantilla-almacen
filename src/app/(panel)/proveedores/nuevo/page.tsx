import ProveedorForm from "@/components/ProveedorForm";
import { Encabezado } from "@/components/ui";
import { crearProveedor } from "@/app/actions/proveedores";

export default function NuevoProveedorPage() {
  return (
    <div>
      <Encabezado titulo="Nuevo proveedor" />
      <ProveedorForm accion={crearProveedor} />
    </div>
  );
}
