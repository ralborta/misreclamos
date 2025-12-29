import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { TicketsLayout } from "@/components/tickets/TicketsLayout";
import { TicketsTable } from "@/components/tickets/TicketsTable";

type TicketStatus = "OPEN" | "IN_PROGRESS" | "WAITING_CUSTOMER" | "RESOLVED" | "CLOSED";
type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export default async function TicketsPage() {
  await requireSession();

  const tickets = await prisma.ticket.findMany({
    include: { customer: true, assignedTo: true },
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
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Todos los Tickets</h1>
          <p className="mt-1 text-sm text-slate-500">
            Vista general de {totalCount} {totalCount === 1 ? "ticket" : "tickets"} en el sistema
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Abiertos" value={statusCountMap.OPEN || 0} color="blue" />
          <SummaryCard label="En Progreso" value={statusCountMap.IN_PROGRESS || 0} color="amber" />
          <SummaryCard label="Esperando Cliente" value={statusCountMap.WAITING_CUSTOMER || 0} color="lime" />
          <SummaryCard label="Urgentes" value={priorityCountMap.URGENT || 0} color="rose" />
        </div>

        <TicketsTable tickets={tickets} />
      </div>
    </TicketsLayout>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    amber: "bg-amber-50 text-amber-600 ring-amber-100",
    lime: "bg-lime-50 text-lime-600 ring-lime-100",
    rose: "bg-rose-50 text-rose-600 ring-rose-100",
  };

  return (
    <div className={`rounded-xl p-6 ring-1 ${colorClasses[color] || colorClasses.blue}`}>
      <div className="text-sm font-medium">{label}</div>
      <div className="mt-2 text-3xl font-bold text-slate-900">{value}</div>
    </div>
  );
}
