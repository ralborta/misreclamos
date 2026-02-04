import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { TicketsLayout } from "@/components/tickets/TicketsLayout";
import { TicketsTable } from "@/components/tickets/TicketsTable";

export const dynamic = "force-dynamic";

type TicketStatus = "OPEN" | "IN_PROGRESS" | "WAITING_CUSTOMER" | "RESOLVED" | "CLOSED";
type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

type TicketForCard = {
  id: string;
  code: string;
  title: string;
  contactName: string;
  status: string;
  legalType: string | null;
  customer: { name: string | null; phone: string } | null;
};

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
      take: 100,
    });

    const totalCount = await prisma.ticket.count();
    const openTickets = tickets.filter((t) => t.status === "OPEN") as TicketForCard[];
    const inProgressTickets = tickets.filter((t) => t.status === "IN_PROGRESS") as TicketForCard[];
    const waitingTickets = tickets.filter((t) => t.status === "WAITING_CUSTOMER") as TicketForCard[];
    const urgentTickets = tickets.filter((t) => t.priority === "URGENT") as TicketForCard[];

    return (
      <TicketsLayout>
        <div className="w-full space-y-6">
          <div className="flex items-center justify-between">
            <div>
            <h1 className="text-3xl font-bold text-[#213b5c]">
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
            tickets={openTickets}
            color="blue"
            description="Casos pendientes de atención"
          />
          <SummaryCard
            label="En Progreso"
            tickets={inProgressTickets}
            color="slate"
            description="Siendo atendidos actualmente"
          />
          <SummaryCard
            label="Esperando Cliente"
            tickets={waitingTickets}
            color="emerald"
            description="Aguardando respuesta"
          />
          <SummaryCard
            label="Urgentes"
            tickets={urgentTickets}
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
  tickets,
  color,
  description,
}: {
  label: string;
  tickets: TicketForCard[];
  color: string;
  description?: string;
}) {
  const colorClasses: Record<string, {
    bg: string;
    headerBg: string;
    title: string;
    border: string;
    shadow: string;
    hoverShadow: string;
    card: string;
  }> = {
    blue: {
      bg: "bg-white",
      headerBg: "bg-gradient-to-r from-blue-500 to-blue-600",
      title: "text-white",
      border: "border-blue-200",
      shadow: "shadow-md shadow-blue-200/40",
      hoverShadow: "hover:shadow-xl hover:shadow-blue-300/50 hover:-translate-y-1",
      card: "hover:border-blue-400 hover:bg-blue-50/80 hover:shadow-md",
    },
    orange: {
      bg: "bg-white",
      headerBg: "bg-gradient-to-r from-orange-500 to-orange-600",
      title: "text-white",
      border: "border-orange-200",
      shadow: "shadow-md shadow-orange-200/40",
      hoverShadow: "hover:shadow-xl hover:shadow-orange-300/50 hover:-translate-y-1",
      card: "hover:border-orange-400 hover:bg-orange-50/80 hover:shadow-md",
    },
    slate: {
      bg: "bg-white",
      headerBg: "bg-gradient-to-r from-slate-600 to-slate-700",
      title: "text-white",
      border: "border-slate-200",
      shadow: "shadow-md shadow-slate-200/50",
      hoverShadow: "hover:shadow-xl hover:shadow-slate-300/50 hover:-translate-y-1",
      card: "hover:border-slate-400 hover:bg-slate-50/80 hover:shadow-md",
    },
    emerald: {
      bg: "bg-white",
      headerBg: "bg-gradient-to-r from-emerald-500 to-emerald-600",
      title: "text-white",
      border: "border-emerald-200",
      shadow: "shadow-md shadow-emerald-200/40",
      hoverShadow: "hover:shadow-xl hover:shadow-emerald-300/50 hover:-translate-y-1",
      card: "hover:border-emerald-400 hover:bg-emerald-50/80 hover:shadow-md",
    },
  };

  const colors = colorClasses[color] || colorClasses.slate;

  return (
    <div
      className={`rounded-xl border ${colors.bg} ${colors.border} ${colors.shadow} ${colors.hoverShadow} overflow-hidden transition-all duration-300 ease-out`}
    >
      <div className={`p-4 ${colors.headerBg}`}>
        <div className={`text-xs font-bold ${colors.title} uppercase tracking-widest`}>{label}</div>
        <div className={`text-3xl font-extrabold ${colors.title} mt-1`}>{tickets.length}</div>
        {description && <div className="text-xs text-white/90 mt-1.5">{description}</div>}
      </div>
      <div className="p-2 max-h-[280px] overflow-y-auto space-y-1.5 bg-slate-50/50">
        {tickets.length === 0 ? (
          <p className="text-xs text-slate-500 py-2 px-2">Ningún caso</p>
        ) : (
          tickets.map((t) => (
            <Link
              key={t.id}
              href={`/tickets/${t.id}`}
              className={`block rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left transition-all duration-200 ${colors.card}`}
            >
              <div className="font-semibold text-slate-900 text-sm truncate">{t.code}</div>
              <div className="text-xs text-slate-600 truncate mt-0.5">
                {t.customer?.name || t.contactName || "Sin nombre"}
              </div>
              {t.legalType && (
                <span className="inline-block mt-1 text-[10px] rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
                  {t.legalType}
                </span>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
