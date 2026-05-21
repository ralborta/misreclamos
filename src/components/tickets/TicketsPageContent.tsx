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
  unreadCount?: number;
  lastInboundAt?: string | null;
  lastOutboundAt?: string | null;
}

type Counts = {
  open: number;
  inProgress: number;
  waiting: number;
  urgent: number;
  resolved?: number;
  closed?: number;
  unread?: number;
  trends?: {
    open: number;
    inProgress: number;
    waiting: number;
    urgent: number;
    resolved: number;
    closed: number;
  };
};

type StatusFilterValue = "ALL" | "OPEN" | "IN_PROGRESS" | "WAITING_CUSTOMER" | "URGENT" | "RESOLVED" | "CLOSED";
type DateRangeValue = "ALL" | "TODAY" | "7D" | "30D";

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
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
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
        setTimeout(() => {
          setSaved(false);
          onClose();
        }, 900);
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelative(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "Recién";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH} h ${diffMin % 60 > 0 ? `${diffMin % 60} min` : ""}`.trim();
  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return `Hace ${diffD} d`;
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTimeShort(date: Date): { date: string; time: string } {
  return {
    date: date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }),
    time: date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
  };
}

function initialsOf(name: string | null | undefined): string {
  if (!name) return "??";
  const clean = name.trim();
  if (!clean) return "??";
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function avatarColorFor(name: string | null | undefined): string {
  const palette = ["bg-blue-100 text-blue-700", "bg-amber-100 text-amber-700", "bg-emerald-100 text-emerald-700", "bg-violet-100 text-violet-700", "bg-rose-100 text-rose-700", "bg-teal-100 text-teal-700", "bg-orange-100 text-orange-700", "bg-cyan-100 text-cyan-700"];
  const seed = (name || "?").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return palette[seed % palette.length];
}

function statusBadgeClass(status: TicketStatus): string {
  switch (status) {
    case "OPEN":
      return "bg-blue-100 text-blue-700 ring-1 ring-blue-200";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-700 ring-1 ring-amber-200";
    case "WAITING_CUSTOMER":
      return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200";
    case "RESOLVED":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "CLOSED":
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }
}

function tipoBadgeClass(legalType: string | null | undefined): string {
  const t = legalType || "Sin caso";
  if (t === "Sin caso") return "inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600";
  const lower = t.toLowerCase();
  if (lower.includes("urgen")) return "inline-flex items-center rounded-lg bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700";
  if (lower.includes("trabajo")) return "inline-flex items-center rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700";
  if (lower.includes("tránsito") || lower.includes("transito") || lower.includes("accidente")) return "inline-flex items-center rounded-lg bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700";
  if (lower.includes("comercial")) return "inline-flex items-center rounded-lg bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700";
  if (lower.includes("salud") || lower.includes("amparo")) return "inline-flex items-center rounded-lg bg-cyan-100 px-2.5 py-1 text-xs font-medium text-cyan-700";
  if (lower.includes("sucesi")) return "inline-flex items-center rounded-lg bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700";
  return "inline-flex items-center rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700";
}

// Categorización de la fila según estado de lectura/respuesta
function rowStateOf(ticket: Ticket): "unread" | "no_reply_6h" | "normal" {
  if ((ticket.unreadCount || 0) > 0) return "unread";
  const inboundIso = ticket.lastInboundAt;
  const outboundIso = ticket.lastOutboundAt;
  if (!inboundIso) return "normal";
  const inboundT = new Date(inboundIso).getTime();
  const outboundT = outboundIso ? new Date(outboundIso).getTime() : 0;
  if (inboundT > outboundT) {
    const diffH = (Date.now() - inboundT) / (1000 * 60 * 60);
    if (diffH >= 6 && ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"].includes(ticket.status)) return "no_reply_6h";
  }
  return "normal";
}

function rowBarClass(state: "unread" | "no_reply_6h" | "normal"): string {
  if (state === "unread") return "bg-blue-500";
  if (state === "no_reply_6h") return "bg-orange-400";
  return "bg-transparent";
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function TicketsPageContent({
  tickets,
  counts,
  initialStatusFilter,
  pageTitle = "Todos los casos",
}: {
  tickets: Ticket[];
  counts: Counts;
  initialStatusFilter?: StatusFilterValue;
  pageTitle?: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>(initialStatusFilter ?? "ALL");
  const [notePopup, setNotePopup] = useState<{ ticketId: string; ticketCode: string; note: string | null | undefined } | null>(null);
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});
  const [tipoFilter, setTipoFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRangeValue>("ALL");
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [sortBy, setSortBy] = useState<"lastMessageAt" | "createdAt" | "code">("lastMessageAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, tipoFilter, dateRange, onlyUnread, sortBy, sortDir]);

  const tipos = useMemo(() => {
    const set = new Set<string>();
    tickets.forEach((t) => set.add(t.legalType || "Sin caso"));
    return Array.from(set).sort();
  }, [tickets]);

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
    if (onlyUnread) {
      list = list.filter((t) => (t.unreadCount || 0) > 0);
    }
    if (dateRange !== "ALL") {
      const now = Date.now();
      const limit =
        dateRange === "TODAY"
          ? now - 24 * 60 * 60 * 1000
          : dateRange === "7D"
            ? now - 7 * 24 * 60 * 60 * 1000
            : now - 30 * 24 * 60 * 60 * 1000;
      list = list.filter((t) => new Date(t.lastMessageAt).getTime() >= limit);
    }
    list.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      const cmp =
        typeof aVal === "string" && typeof bVal === "string"
          ? aVal.localeCompare(bVal)
          : new Date(aVal as string).getTime() - new Date(bVal as string).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [tickets, search, statusFilter, tipoFilter, dateRange, onlyUnread, sortBy, sortDir]);

  const activeFiltersCount =
    (statusFilter !== "ALL" ? 1 : 0) + (tipoFilter ? 1 : 0) + (dateRange !== "ALL" ? 1 : 0) + (onlyUnread ? 1 : 0);

  const totalFiltered = filteredTickets.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pageItems = filteredTickets.slice(pageStart, pageStart + pageSize);

  const cleanFilters = () => {
    setSearch("");
    setStatusFilter(initialStatusFilter ?? "ALL");
    setTipoFilter("");
    setDateRange("ALL");
    setOnlyUnread(false);
  };

  return (
    <div className="w-full space-y-5">
      {/* Header: título + búsqueda + Nuevo caso */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-600 shadow-sm">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" />
            </svg>
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-slate-900">{pageTitle}</h1>
            <p className="mt-0.5 text-sm text-slate-500">Gestiona y realiza seguimiento de todos los casos de la plataforma.</p>
          </div>
        </div>
        <div className="flex flex-1 lg:max-w-xl items-center gap-2">
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
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-14 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm focus:border-[#2196F3] focus:outline-none focus:ring-1 focus:ring-[#2196F3]"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
              ⌘ K
            </span>
          </div>
          <Link
            href="/tickets/alta"
            className="flex shrink-0 items-center gap-2 rounded-xl bg-[#2196F3] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1976D2] transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo caso
          </Link>
        </div>
      </div>

      {/* Cards de stats con trend */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Abiertos"
          value={counts.open}
          trend={counts.trends?.open ?? 0}
          icon="folder"
          color="blue"
          active={statusFilter === "OPEN"}
          onClick={() => setStatusFilter(statusFilter === "OPEN" ? "ALL" : "OPEN")}
        />
        <StatCard
          label="En progreso"
          value={counts.inProgress}
          trend={counts.trends?.inProgress ?? 0}
          icon="folder"
          color="orange"
          active={statusFilter === "IN_PROGRESS"}
          onClick={() => setStatusFilter(statusFilter === "IN_PROGRESS" ? "ALL" : "IN_PROGRESS")}
        />
        <StatCard
          label="Esperando cliente"
          value={counts.waiting}
          trend={counts.trends?.waiting ?? 0}
          icon="folder"
          color="amber"
          active={statusFilter === "WAITING_CUSTOMER"}
          onClick={() => setStatusFilter(statusFilter === "WAITING_CUSTOMER" ? "ALL" : "WAITING_CUSTOMER")}
        />
        <StatCard
          label="Urgentes"
          value={counts.urgent}
          trend={counts.trends?.urgent ?? 0}
          icon="warning"
          color="red"
          active={statusFilter === "URGENT"}
          onClick={() => setStatusFilter(statusFilter === "URGENT" ? "ALL" : "URGENT")}
        />
        <StatCard
          label="Resueltos"
          value={counts.resolved ?? 0}
          trend={counts.trends?.resolved ?? 0}
          icon="check"
          color="emerald"
          active={statusFilter === "RESOLVED"}
          onClick={() => setStatusFilter(statusFilter === "RESOLVED" ? "ALL" : "RESOLVED")}
        />
        <StatCard
          label="Cerrados"
          value={counts.closed ?? 0}
          trend={counts.trends?.closed ?? 0}
          icon="archive"
          color="slate"
          active={statusFilter === "CLOSED"}
          onClick={() => setStatusFilter(statusFilter === "CLOSED" ? "ALL" : "CLOSED")}
        />
      </div>

      {/* Toolbar de filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <ToolbarButton icon="filter" badge={activeFiltersCount || undefined} onClick={cleanFilters} title="Limpiar filtros">
          Filtros
        </ToolbarButton>
        <SelectButton
          label="Tipo de caso"
          value={tipoFilter}
          onChange={setTipoFilter}
          options={[{ value: "", label: "Todos" }, ...tipos.map((t) => ({ value: t, label: t }))]}
        />
        <SelectButton
          label="Estado"
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as StatusFilterValue)}
          options={[
            { value: "ALL", label: "Todos" },
            { value: "OPEN", label: "Abierto" },
            { value: "IN_PROGRESS", label: "En progreso" },
            { value: "WAITING_CUSTOMER", label: "Esperando cliente" },
            { value: "URGENT", label: "Urgente" },
            { value: "RESOLVED", label: "Resuelto" },
            { value: "CLOSED", label: "Cerrado" },
          ]}
        />
        <SelectButton
          label="Rango de fechas"
          value={dateRange}
          onChange={(v) => setDateRange(v as DateRangeValue)}
          icon="calendar"
          options={[
            { value: "ALL", label: "Todas las fechas" },
            { value: "TODAY", label: "Hoy" },
            { value: "7D", label: "Últimos 7 días" },
            { value: "30D", label: "Últimos 30 días" },
          ]}
        />
        <button
          type="button"
          onClick={() => setOnlyUnread((v) => !v)}
          className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
            onlyUnread ? "bg-blue-500 text-white shadow-sm ring-1 ring-blue-500" : "bg-blue-50 text-blue-700 hover:bg-blue-100 ring-1 ring-blue-100"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${onlyUnread ? "bg-white" : "bg-blue-500"}`} />
          Sin leer
          <span className={`rounded-md px-1.5 py-0.5 text-xs font-semibold ${onlyUnread ? "bg-white/20 text-white" : "bg-blue-500/10 text-blue-700"}`}>
            {counts.unread ?? 0}
          </span>
        </button>

        <div className="ml-auto flex items-center gap-2">
          <div className="text-xs text-slate-500 hidden sm:block">Ordenar por:</div>
          <SelectButton
            label="Última actividad"
            value={`${sortBy}:${sortDir}`}
            onChange={(v) => {
              const [field, dir] = v.split(":") as ["lastMessageAt" | "createdAt" | "code", "asc" | "desc"];
              setSortBy(field);
              setSortDir(dir);
            }}
            options={[
              { value: "lastMessageAt:desc", label: "Última actividad" },
              { value: "createdAt:desc", label: "Creación (más reciente)" },
              { value: "createdAt:asc", label: "Creación (más antigua)" },
              { value: "code:asc", label: "ID (A → Z)" },
              { value: "code:desc", label: "ID (Z → A)" },
            ]}
          />
        </div>
      </div>

      {/* Vista tarjetas - solo mobile */}
      <div className="md:hidden space-y-2">
        {pageItems.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500 shadow-sm">
            No hay casos que coincidan con los filtros.
          </div>
        ) : (
          pageItems.map((ticket) => {
            const lastDate = new Date(ticket.lastMessageAt);
            const isResolved = ticket.status === "RESOLVED" || ticket.status === "CLOSED";
            const currentNote = localNotes[ticket.id] !== undefined ? localNotes[ticket.id] : ticket.caseNotes;
            const hasNote = !!currentNote;
            const rowState = rowStateOf(ticket);
            return (
              <div
                key={ticket.id}
                className="relative rounded-xl border border-slate-200 bg-white shadow-sm p-4 cursor-pointer active:bg-slate-50 transition-colors overflow-hidden"
                onClick={() => router.push(`/tickets/${ticket.id}`)}
              >
                <span className={`absolute left-0 top-0 bottom-0 w-1 ${rowBarClass(rowState)}`} />
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1 pl-1">
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
                    <p className={`text-sm leading-snug line-clamp-2 ${rowState === "unread" ? "font-bold text-slate-900" : "font-semibold text-slate-800"}`}>
                      {ticket.title || ticket.code}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{ticket.contactName || "Sin nombre"}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(ticket.status as TicketStatus)}`}>
                      {statusLabels[ticket.status as TicketStatus]}
                    </span>
                    <span className={tipoBadgeClass(ticket.legalType)}>{ticket.legalType || "Sin caso"}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MessagesBadge count={ticket.unreadCount || 0} variant={rowState === "unread" ? "unread" : "muted"} compact />
                    <span className="font-medium text-slate-600">{ticket.assignedTo?.name || "Sin asignar"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{formatRelative(lastDate)}</span>
                    <button
                      title={hasNote ? "Ver / editar nota" : "Agregar nota"}
                      onClick={(e) => {
                        e.stopPropagation();
                        setNotePopup({ ticketId: ticket.id, ticketCode: ticket.code, note: currentNote });
                      }}
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
              </div>
            );
          })
        )}
      </div>

      {/* Tabla: solo desktop */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">ID</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Asunto</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Cliente</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tipo</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Estado</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Mensajes</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Asignado</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <SortableHeader label="Última actividad" active={sortBy === "lastMessageAt"} dir={sortDir} onClick={() => {
                    if (sortBy === "lastMessageAt") setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                    else { setSortBy("lastMessageAt"); setSortDir("desc"); }
                  }} />
                </th>
                <th className="px-3 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Nota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-500">
                    No hay casos que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                pageItems.map((ticket) => {
                  const lastDate = new Date(ticket.lastMessageAt);
                  const dt = formatDateTimeShort(lastDate);
                  const isResolved = ticket.status === "RESOLVED" || ticket.status === "CLOSED";
                  const currentNote = localNotes[ticket.id] !== undefined ? localNotes[ticket.id] : ticket.caseNotes;
                  const hasNote = !!currentNote;
                  const rowState = rowStateOf(ticket);
                  const isUnread = rowState === "unread";
                  return (
                    <tr
                      key={ticket.id}
                      className={`relative cursor-pointer transition-colors ${isUnread ? "bg-blue-50/60 hover:bg-blue-50" : "hover:bg-slate-50/80"}`}
                      onClick={() => router.push(`/tickets/${ticket.id}`)}
                    >
                      <td className="relative pl-4 pr-3 py-3.5 whitespace-nowrap text-sm text-slate-700">
                        <span className={`absolute left-0 top-0 bottom-0 w-[3px] ${rowBarClass(rowState)}`} />
                        <div className="flex items-center gap-1.5">
                          {isUnread && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                          <span className={isUnread ? "font-semibold text-slate-900" : "font-medium text-slate-700"}>{ticket.code}</span>
                          <button
                            type="button"
                            title="Copiar ID"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard?.writeText(ticket.code).catch(() => {});
                            }}
                            className="rounded p-1 text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
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
                              className={`block truncate ${isUnread ? "text-sm font-bold text-slate-900" : "text-sm font-medium text-slate-800"} hover:underline`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {(ticket.title || ticket.code).slice(0, 60)}
                              {(ticket.title || ticket.code).length > 60 ? "…" : ""}
                            </Link>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {rowState === "unread"
                                ? "Último mensaje del cliente"
                                : rowState === "no_reply_6h"
                                  ? "Sin responder hace más de 6 h"
                                  : "Sin mensajes nuevos"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ${avatarColorFor(ticket.customer?.name || ticket.contactName)}`}>
                            {initialsOf(ticket.customer?.name || ticket.contactName)}
                          </span>
                          <span className="text-sm text-slate-700">{ticket.contactName || ticket.customer?.name || "Sin nombre"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={tipoBadgeClass(ticket.legalType)}>{ticket.legalType || "Sin caso"}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-medium ${statusBadgeClass(ticket.status as TicketStatus)}`}>
                          {statusLabels[ticket.status as TicketStatus]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <MessagesBadge count={ticket.unreadCount || 0} variant={isUnread ? "unread" : "muted"} />
                      </td>
                      <td className="px-4 py-3.5 text-sm">
                        {ticket.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ${avatarColorFor(ticket.assignedTo.name)}`}>
                              {initialsOf(ticket.assignedTo.name)}
                            </span>
                            <span className="text-slate-700">{ticket.assignedTo.name}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-slate-400">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1" />
                              <circle cx="9" cy="7" r="4" strokeWidth={2} />
                            </svg>
                            Sin asignar
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm">
                        <div className={isUnread ? "font-semibold text-blue-600" : "text-slate-700"}>{formatRelative(lastDate)}</div>
                        <div className="text-xs text-slate-400">{dt.date} {dt.time}</div>
                      </td>
                      <td className="px-3 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
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

        {/* Footer paginación */}
        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-500">
            {totalFiltered === 0
              ? "Sin resultados"
              : `Mostrando ${pageStart + 1} a ${Math.min(pageStart + pageSize, totalFiltered)} de ${totalFiltered} casos`}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
            >
              <option value={10}>10 por página</option>
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
              <option value={100}>100 por página</option>
            </select>
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-600 disabled:opacity-40 hover:bg-slate-100"
            >
              ‹
            </button>
            <span className="px-1">
              Página <span className="font-semibold text-slate-700">{safePage}</span> / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-600 disabled:opacity-40 hover:bg-slate-100"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          Con mensajes sin leer
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-[3px] rounded bg-orange-400" />
          Sin responder hace más de 6 h
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-slate-300" />
          Sin mensajes nuevos
        </span>
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

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  trend,
  icon,
  color,
  active,
  onClick,
}: {
  label: string;
  value: number;
  trend: number;
  icon: "folder" | "warning" | "check" | "archive";
  color: "blue" | "orange" | "amber" | "red" | "emerald" | "slate";
  active?: boolean;
  onClick?: () => void;
}) {
  const colorMap: Record<string, { bg: string; text: string; ring: string; trendUp: string; trendDown: string }> = {
    blue: { bg: "bg-blue-100", text: "text-blue-600", ring: "ring-blue-300", trendUp: "text-blue-600", trendDown: "text-rose-500" },
    orange: { bg: "bg-orange-100", text: "text-orange-600", ring: "ring-orange-300", trendUp: "text-orange-600", trendDown: "text-rose-500" },
    amber: { bg: "bg-amber-100", text: "text-amber-600", ring: "ring-amber-300", trendUp: "text-amber-600", trendDown: "text-rose-500" },
    red: { bg: "bg-red-100", text: "text-red-600", ring: "ring-red-300", trendUp: "text-red-600", trendDown: "text-emerald-500" },
    emerald: { bg: "bg-emerald-100", text: "text-emerald-600", ring: "ring-emerald-300", trendUp: "text-emerald-600", trendDown: "text-rose-500" },
    slate: { bg: "bg-slate-100", text: "text-slate-600", ring: "ring-slate-300", trendUp: "text-slate-600", trendDown: "text-rose-500" },
  };
  const cls = colorMap[color];
  const up = trend > 0;
  const flat = trend === 0;
  const trendColor = flat ? "text-slate-400" : up ? cls.trendUp : cls.trendDown;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-2xl bg-white p-3.5 text-left shadow-sm ring-1 transition hover:shadow-md ${
        active ? `ring-2 ${cls.ring}` : "ring-slate-200"
      }`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cls.bg} ${cls.text}`}>
        <StatIcon name={icon} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">{value}</span>
          <span className={`text-[11px] font-semibold inline-flex items-center gap-0.5 ${trendColor}`}>
            {flat ? "0%" : (
              <>
                {up ? (
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 15l5-7 5 7H5z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 5l5 7 5-7H5z" clipRule="evenodd" />
                  </svg>
                )}
                {Math.abs(trend)}%
              </>
            )}
          </span>
        </div>
      </div>
    </button>
  );
}

