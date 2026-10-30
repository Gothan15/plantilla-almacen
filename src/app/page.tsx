import { redirect } from "next/navigation";

// La raíz no muestra nada: al panel si hay sesión, al login si no.
// El proxy se encarga de esa decisión.
export default function Home() {
  redirect("/panel");
}
