import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { andTicketScope } from "@/lib/ticket-scope";
import { TicketsLayout } from "@/components/tickets/TicketsLayout";
import { TicketsTable } from "@/components/tickets/TicketsTable";

export default async function TicketsSinCasoPage() {
  const session = await requireSession();
  const legalType = "Sin caso";
  const where = andTicketScope(session.user!, { legalType });

  const tickets = await prisma.ticket.findMany({
    where,
    include: { customer: true, assignedTo: true },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
  });

  const totalCount = await prisma.ticket.count({ where });

  return (
    <TicketsLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sin caso</h1>
          <p className="mt-1 text-sm text-slate-500">
            {totalCount} {totalCount === 1 ? "registro" : "registros"} (consultas generales, errores, no corresponden a un caso)
          </p>
        </div>
        <div className="rounded-xl bg-slate-100 p-6 ring-1 ring-slate-200">
          <div className="text-sm font-medium text-slate-600">Total</div>
          <div className="mt-2 text-3xl font-bold text-slate-800">{totalCount}</div>
        </div>
        <TicketsTable tickets={tickets} />
      </div>
    </TicketsLayout>
  );
}
