import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { TicketsLayout } from "@/components/tickets/TicketsLayout";
import { TicketsTable } from "@/components/tickets/TicketsTable";

type TicketStatus = "OPEN" | "IN_PROGRESS" | "WAITING_CUSTOMER" | "RESOLVED" | "CLOSED";
type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

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
    take: 100,
  });

    const [statusCounts, priorityCounts, totalCount] = await Promise.all([
      prisma.ticket.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.ticket.groupBy({ by: ["priority"], _count: { _all: true } }),
      prisma.ticket.count(),
    ]);

    const statusCountMap = Object.fromEntries(
      statusCounts.map((c: { status: string; _count: { _all: number } }) => [c.status as TicketStatus, c._count._all])
    ) as Partial<Record<TicketStatus, number>>;
    const priorityCountMap = Object.fromEntries(
      priorityCounts.map((c: { priority: string; _count: { _all: number } }) => [c.priority as TicketPriority, c._count._all])
    ) as Partial<Record<TicketPriority, number>>;

    return (
      <TicketsLayout>
        <div className="w-full space-y-6">
          <div className="flex items-center justify-between">
            <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Todos los Casos
            </h1>
              <p className="mt-2 text-sm text-slate-600">
              Vista general de <span className="font-semibold text-slate-900">{totalCount}</span>{" "}
              {totalCount === 1 ? "caso" : "casos"} en el sistema
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Abiertos"
            value={statusCountMap.OPEN || 0}
            color="blue"
            description="Casos pendientes de atención"
          />
          <SummaryCard
            label="En Progreso"
            value={statusCountMap.IN_PROGRESS || 0}
            color="slate"
            description="Siendo atendidos actualmente"
          />
          <SummaryCard
            label="Esperando Cliente"
            value={statusCountMap.WAITING_CUSTOMER || 0}
            color="slate"
            description="Aguardando respuesta"
          />
          <SummaryCard
            label="Urgentes"
            value={priorityCountMap.URGENT || 0}
            color="orange"
            description="Requieren atención inmediata"
          />
          </div>

          <TicketsTable
            tickets={tickets.map((t) => ({
              ...t,
              lastMessageAt: t.lastMessageAt.toISOString(),
              createdAt: t.createdAt.toISOString(),
            }))}
          />
        </div>
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

function SummaryCard({
  label,
  value,
  color,
  description,
}: {
  label: string;
  value: number;
  color: string;
  description?: string;
}) {
  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
    },
    orange: {
      bg: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-200",
    },
    slate: {
      bg: "bg-slate-50",
      text: "text-slate-700",
      border: "border-slate-200",
    },
  };

  const colors = colorClasses[color] || colorClasses.slate;

  return (
    <div className={`rounded-lg p-5 border ${colors.bg} ${colors.border} shadow-sm hover:shadow transition-all`}>
      <div className="space-y-2">
        <div className={`text-xs font-semibold ${colors.text} uppercase tracking-wide`}>{label}</div>
        <div className="text-3xl font-bold text-slate-900">{value}</div>
        {description && <div className="text-xs text-slate-600 mt-1">{description}</div>}
      </div>
    </div>
  );
}
