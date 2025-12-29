import Link from "next/link";
import { statusLabels, priorityLabels } from "@/lib/tickets";

type TicketStatus = "OPEN" | "IN_PROGRESS" | "WAITING_CUSTOMER" | "RESOLVED" | "CLOSED";
type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

interface Ticket {
  id: string;
  code: string;
  title: string;
  status: string;
  priority: string;
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

function priorityBadgeClass(priority: TicketPriority) {
  switch (priority) {
    case "URGENT":
      return "bg-rose-100 text-rose-800";
    case "HIGH":
      return "bg-amber-100 text-amber-800";
    case "NORMAL":
      return "bg-emerald-100 text-emerald-800";
    case "LOW":
      return "bg-slate-200 text-slate-700";
  }
}

export function TicketsTable({ tickets }: { tickets: Ticket[] }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="grid grid-cols-12 border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <div className="col-span-2">ID</div>
        <div className="col-span-3">Asunto</div>
        <div className="col-span-2">Cliente</div>
        <div className="col-span-2">Estado</div>
        <div className="col-span-2">Prioridad</div>
        <div className="col-span-1">Asignado</div>
      </div>
      <div className="divide-y divide-slate-100">
        {tickets.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            No hay tickets en esta sección.
          </div>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket.id} className="grid grid-cols-12 items-center px-4 py-3 hover:bg-slate-50">
              <div className="col-span-2 text-sm font-semibold text-slate-800">{ticket.code}</div>
              <div className="col-span-3">
                <Link
                  href={`/tickets/${ticket.id}`}
                  className="text-sm font-semibold text-indigo-600 hover:underline"
                >
                  {ticket.title}
                </Link>
                <div className="text-xs text-slate-500">{ticket.customer?.phone}</div>
              </div>
              <div className="col-span-2 text-sm text-slate-700">{ticket.customer?.name || "Cliente"}</div>
              <div className="col-span-2">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(ticket.status as TicketStatus)}`}>
                  {statusLabels[ticket.status as TicketStatus]}
                </span>
              </div>
              <div className="col-span-2">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${priorityBadgeClass(ticket.priority as TicketPriority)}`}>
                  {priorityLabels[ticket.priority as TicketPriority]}
                </span>
              </div>
              <div className="col-span-1 text-sm text-slate-700">
                {ticket.assignedTo?.name || "–"}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
