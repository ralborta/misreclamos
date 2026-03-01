"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ConversationSummaryProps {
  ticketId: string;
  initialSummary?: string | null;
}

export function ConversationSummary({ ticketId, initialSummary }: ConversationSummaryProps) {
  const router = useRouter();
  const [summary, setSummary] = useState(initialSummary || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Actualizar el resumen cuando cambia
    setSummary(initialSummary || null);
  }, [initialSummary]);

  const refreshSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/summary`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data.aiSummary);
        // Refrescar siempre para que se actualicen tipo de caso y todo el ticket
        router.refresh();
      }
    } catch (error) {
      console.error("Error al actualizar resumen:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!summary && !loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-800">Resumen Inteligente</h3>
          <button
            onClick={refreshSummary}
            className="rounded-lg bg-[#2196F3] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1976D2]"
          >
            Generar
          </button>
        </div>
        <p className="text-xs text-slate-500 italic">
          No hay resumen aún. Click en "Generar" para crear uno con IA.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-emerald-500">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
        </span>
        <h3 className="text-sm font-semibold text-slate-800">Resumen Inteligente</h3>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <div className="animate-spin h-4 w-4 border-2 border-[#2196F3] border-t-transparent rounded-full" />
          <span>Generando resumen...</span>
        </div>
      ) : (
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
          {summary}
        </p>
      )}
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Se actualiza automáticamente
        </div>
        <button
          onClick={refreshSummary}
          disabled={loading}
          className="rounded-lg bg-[#2196F3] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1976D2] disabled:opacity-50"
        >
          Regenerar
        </button>
      </div>
    </div>
  );
}
