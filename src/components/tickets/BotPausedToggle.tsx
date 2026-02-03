"use client";

import { useState } from "react";

type Props = {
  customerId: string;
  initialPaused: boolean;
};

export function BotPausedToggle({ customerId, initialPaused }: Props) {
  const [paused, setPaused] = useState(initialPaused);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clientes/${customerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botPaused: !paused }),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      setPaused(!paused);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-600">
        Agente: {paused ? (
          <span className="font-medium text-amber-600">⏸️ Pausado (respondés manual)</span>
        ) : (
          <span className="text-slate-500">Activo</span>
        )}
      </span>
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
      >
        {loading ? "..." : paused ? "Reactivar agente" : "Pausar agente"}
      </button>
    </div>
  );
}
