import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { TicketsLayout } from "@/components/tickets/TicketsLayout";
import { TicketsPageContent } from "@/components/tickets/TicketsPageContent";

export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  await requireSession();

  try {
    const tickets = await prisma.ticket.findMany({
      select: {
        id: true,
        code: true,
        title: true,
        contactName: true,
        status: true,
        priority: true,
        legalType: true,
        lastMessageAt: true,
        createdAt: true,
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
        assignedTo: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { lastMessageAt: "desc" },
      take: 200,
    });

    const openCount = tickets.filter((t) => t.status === "OPEN").length;
    const inProgressCount = tickets.filter((t) => t.status === "IN_PROGRESS").length;
    const waitingCount = tickets.filter((t) => t.status === "WAITING_CUSTOMER").length;
    const urgentCount = tickets.filter((t) => t.priority === "URGENT").length;

    const serialized = tickets.map((t) => ({
      ...t,
      lastMessageAt: t.lastMessageAt.toISOString(),
      createdAt: t.createdAt.toISOString(),
    }));

    return (
      <TicketsLayout>
        <TicketsPageContent
          tickets={serialized}
          counts={{
            open: openCount,
            inProgress: inProgressCount,
            waiting: waitingCount,
            urgent: urgentCount,
          }}
        />
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
