import LoginForm from "@/components/LoginForm";
import { CONFIG } from "@/lib/config";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Tarjeta tipo etiqueta de almacén */}
        <div className="overflow-hidden rounded-lg border border-borde bg-white shadow-[0_2px_20px_rgba(35,32,28,0.08)]">
          <div className="bg-carbon px-6 py-5 text-white">
            <p className="font-mono text-[11px] tracking-[0.25em] text-ambar">
              {CONFIG.subtitulo.toUpperCase()}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              {CONFIG.nombreNegocio}
            </h1>
          </div>
          <div className="px-6 py-6">
            <LoginForm />
            <div className="corte my-5" />
            <p className="text-xs leading-relaxed text-tinta-suave">
              Cuentas de ejemplo tras el seed:{" "}
              <span className="font-mono">admin@almacen.cu / admin123</span>{" "}
              (administrador) y{" "}
              <span className="font-mono">almacen@almacen.cu / almacen123</span>{" "}
              (almacenero).
            </p>
          </div>
        </div>
        <p className="mt-4 text-center font-mono text-[11px] text-tinta-suave">
          Plantilla de almacén · Next.js + Prisma
        </p>
      </div>
    </main>
  );
}
