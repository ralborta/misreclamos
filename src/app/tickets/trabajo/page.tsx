import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { TicketsLayout } from "@/components/tickets/TicketsLayout";
import { TicketsTable } from "@/components/tickets/TicketsTable";

export default async function TicketsTrabajoPage() {
  await requireSession();
  const legalType = "Trabajo";

  const tickets = await prisma.ticket.findMany({
    where: { legalType },
    include: { customer: true, assignedTo: true },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
  });

  const totalCount = await prisma.ticket.count({ where: { legalType } });

  return (
    <TicketsLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Trabajo</h1>
          <p className="mt-1 text-sm text-slate-500">
            {totalCount} {totalCount === 1 ? "caso" : "casos"} en esta categoría
          </p>
        </div>
        <div className="rounded-xl bg-blue-50 p-6 ring-1 ring-blue-100">
          <div className="text-sm font-medium text-blue-800">Total</div>
          <div className="mt-2 text-3xl font-bold text-blue-900">{totalCount}</div>
        </div>
        <TicketsTable tickets={tickets} />
      </div>
    </TicketsLayout>
  );
}
