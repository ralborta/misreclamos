"use client";

import { useState, useMemo, useRef, useEffect } from "react";
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
  caseNotes?: string | null;
  lastMessageAt: string;
  createdAt: string;
  customer?: { name: string | null; phone: string } | null;
  assignedTo?: { name: string } | null;
}

// ─── Popup de Nota ────────────────────────────────────────────────────────────
function NotePopup({
  ticketId,
  ticketCode,
  initialNote,
  onClose,
  onSaved,
}: {
  ticketId: string;
  ticketCode: string;
  initialNote: string | null | undefined;
  onClose: () => void;
  onSaved: (note: string) => void;
}) {
  const [text, setText] = useState(initialNote || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseNotes: text }),
      });
      if (res.ok) {
        onSaved(text);
        setSaved(true);
        setTimeout(() => { setSaved(false); onClose(); }, 900);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/70 bg-slate-100/60">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-700">Nota interna</p>
              <p className="text-xs text-slate-400">{ticketCode}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/80 hover:text-slate-600 transition">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribí acá las notas internas del abogado sobre este caso..."
            rows={6}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300/60 focus:border-indigo-300 transition leading-relaxed"
          />
          <p className="mt-1.5 text-xs text-slate-400">Solo visible para el equipo interno · Esc para cerrar</p>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50/60">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-200/70 transition">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-sm transition flex items-center gap-2 ${saved ? "bg-teal-500/90" : "bg-indigo-400 hover:bg-indigo-500"} disabled:opacity-70`}
          >
            {saved ? "✓ Guardado" : saving ? "Guardando…" : "Guardar nota"}
          </button>
        </div>
      </div>
    </div>
  );
}

type StatusFilterValue = "ALL" | "OPEN" | "IN_PROGRESS" | "WAITING_CUSTOMER" | "URGENT" | "RESOLVED" | "CLOSED";

export function TicketsPageContent({
  tickets,
  counts,
  initialStatusFilter,
  pageTitle = "Todos los Casos",
}: {
  tickets: Ticket[];
  counts: {
    open: number;
    inProgress: number;
    waiting: number;
    urgent: number;
    resolved?: number;
    closed?: number;
  };
  initialStatusFilter?: StatusFilterValue;
  pageTitle?: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>(initialStatusFilter ?? "ALL");
  const [notePopup, setNotePopup] = useState<{ ticketId: string; ticketCode: string; note: string | null | undefined } | null>(null);
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});
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
        <h1 className="text-2xl font-bold text-slate-800">{pageTitle}</h1>
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

      {/* Pestañas por estado (diseño: pastillas con iconos y badge) */}
      <div className="flex flex-wrap gap-2">
        <StatusTab
          label="Abiertos"
          count={counts.open}
          active={statusFilter === "OPEN"}
          onClick={() => setStatusFilter(statusFilter === "OPEN" ? "ALL" : "OPEN")}
          color="bg-[#2196F3]"
          iconSvg="pen"
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
          color="bg-orange-500"
        />
        <StatusTab
          label="Urgentes"
          count={counts.urgent}
          active={statusFilter === "URGENT"}
          onClick={() => setStatusFilter(statusFilter === "URGENT" ? "ALL" : "URGENT")}
          color="bg-red-500"
          iconSvg="warning"
        />
        <StatusTab
          label="Resueltos"
          count={counts.resolved ?? 0}
          active={statusFilter === "RESOLVED"}
          onClick={() => setStatusFilter(statusFilter === "RESOLVED" ? "ALL" : "RESOLVED")}
          color="bg-emerald-600"
        />
        <StatusTab
          label="Cerrados"
          count={counts.closed ?? 0}
          active={statusFilter === "CLOSED"}
          onClick={() => setStatusFilter(statusFilter === "CLOSED" ? "ALL" : "CLOSED")}
          color="bg-slate-600"
        />
      </div>

      {/* Filtros: Tipo (dropdown con chevron) + Limpiar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            className="appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 py-2 text-sm text-slate-700 focus:border-[#2196F3] focus:outline-none focus:ring-1 focus:ring-[#2196F3]"
          >
            <option value="">Tipo</option>
            {tipos.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setSearch("");
            setStatusFilter(initialStatusFilter ?? "ALL");
            setTipoFilter("");
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Limpiar
        </button>
      </div>

      {/* Vista tarjetas - solo mobile */}
      <div className="md:hidden space-y-2">
        {filteredTickets.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500 shadow-sm">
            No hay casos que coincidan con los filtros.
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const last = formatDateTime(ticket.lastMessageAt);
            const isResolved = ticket.status === "RESOLVED" || ticket.status === "CLOSED";
            const currentNote = localNotes[ticket.id] !== undefined ? localNotes[ticket.id] : ticket.caseNotes;
            const hasNote = !!currentNote;
            return (
              <div
                key={ticket.id}
                className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 cursor-pointer active:bg-slate-50 transition-colors"
                onClick={() => router.push(`/tickets/${ticket.id}`)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {isResolved && (
                        <span className="shrink-0 text-emerald-500">
                          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                      <p className="text-xs font-medium text-slate-400">{ticket.code}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">
                      {ticket.title || ticket.code}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{ticket.contactName || "Sin nombre"} · {ticket.customer?.name || ""}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(ticket.status as TicketStatus)}`}>
                      {statusLabels[ticket.status as TicketStatus]}
                    </span>
                    <span className={tipoBadgeClass(ticket.legalType)}>
                      {ticket.legalType || "Sin caso"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-500">
                    <span className="font-medium text-slate-600">{ticket.assignedTo?.name || "Sin asignar"}</span>
                    <span className="mx-1">·</span>
                    {last.date} {last.time}
                  </div>
                  <button
                    title={hasNote ? "Ver / editar nota" : "Agregar nota"}
                    onClick={(e) => { e.stopPropagation(); setNotePopup({ ticketId: ticket.id, ticketCode: ticket.code, note: currentNote }); }}
                    className="rounded-lg p-1 transition hover:bg-teal-50"
                  >
                    {hasNote ? (
                      <svg className="h-4 w-4 text-teal-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Tabla: solo desktop */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">ID</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Asunto</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Cliente</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Tipo</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Estado</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Asignado</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                  <SortableHeader
                    label="Última"
                    active={sortBy === "lastMessageAt"}
                    dir={sortDir}
                    onClick={() => toggleSort("lastMessageAt")}
                  />
                </th>
                <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-700">Nota</th>
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
                  const isResolved = ticket.status === "RESOLVED" || ticket.status === "CLOSED";
                  const currentNote = localNotes[ticket.id] !== undefined ? localNotes[ticket.id] : ticket.caseNotes;
                  const hasNote = !!currentNote;
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
                        <div className="flex items-start gap-2">
                          {isResolved && (
                            <span className="mt-0.5 shrink-0 text-emerald-500" title="Resuelto">
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                          <div className="min-w-0">
                            <Link
                              href={`/tickets/${ticket.id}`}
                              className="text-sm font-medium text-[#2196F3] hover:underline block truncate"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {(ticket.title || ticket.code).slice(0, 60)}
                              {(ticket.title || ticket.code).length > 60 ? "…" : ""}
                            </Link>
                            <div className="text-xs text-slate-500 mt-0.5">{ticket.contactName || "Sin nombre"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {ticket.customer?.name || "Empresa desconocida"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={tipoBadgeClass(ticket.legalType)}>
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
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          title={hasNote ? "Ver / editar nota" : "Agregar nota"}
                          onClick={() => setNotePopup({ ticketId: ticket.id, ticketCode: ticket.code, note: currentNote })}
                          className="rounded-lg p-1.5 transition hover:bg-teal-50"
                        >
                          {hasNote ? (
                            <svg className="h-4 w-4 text-teal-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                            </svg>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {notePopup && (
        <NotePopup
          ticketId={notePopup.ticketId}
          ticketCode={notePopup.ticketCode}
          initialNote={notePopup.note}
          onClose={() => setNotePopup(null)}
          onSaved={(note) => {
            setLocalNotes((prev) => ({ ...prev, [notePopup.ticketId]: note }));
            setNotePopup(null);
          }}
        />
      )}
    </div>
  );
}

function StatusTab({
  label,
  count,
  active,
  onClick,
  color,
  iconSvg,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  color: string;
  iconSvg?: "pen" | "warning";
}) {
  const penIcon = (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
    </svg>
  );
  const warningIcon = (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  );
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all ${
        active ? `${color} ring-2 ring-offset-2 ring-slate-300` : `${color} opacity-90 hover:opacity-100`
      }`}
    >
      {iconSvg === "pen" && penIcon}
      {iconSvg === "warning" && warningIcon}
      <span>{label}</span>
      <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">{count}</span>
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
    <button type="button" onClick={onClick} className="flex items-center gap-1 hover:text-slate-900 text-left">
      {label}
      <span className="text-slate-500">
        {active ? (dir === "asc" ? "↑" : "↓") : "↓"}
      </span>
    </button>
  );
}

function tipoBadgeClass(legalType: string | null | undefined): string {
  const t = legalType || "Sin caso";
  if (t === "Sin caso") return "inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700";
  if (t.toLowerCase().includes("tránsito") || t.toLowerCase().includes("transito")) return "inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800";
  return "inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800";
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
