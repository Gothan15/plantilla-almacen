import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import EtiquetaVista from "@/components/EtiquetaVista";

// Página de impresión de etiquetas: vive fuera del panel para que la
// hoja salga limpia, sin barra lateral ni cabeceras. El contenido va
// en un Suspense porque depende de la sesión y la base de datos.
export default function EtiquetaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="min-h-screen bg-neutral-100 p-4 text-black sm:p-8">
      <style>{`
        @media print {
          .no-imprimir { display: none !important; }
          body { background: white !important; }
          main { padding: 0 !important; background: white !important; }
        }
        @page { margin: 6mm; }
      `}</style>
      <Suspense
        fallback={
          <p className="no-imprimir mx-auto max-w-xl text-sm text-neutral-500">
            Cargando etiqueta...
          </p>
        }
      >
        <Contenido params={params} />
      </Suspense>
    </main>
  );
}

async function Contenido({ params }: { params: Promise<{ id: string }> }) {
  await verifySession();
  const { id } = await params;
  const producto = await prisma.producto.findUnique({
    where: { id: Number(id) },
  });
  if (!producto) notFound();

  return (
    <>
      <div className="no-imprimir mx-auto mb-6 flex max-w-xl items-center gap-3">
        <div className="flex-1">
          <h1 className="text-xl font-bold">Etiqueta de producto</h1>
          <p className="text-sm text-neutral-500">
            {producto.nombre} · {producto.sku}
          </p>
        </div>
        <Link
          href={`/productos/${producto.id}`}
          className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
        >
          Volver a la ficha
        </Link>
      </div>
      <EtiquetaVista
        nombre={producto.nombre}
        sku={producto.sku}
        codigoBarras={producto.codigoBarras}
        precioVenta={producto.precioVenta.toString()}
      />
    </>
  );
}
