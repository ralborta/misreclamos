import { requireSession } from "@/lib/auth";
import { TicketsLayout } from "@/components/tickets/TicketsLayout";
import { TicketsPageContent } from "@/components/tickets/TicketsPageContent";
import { getTicketsAndCounts } from "@/app/tickets/getTicketsAndCounts";

export const dynamic = "force-dynamic";

export default async function TicketsEnProgresoPage() {
  await requireSession();
  const { tickets, counts } = await getTicketsAndCounts();
  return (
    <TicketsLayout>
      <TicketsPageContent
        tickets={tickets}
        counts={counts}
        initialStatusFilter="IN_PROGRESS"
        pageTitle="Tickets En Progreso"
      />
    </TicketsLayout>
  );
}
