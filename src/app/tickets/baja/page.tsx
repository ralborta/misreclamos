import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { TicketsLayout } from "@/components/tickets/TicketsLayout";
import { TicketsTable } from "@/components/tickets/TicketsTable";

export default async function TicketsBajaPage() {
  await requireSession();

  const tickets = await prisma.ticket.findMany({
    where: { priority: "LOW", status: { not: "CLOSED" } },
    include: { customer: true, assignedTo: true },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
  });

  const totalCount = await prisma.ticket.count({ 
    where: { priority: "LOW", status: { not: "CLOSED" } } 
  });

  return (
    <TicketsLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">⚪ Tickets Prioridad Baja</h1>
          <p className="mt-1 text-sm text-slate-500">
            {totalCount} {totalCount === 1 ? "ticket" : "tickets"} con prioridad baja
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-6 ring-1 ring-slate-100">
            <div className="text-sm font-medium text-slate-600">Baja</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{totalCount}</div>
          </div>
        </div>

        <TicketsTable tickets={tickets} />
      </div>
    </TicketsLayout>
  );
}
