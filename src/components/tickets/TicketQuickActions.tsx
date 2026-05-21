"use client";

import { useState } from "react";

type Props = {
  ticketId: string;
  ticketCode: string;
};

export function TicketQuickActions({ ticketId, ticketCode }: Props) {
  const [copied, setCopied] = useState(false);
  const [marking, setMarking] = useState(false);
  const [marked, setMarked] = useState(false);

  const copyLink = async () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/tickets/${ticketId}` : "";
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const markRead = async () => {
    setMarking(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/read`, { method: "POST" });
      if (res.ok) {
        setMarked(true);
        setTimeout(() => setMarked(false), 1500);
      }
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="text-sm font-semibold text-slate-800 mb-3">Acciones rápidas</div>
      <div className="space-y-2">
        <button
          type="button"
          onClick={copyLink}
          className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition"
        >
          <span className="inline-flex items-center gap-2">
            <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
            </svg>
            Copiar enlace al caso
          </span>
          <span className={`text-xs font-semibold ${copied ? "text-emerald-600" : "text-slate-400"}`}>
            {copied ? "Copiado" : ticketCode}
          </span>
        </button>
        <button
          type="button"
          onClick={markRead}
          disabled={marking}
          className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition disabled:opacity-60"
        >
          <span className="inline-flex items-center gap-2">
            <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.25 12c0 5.385 4.365 9.75 9.75 9.75s9.75-4.365 9.75-9.75S17.385 2.25 12 2.25 2.25 6.615 2.25 12Z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="m8.25 12 2.625 2.625L15.75 9.375" />
            </svg>
            Marcar como leído
          </span>
          <span className={`text-xs font-semibold ${marked ? "text-emerald-600" : "text-slate-400"}`}>
            {marking ? "…" : marked ? "Listo" : "ahora"}
          </span>
        </button>
      </div>
    </div>
  );
}
