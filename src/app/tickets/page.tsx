import { requireSession } from "@/lib/auth";
import { TicketsLayout } from "@/components/tickets/TicketsLayout";
import { TicketsPageContent } from "@/components/tickets/TicketsPageContent";
import { getTicketsAndCounts } from "@/app/tickets/getTicketsAndCounts";

export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  await requireSession();

  try {
    const { tickets, counts } = await getTicketsAndCounts();
    return (
      <TicketsLayout>
        <TicketsPageContent tickets={tickets} counts={counts} />
      </TicketsLayout>
    );
  } catch (error: any) {
    console.error("[TicketsPage] Error:", error);
    return (
      <TicketsLayout>
        <div className="w-full space-y-6">
          <div className="rounded-lg bg-red-50 border border-red-200 p-6">
            <h2 className="text-xl font-semibold text-red-900 mb-2">⚠️ Error al cargar reclamos</h2>
            <p className="text-red-700 mb-4">
              {error.message?.includes("DATABASE_URL") || error.message?.includes("connect")
                ? "La base de datos no está configurada. Por favor, configura DATABASE_URL en Vercel."
                : `Error: ${error.message || "Error desconocido"}`}
            </p>
            <p className="text-sm text-red-600">
              Verifica que DATABASE_URL esté configurado en las variables de entorno de Vercel.
            </p>
          </div>
        </div>
      </TicketsLayout>
    );
  }
}
