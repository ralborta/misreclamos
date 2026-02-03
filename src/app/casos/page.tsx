import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { TicketsLayout } from "@/components/tickets/TicketsLayout";
import { CaseTypesList } from "@/components/casos/CaseTypesList";
import { CreateCaseTypeForm } from "@/components/casos/CreateCaseTypeForm";

export const dynamic = "force-dynamic";

export default async function CasosPage() {
  await requireSession();

  const casos = await prisma.caseType.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <TicketsLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tipos de caso</h1>
          <p className="mt-1 text-sm text-slate-500">
            Altas, bajas y modificaciones de los tipos de caso (ex prioridades)
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CaseTypesList casos={casos} />
          </div>
          <div>
            <CreateCaseTypeForm />
          </div>
        </div>
      </div>
    </TicketsLayout>
  );
}
