"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { statusLabels } from "@/lib/tickets";

type TicketStatus = "OPEN" | "IN_PROGRESS" | "WAITING_CUSTOMER" | "RESOLVED" | "CLOSED";

interface Ticket {
  id: string;
  code: string;
  title: string;
  contactName: string;
  status: string;
  priority: string;
  legalType?: string | null;
  lastMessageAt: Date | string;
  createdAt: Date | string;
  customer?: {
    name: string | null;
    phone: string;
  } | null;
  assignedTo?: {
    name: string;
  } | null;
}

function statusBadgeClass(status: TicketStatus) {
  switch (status) {
    case "OPEN":
      return "bg-blue-100 text-blue-800";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-800";
    case "WAITING_CUSTOMER":
      return "bg-lime-100 text-lime-800";
    case "RESOLVED":
      return "bg-emerald-100 text-emerald-800";
    case "CLOSED":
      return "bg-slate-200 text-slate-700";
  }
}

export function TicketsTable({ tickets }: { tickets: Ticket[] }) {
  const router = useRouter();

  const formatDateTime = (date: Date | string) => {
    try {
      const d = typeof date === "string" ? new Date(date) : date;
      if (isNaN(d.getTime())) {
        return { date: "N/A", time: "N/A" };
      }
      return {
        date: d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }),
        time: d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
      };
    } catch {
      return { date: "N/A", time: "N/A" };
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">ID</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Asunto</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Cliente</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Estado</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Tipo de caso</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Asignado</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Última Actividad</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">Creado</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl">📭</span>
                    <span>No hay tickets en esta sección.</span>
                  </div>
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => {
                const lastActivity = formatDateTime(ticket.lastMessageAt);
                const created = formatDateTime(ticket.createdAt);
                return (
                  <tr
                    key={ticket.id}
                    className="hover:bg-indigo-50/30 transition-colors cursor-pointer"
                    onClick={() => router.push(`/tickets/${ticket.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-900">{ticket.code}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {ticket.title.length > 60 ? `${ticket.title.substring(0, 60)}...` : ticket.title}
                      </Link>
                      <div className="text-xs text-slate-500 mt-1">📱 {ticket.customer?.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">
                        {ticket.customer?.name || "Empresa desconocida"}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">👤 {ticket.contactName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold shadow-sm ${statusBadgeClass(ticket.status as TicketStatus)}`}
                      >
                        {statusLabels[ticket.status as TicketStatus]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800">
                        {ticket.legalType || "Sin caso"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ticket.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-xs font-bold text-indigo-700">
                              {ticket.assignedTo.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-slate-700">{ticket.assignedTo.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400 italic">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{lastActivity.date}</div>
                      <div className="text-xs text-slate-500">{lastActivity.time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-700">{created.date}</div>
                      <div className="text-xs text-slate-500">{created.time}</div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
