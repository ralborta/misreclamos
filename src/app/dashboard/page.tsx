import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { statusLabels, priorityLabels } from "@/lib/tickets";
import { TicketsLayout } from "@/components/tickets/TicketsLayout";
import { prisma } from "@/lib/db";

async function getDashboardStats() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalTickets = await prisma.ticket.count();

    const ticketsByStatus = await prisma.ticket.groupBy({
      by: ["status"],
      _count: true,
    });

    const ticketsByPriority = await prisma.ticket.groupBy({
      by: ["priority"],
      _count: true,
    });

    const ticketsToday = await prisma.ticket.count({
      where: { createdAt: { gte: today } },
    });

    const resolvedToday = await prisma.ticket.count({
      where: {
        status: "RESOLVED",
        updatedAt: { gte: today },
      },
    });

    const resolvedTickets = await prisma.ticket.findMany({
      where: {
        status: { in: ["RESOLVED", "CLOSED"] },
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });

    const avgResolutionTime = resolvedTickets.length > 0
      ? resolvedTickets.reduce((acc, t) => {
          const diff = t.updatedAt.getTime() - t.createdAt.getTime();
          return acc + diff / (1000 * 60 * 60);
        }, 0) / resolvedTickets.length
      : 0;

    const urgentUnassigned = await prisma.ticket.count({
      where: {
        priority: "URGENT",
        assignedToUserId: null,
        status: { notIn: ["RESOLVED", "CLOSED"] },
      },
    });

    const topAgents = await prisma.agentUser.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            tickets: {
              where: {
                status: { notIn: ["CLOSED"] },
              },
            },
          },
        },
      },
      orderBy: {
        tickets: {
          _count: "desc",
        },
      },
      take: 5,
    });

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await prisma.ticket.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      last7Days.push({
        date: date.toISOString().split("T")[0],
        count,
      });
    }

    const topCompanies = await prisma.customer.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        _count: {
          select: {
            tickets: true,
          },
        },
      },
      orderBy: {
        tickets: {
          _count: "desc",
        },
      },
      take: 5,
    });

    const ticketsByLegalType = await prisma.ticket.groupBy({
      by: ["legalType"],
      _count: true,
      orderBy: {
        _count: { legalType: "desc" },
      },
    });

    const caseTypes = await prisma.caseType.findMany({
      select: { legalType: true, slug: true, color: true },
    });
    const legalTypeToSlug = Object.fromEntries(caseTypes.map((c) => [c.legalType || "Sin caso", c.slug]));
    const legalTypeToColor = Object.fromEntries(caseTypes.map((c) => [c.legalType || "Sin caso", c.color]));

    return {
      totalTickets,
      ticketsToday,
      resolvedToday,
      avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
      urgentUnassigned,
      ticketsByStatus: ticketsByStatus.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      ticketsByPriority: ticketsByPriority.map((p) => ({
        priority: p.priority,
        count: p._count,
      })),
      topAgents: topAgents.map((a) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        activeTickets: a._count.tickets,
      })),
      last7Days,
      topCompanies: topCompanies.map((c) => ({
        id: c.id,
        name: c.name || c.phone,
        phone: c.phone,
        totalTickets: c._count.tickets,
      })),
      ticketsByLegalType: ticketsByLegalType.map((t) => ({
        legalType: t.legalType ?? "Sin caso",
        count: t._count,
        slug: legalTypeToSlug[t.legalType ?? "Sin caso"],
        color: legalTypeToColor[t.legalType ?? "Sin caso"],
      })),
    };
  } catch (error: any) {
    console.error("[Dashboard] Error al cargar stats:", error);
    return null;
  }
}