function StatIcon({ name }: { name: "folder" | "warning" | "check" | "archive" }) {
  if (name === "warning") {
    return (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
    );
  }
  if (name === "check") {
    return (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    );
  }
  if (name === "archive") {
    return (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.25 7.5 19.5 18a2.25 2.25 0 0 1-2.244 2.077H6.744A2.25 2.25 0 0 1 4.5 18L3.75 7.5m16.5 0H3.75m16.5 0L18 4.5H6L3.75 7.5m6 4.5h4.5" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75M3.75 18.75h16.5a1.5 1.5 0 0 0 1.5-1.5v-2.25H2.25v2.25a1.5 1.5 0 0 0 1.5 1.5ZM12 9.75V4.5a1.5 1.5 0 0 0-1.5-1.5h-4.5A1.5 1.5 0 0 0 4.5 4.5v5.25" />
    </svg>
  );
}

function MessagesBadge({ count, variant, compact = false }: { count: number; variant: "unread" | "muted"; compact?: boolean }) {
  const isUnread = variant === "unread" && count > 0;
  return (
    <span className={`inline-flex items-center gap-1.5 ${compact ? "" : "rounded-lg px-2 py-1"} ${isUnread ? (compact ? "" : "bg-blue-500/10") : ""}`}>
      <svg className={`h-4 w-4 ${isUnread ? "text-blue-500" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
      </svg>
      <span className={`text-sm font-semibold ${isUnread ? "text-blue-600" : "text-slate-500"}`}>{count}</span>
      {isUnread && <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">sin leer</span>}
    </span>
  );
}

function ToolbarButton({
  children,
  icon,
  badge,
  onClick,
  title,
}: {
  children: React.ReactNode;
  icon?: "filter";
  badge?: number;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm"
    >
      {icon === "filter" && (
        <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 4.5h18M6 12h12M10.5 19.5h3" />
        </svg>
      )}
      {children}
      {badge !== undefined && (
        <span className="inline-flex items-center justify-center rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-blue-600">{badge}</span>
      )}
    </button>
  );
}

function SelectButton({
  label,
  value,
  onChange,
  options,
  icon,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  icon?: "calendar";
}) {
  const current = options.find((o) => o.value === value);
  return (
    <div className="relative inline-flex items-center">
      {icon === "calendar" && (
        <svg className="pointer-events-none absolute left-3 h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6.75 3v2.25M17.25 3v2.25M3.75 8.25h16.5M4.5 6.75h15A1.5 1.5 0 0 1 21 8.25v11.25A1.5 1.5 0 0 1 19.5 21h-15A1.5 1.5 0 0 1 3 19.5V8.25a1.5 1.5 0 0 1 1.5-1.5Z" />
        </svg>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none rounded-xl border border-slate-200 bg-white py-2 pr-8 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition ${icon === "calendar" ? "pl-9" : "pl-3"}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.value === value ? (current?.label || label) : o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2.5 text-slate-400">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </span>
    </div>
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
      <span className="text-slate-500">{active ? (dir === "asc" ? "↑" : "↓") : "↓"}</span>
    </button>
  );
}
