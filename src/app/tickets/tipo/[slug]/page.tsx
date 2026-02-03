import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { TicketsLayout } from "@/components/tickets/TicketsLayout";
import { TicketsTable } from "@/components/tickets/TicketsTable";

export const dynamic = "force-dynamic";

const colorToBoxClass: Record<string, { wrapper: string; label: string; value: string }> = {
  "amber-500": { wrapper: "bg-amber-50 ring-amber-100", label: "text-amber-800", value: "text-amber-900" },
  "blue-500": { wrapper: "bg-blue-50 ring-blue-100", label: "text-blue-800", value: "text-blue-900" },
  "orange-500": { wrapper: "bg-orange-50 ring-orange-100", label: "text-orange-800", value: "text-orange-900" },
  "violet-500": { wrapper: "bg-violet-50 ring-violet-100", label: "text-violet-800", value: "text-violet-900" },
  "emerald-500": { wrapper: "bg-emerald-50 ring-emerald-100", label: "text-emerald-800", value: "text-emerald-900" },
  "slate-500": { wrapper: "bg-slate-50 ring-slate-100", label: "text-slate-800", value: "text-slate-900" },
  "slate-400": { wrapper: "bg-slate-50 ring-slate-100", label: "text-slate-700", value: "text-slate-900" },
  "red-500": { wrapper: "bg-red-50 ring-red-100", label: "text-red-800", value: "text-red-900" },
  "teal-500": { wrapper: "bg-teal-50 ring-teal-100", label: "text-teal-800", value: "text-teal-900" },
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function TicketsTipoPage({ params }: PageProps) {
  await requireSession();
  const { slug } = await params;

  const caseType = await prisma.caseType.findUnique({
    where: { slug },
  });

  if (!caseType) {
    notFound();
  }

  const tickets = await prisma.ticket.findMany({
    where: { legalType: caseType.legalType },
    include: { customer: true, assignedTo: true },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
  });

  const totalCount = await prisma.ticket.count({
    where: { legalType: caseType.legalType },
  });

  const box = colorToBoxClass[caseType.color] ?? colorToBoxClass["slate-500"];

  return (
    <TicketsLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{caseType.label}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {totalCount} {totalCount === 1 ? "caso" : "casos"} en esta categoría
          </p>
        </div>
        <div className={`rounded-xl p-6 ring-1 ${box.wrapper}`}>
          <div className={`text-sm font-medium ${box.label}`}>Total</div>
          <div className={`mt-2 text-3xl font-bold ${box.value}`}>{totalCount}</div>
        </div>
        <TicketsTable tickets={tickets} />
      </div>
    </TicketsLayout>
  );
}
