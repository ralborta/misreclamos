import { requireSession } from "@/lib/auth";
import { TicketsLayout } from "@/components/tickets/TicketsLayout";
import { CreateCustomerForm } from "@/components/clientes/CreateCustomerForm";
import { ImportExcelForm } from "@/components/clientes/ImportExcelForm";
import { CustomersList } from "@/components/clientes/CustomersList";
import { prisma } from "@/lib/db";

export default async function ClientesPage() {
  await requireSession();

  const customers = await prisma.customer.findMany({
    include: {
      _count: {
        select: { tickets: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const totalCustomers = await prisma.customer.count();

  return (
    <TicketsLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">👤 Clientes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestiona los clientes y sus datos de contacto
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Formularios */}
          <div className="lg:col-span-1 space-y-6">
            <CreateCustomerForm />
            <ImportExcelForm />
          </div>

          {/* Lista de clientes */}
          <div className="lg:col-span-2">
            <CustomersList initialCustomers={customers as any} initialTotal={totalCustomers} />
          </div>
        </div>
      </div>
    </TicketsLayout>
  );
}