export default async function DashboardPage() {
  await requireSession();
  const stats = await getDashboardStats();

  if (!stats) {
    return (
      <TicketsLayout>
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-4 text-slate-600">Error al cargar estadísticas.</p>
        </div>
      </TicketsLayout>
    );
  }

  return (
    <TicketsLayout>
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">
              Vista general del sistema de reclamos
            </p>
          </div>
          <Link
            href="/tickets"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2196F3] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1976D2] transition-colors"
          >
            Ver todos los casos
          </Link>
        </div>

        {/* KPIs principales con iconos y color */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Casos"
            value={stats.totalTickets}
            icon="cases"
            accent="blue"
          />
          <KPICard
            title="Creados Hoy"
            value={stats.ticketsToday}
            icon="calendar"
            accent="slate"
          />
          <KPICard
            title="Resueltos Hoy"
            value={stats.resolvedToday}
            icon="check"
            accent="emerald"
          />
          <KPICard
            title="Tiempo Promedio"
            value={`${stats.avgResolutionTime}h`}
            icon="clock"
            accent="amber"
          />
        </div>

        {/* Alerta de urgentes con CTA */}
        {stats.urgentUnassigned > 0 && (
          <Link
            href="/tickets/urgentes"
            className="mb-8 flex items-center justify-between rounded-xl border border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 p-5 shadow-sm transition hover:shadow-md"
          >
            <div>
              <h3 className="font-semibold text-orange-900">
                Atención: {stats.urgentUnassigned} caso(s) urgente(s) sin asignar
              </h3>
              <p className="mt-1 text-sm text-orange-700">
                Requieren atención inmediata
              </p>
            </div>
            <span className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
              Ver urgentes
            </span>
          </Link>
        )}

        {/* Grid principal */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Tickets por Estado */}
          <div className="rounded-xl bg-white p-6 border border-slate-200 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Casos por Estado
            </h2>
            <div className="space-y-3">
              {stats.ticketsByStatus.map((item: any) => (
                <ProgressBar
                  key={item.status}
                  label={statusLabels[item.status as keyof typeof statusLabels]}
                  value={item.count}
                  total={stats.totalTickets}
                  color={getStatusColor(item.status)}
                />
              ))}
            </div>
          </div>

          {/* Tickets por Prioridad */}
          <div className="rounded-xl bg-white p-6 border border-slate-200 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Casos por Prioridad
            </h2>
            <div className="space-y-3">
              {stats.ticketsByPriority.map((item: any) => (
                <ProgressBar
                  key={item.priority}
                  label={priorityLabels[item.priority as keyof typeof priorityLabels]}
                  value={item.count}
                  total={stats.totalTickets}
                  color={getPriorityColor(item.priority)}
                />
              ))}
            </div>
          </div>

          {/* Tendencia últimos 7 días */}
          <div className="rounded-xl bg-white p-6 border border-slate-200 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              Últimos 7 días
            </h2>
            <div className="flex items-end justify-between gap-1 h-44">
              {stats.last7Days.map((day: any) => {
                const maxCount = Math.max(1, ...stats.last7Days.map((d: any) => d.count));
                const height = maxCount > 0 ? (day.count / maxCount) * 100 : 2;
                return (
                  <div key={day.date} className="flex flex-col items-center flex-1 min-w-0">
                    <span className="text-xs font-semibold text-slate-700 mb-1">{day.count}</span>
                    <div
                      className="w-full rounded-t bg-[#2196F3]/80 hover:bg-[#2196F3] transition-colors"
                      style={{ height: `${height}%`, minHeight: "4px" }}
                    />
                    <span className="mt-2 text-[10px] text-slate-500 truncate w-full text-center">
                      {new Date(day.date).toLocaleDateString("es", { weekday: "short" })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Abogados */}
          <div className="rounded-xl bg-white p-6 border border-slate-200 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              Top Abogados
            </h2>
            <div className="space-y-2">
              {stats.topAgents.length === 0 ? (
                <p className="text-sm text-slate-500">No hay abogados con casos asignados.</p>
              ) : (
                stats.topAgents.map((agent: any, index: number) => (
                  <Link
                    key={agent.id}
                    href="/tickets"
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 transition hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2C3E50] text-sm font-semibold text-white">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">{agent.name}</div>
                        <div className="text-xs text-slate-500 truncate">{agent.email}</div>
                      </div>
                    </div>
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-700 shrink-0">
                      {agent.activeTickets}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Casos por tipo (enlaces al filtro) */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200 lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              Casos por tipo
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {stats.ticketsByLegalType.length === 0 ? (
                <p className="text-sm text-slate-500">No hay datos disponibles.</p>
              ) : (
                stats.ticketsByLegalType.map((item: any, index: number) => {
                  const href = item.slug ? `/tickets/tipo/${item.slug}` : "/tickets";
                  const dotColor = typeColorToBg(item.color);
                  return (
                    <Link
                      key={`${item.legalType}-${index}`}
                      href={href}
                      className="rounded-xl border border-slate-200 p-4 transition hover:border-[#2196F3]/40 hover:shadow-md hover:bg-slate-50/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-500">{index + 1}</span>
                        <span className="text-xl font-bold text-slate-900">{item.count}</span>
                      </div>
                      <div className="text-sm font-medium text-slate-900 truncate">
                        {item.legalType}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                        <span className="text-xs text-slate-500">
                          {item.count} {item.count === 1 ? "caso" : "casos"}
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </TicketsLayout>
  );
}

const KPI_ACCENTS: Record<string, { bg: string; icon: string; text: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-700", icon: "text-blue-600" },
  slate: { bg: "bg-slate-50", text: "text-slate-700", icon: "text-slate-600" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700", icon: "text-emerald-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-700", icon: "text-amber-600" },
};

function KPICard({
  title,
  value,
  icon,
  accent,
}: {
  title: string;
  value: string | number;
  icon: "cases" | "calendar" | "check" | "clock";
  accent: keyof typeof KPI_ACCENTS;
}) {
  const a = KPI_ACCENTS[accent] || KPI_ACCENTS.slate;
  const icons = {
    cases: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
      </svg>
    ),
    calendar: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
    check: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m4.5 12.75 6 6 9-13.5" />
      </svg>
    ),
    clock: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  };
  return (
    <div className={`rounded-xl border border-slate-200 p-5 shadow-sm transition hover:shadow-md ${a.bg}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${a.text}`}>{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <span className={a.icon}>{icons[icon]}</span>
      </div>
    </div>
  );
}

function ProgressBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-600">{value}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case "OPEN":
      return "bg-blue-500";
    case "IN_PROGRESS":
      return "bg-slate-600";
    case "WAITING_CUSTOMER":
      return "bg-slate-500";
    case "RESOLVED":
      return "bg-slate-400";
    case "CLOSED":
      return "bg-slate-300";
    default:
      return "bg-slate-300";
  }
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case "URGENT":
      return "bg-orange-500";
    case "HIGH":
      return "bg-orange-400";
    case "NORMAL":
      return "bg-blue-500";
    case "LOW":
      return "bg-slate-400";
    default:
      return "bg-slate-300";
  }
}

const TYPE_COLOR_MAP: Record<string, string> = {
  "amber-500": "bg-amber-500",
  "blue-500": "bg-blue-500",
  "orange-500": "bg-orange-500",
  "violet-500": "bg-violet-500",
  "emerald-500": "bg-emerald-500",
  "slate-500": "bg-slate-500",
  "slate-400": "bg-slate-400",
  "red-500": "bg-red-500",
  "teal-500": "bg-teal-500",
};

function typeColorToBg(color: string | undefined): string {
  return (color && TYPE_COLOR_MAP[color]) || "bg-slate-400";
}
