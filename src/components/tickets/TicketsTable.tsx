"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
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
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-amber-50">
          <div className="flex items-center gap-2">
            <span className="text-lg">📝</span>
            <div>
              <p className="text-sm font-bold text-slate-800">Nota interna</p>
              <p className="text-xs text-slate-500">{ticketCode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribí acá las notas internas del abogado sobre este caso..."
            rows={6}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition leading-relaxed"
          />
          <p className="mt-1.5 text-xs text-slate-400">Solo visible para el equipo interno. Presioná Esc para cerrar.</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-sm transition flex items-center gap-2 ${
              saved ? "bg-emerald-500" : "bg-amber-500 hover:bg-amber-600"
            } disabled:opacity-70`}
          >
            {saved ? (
              <><span>✓</span> Guardado</>
            ) : saving ? (
              <><span className="animate-spin">⏳</span> Guardando...</>
            ) : (
              "Guardar nota"
            )}
          </button>
        </div>
      </div>
    </div>
  );
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
  const [notePopup, setNotePopup] = useState<{ ticketId: string; ticketCode: string; note: string | null | undefined } | null>(null);
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});

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
    <>
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
              <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-700">Nota</th>
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
                const currentNote = localNotes[ticket.id] !== undefined ? localNotes[ticket.id] : ticket.caseNotes;
                const hasNote = !!currentNote?.trim();
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
                    {/* Columna Nota */}
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <button
                        title={hasNote ? currentNote! : "Agregar nota interna"}
                        onClick={(e) => {
                          e.stopPropagation();
                          setNotePopup({ ticketId: ticket.id, ticketCode: ticket.code, note: currentNote });
                        }}
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition ${
                          hasNote
                            ? "bg-amber-100 text-amber-600 hover:bg-amber-200 ring-1 ring-amber-300"
                            : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                        }`}
                      >
                        <svg className="w-4 h-4" fill={hasNote ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
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
    </>
  );
}
