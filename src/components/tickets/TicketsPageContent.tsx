"use client";

import { useState, useMemo } from "react";
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
  lastMessageAt: string;
  createdAt: string;
  customer?: { name: string | null; phone: string } | null;
  assignedTo?: { name: string } | null;
}

export function TicketsPageContent({
  tickets,
  counts,
}: {
  tickets: Ticket[];
  counts: { open: number; inProgress: number; waiting: number; urgent: number };
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "IN_PROGRESS" | "WAITING_CUSTOMER" | "URGENT">("ALL");
  const [tipoFilter, setTipoFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<"lastMessageAt" | "createdAt" | "code">("lastMessageAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filteredTickets = useMemo(() => {
    let list = [...tickets];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.code.toLowerCase().includes(q) ||
          (t.title || "").toLowerCase().includes(q) ||
          (t.customer?.name || "").toLowerCase().includes(q) ||
          (t.contactName || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "ALL") {
      if (statusFilter === "URGENT") {
        list = list.filter((t) => t.priority === "URGENT");
      } else {
        list = list.filter((t) => t.status === statusFilter);
      }
    }
    if (tipoFilter) {
      list = list.filter((t) => (t.legalType || "Sin caso") === tipoFilter);
    }
    list.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      const cmp = typeof aVal === "string" && typeof bVal === "string"
        ? aVal.localeCompare(bVal)
        : new Date(aVal as string).getTime() - new Date(bVal as string).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [tickets, search, statusFilter, tipoFilter, sortBy, sortDir]);

  const tipos = useMemo(() => {
    const set = new Set<string>();
    tickets.forEach((t) => set.add(t.legalType || "Sin caso"));
    return Array.from(set).sort();
  }, [tickets]);

  const formatDateTime = (date: string) => {
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return { date: "—", time: "" };
      return {
        date: d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }),
        time: d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
      };
    } catch {
      return { date: "—", time: "" };
    }
  };

  const toggleSort = (field: "lastMessageAt" | "createdAt" | "code") => {
    if (sortBy === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(field);
      setSortDir("desc");
    }
  };

  return (
    <div className="w-full space-y-5">
      {/* Header: título + búsqueda + Nuevo caso */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Todos los Casos</h1>
        <div className="flex flex-1 sm:max-w-md items-center gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Buscar por cliente, ID, asunto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#2196F3] focus:outline-none focus:ring-1 focus:ring-[#2196F3]"
            />
          </div>
          <Link
            href="/tickets/alta"
            className="flex shrink-0 items-center gap-2 rounded-lg bg-[#2196F3] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1976D2] transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Nuevo caso
          </Link>
        </div>
      </div>

      {/* Pestañas por estado */}
      <div className="flex flex-wrap gap-2">
        <StatusTab
          label="Abiertos"
          count={counts.open}
          active={statusFilter === "OPEN"}
          onClick={() => setStatusFilter(statusFilter === "OPEN" ? "ALL" : "OPEN")}
          color="bg-[#2196F3]"
          icon="📞"
        />
        <StatusTab
          label="En progreso"
          count={counts.inProgress}
          active={statusFilter === "IN_PROGRESS"}
          onClick={() => setStatusFilter(statusFilter === "IN_PROGRESS" ? "ALL" : "IN_PROGRESS")}
          color="bg-orange-500"
        />
        <StatusTab
          label="Esperando Cliente"
          count={counts.waiting}
          active={statusFilter === "WAITING_CUSTOMER"}
          onClick={() => setStatusFilter(statusFilter === "WAITING_CUSTOMER" ? "ALL" : "WAITING_CUSTOMER")}
          color="bg-amber-500"
        />
        <StatusTab
          label="Urgentes"
          count={counts.urgent}
          active={statusFilter === "URGENT"}
          onClick={() => setStatusFilter(statusFilter === "URGENT" ? "ALL" : "URGENT")}
          color="bg-emerald-600"
          icon="🔔"
        />
      </div>

      {/* Filtros secundarios */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#2196F3] focus:outline-none focus:ring-1 focus:ring-[#2196F3]"
        >
          <option value="">Tipo</option>
          {tipos.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            setSearch("");
            setStatusFilter("ALL");
            setTipoFilter("");
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Limpiar
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Asunto
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Asignado
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <SortableHeader
                    label="Última"
                    active={sortBy === "lastMessageAt"}
                    dir={sortDir}
                    onClick={() => toggleSort("lastMessageAt")}
                  />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-500">
                    No hay casos que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => {
                  const last = formatDateTime(ticket.lastMessageAt);
                  return (
                    <tr
                      key={ticket.id}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      onClick={() => router.push(`/tickets/${ticket.id}`)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                        {ticket.code}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/tickets/${ticket.id}`}
                          className="text-sm font-medium text-[#2196F3] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {(ticket.title || ticket.code).slice(0, 50)}
                          {(ticket.title || ticket.code).length > 50 ? "…" : ""}
                        </Link>
                        <div className="text-xs text-slate-500 mt-0.5">{ticket.contactName || "—"}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {ticket.customer?.name || "Empresa desconocida"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                          {ticket.legalType || "Sin caso"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(ticket.status as TicketStatus)}`}>
                          {statusLabels[ticket.status as TicketStatus]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {ticket.assignedTo?.name || "Sin asignar"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                        {last.date} {last.time}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusTab({
  label,
  count,
  active,
  onClick,
  color,
  icon,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  color: string;
  icon?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all ${
        active ? `${color} ring-2 ring-offset-2 ring-slate-300` : `${color} opacity-90 hover:opacity-100`
      }`}
    >
      {icon && <span className="text-base">{icon}</span>}
      <span>{label}</span>
      <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{count}</span>
    </button>
  );
}

function SortableHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-1 hover:text-slate-900">
      {label}
      <span className="text-slate-400">
        {active ? (dir === "asc" ? "↑" : "↓") : "↓"}
      </span>
    </button>
  );
}

function statusBadgeClass(status: TicketStatus): string {
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
    default:
      return "bg-slate-100 text-slate-700";
  }
}
