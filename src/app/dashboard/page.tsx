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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            Vista general del sistema de reclamos
          </p>
        </div>

        {/* KPIs principales */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Casos"
            value={stats.totalTickets}
            color="bg-blue-50 text-blue-700"
          />
          <KPICard
            title="Creados Hoy"
            value={stats.ticketsToday}
            color="bg-slate-50 text-slate-700"
          />
          <KPICard
            title="Resueltos Hoy"
            value={stats.resolvedToday}
            color="bg-slate-50 text-slate-700"
          />
          <KPICard
            title="Tiempo Promedio"
            value={`${stats.avgResolutionTime}h`}
            color="bg-slate-50 text-slate-700"
          />
        </div>

        {/* Alerta de urgentes */}
        {stats.urgentUnassigned > 0 && (
          <div className="mb-8 rounded-lg bg-orange-50 border border-orange-200 p-5">
            <div>
              <h3 className="font-semibold text-orange-900">
                Atención: {stats.urgentUnassigned} caso(s) urgente(s) sin asignar
              </h3>
              <p className="text-sm text-orange-700 mt-1">
                Requieren atención inmediata
              </p>
            </div>
          </div>
        )}

        {/* Grid principal */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Tickets por Estado */}
          <div className="rounded-lg bg-white p-6 border border-slate-200 shadow-sm">
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
          <div className="rounded-lg bg-white p-6 border border-slate-200 shadow-sm">
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
          <div className="rounded-lg bg-white p-6 border border-slate-200 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Últimos 7 días
            </h2>
            <div className="flex items-end justify-between gap-2 h-48">
              {stats.last7Days.map((day: any) => {
                const maxCount = Math.max(...stats.last7Days.map((d: any) => d.count));
                const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                return (
                  <div key={day.date} className="flex flex-col items-center flex-1">
                    <div className="text-xs font-semibold text-slate-700 mb-1">
                      {day.count}
                    </div>
                    <div
                      className="w-full bg-slate-900 rounded-t transition-all"
                      style={{ height: `${height}%`, minHeight: day.count > 0 ? "8px" : "2px" }}
                    />
                    <div className="mt-2 text-xs text-slate-500">
                      {new Date(day.date).toLocaleDateString("es", { weekday: "short" })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Agentes */}
          <div className="rounded-lg bg-white p-6 border border-slate-200 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Top Abogados
            </h2>
            <div className="space-y-3">
              {stats.topAgents.length === 0 ? (
                <p className="text-sm text-slate-500">No hay abogados con casos asignados.</p>
              ) : (
                stats.topAgents.map((agent: any, index: number) => (
                  <div key={agent.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                        {index + 1}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-slate-900">{agent.name}</div>
                        <div className="text-xs text-slate-500">{agent.email}</div>
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                      {agent.activeTickets}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tipos de caso */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Casos por tipo
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {stats.ticketsByLegalType.length === 0 ? (
                <p className="text-sm text-slate-500">No hay datos disponibles.</p>
              ) : (
                stats.ticketsByLegalType.map((item: any, index: number) => (
                  <div
                    key={item.legalType}
                    className="rounded-lg border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-500">{index + 1}</span>
                      <span className="text-xl font-bold text-slate-900">
                        {item.count}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {item.legalType}
                    </div>
                    <div className="text-xs text-slate-500">
                      {item.count} {item.count === 1 ? "caso" : "casos"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </TicketsLayout>
  );
}

function KPICard({
  title,
  value,
  color,
}: {
  title: string;
  value: string | number;
  color: string;
}) {
  const [bgColor, textColor] = color.split(" ");
  return (
    <div className="rounded-lg bg-white p-5 border border-slate-200 shadow-sm">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{title}</p>
        <p className="text-3xl font-bold text-slate-900">{value}</p>
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
