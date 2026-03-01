"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Agent {
  id: string;
  name: string;
  email: string;
}

interface AssignAgentDropdownProps {
  ticketId: string;
  currentAgentId: string | null;
  agentes: Agent[];
  variant?: "header";
}

export function AssignAgentDropdown({ ticketId, currentAgentId, agentes, variant }: AssignAgentDropdownProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState(currentAgentId || "");
  const [open, setOpen] = useState(false);

  const handleChange = async (newAgentId: string) => {
    setSelectedAgentId(newAgentId);
    setLoading(true);
    setOpen(false);

    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedToUserId: newAgentId || null,
        }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert("Error al asignar agente");
        setSelectedAgentId(currentAgentId || "");
      }
    } catch (error) {
      alert("Error de red");
      setSelectedAgentId(currentAgentId || "");
    } finally {
      setLoading(false);
    }
  };

  if (variant === "header") {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998-3.5 3.75 3.75 0 00-3.5-3.5 7.5 7.5 0 00-3.5 3.5 7.5 7.5 0 0014.998 3.5z" />
          </svg>
          Asignar
          <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              <button
                type="button"
                onClick={() => handleChange("")}
                className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                Sin asignar
              </button>
              {agentes.map((agente) => (
                <button
                  key={agente.id}
                  type="button"
                  onClick={() => handleChange(agente.id)}
                  className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  {agente.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        👤 Asignado a:
      </label>
      <select
        value={selectedAgentId}
        onChange={(e) => handleChange(e.target.value)}
        disabled={loading}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none disabled:opacity-50"
      >
        <option value="">Sin asignar</option>
        {agentes.map((agente) => (
          <option key={agente.id} value={agente.id}>
            {agente.name} ({agente.email})
          </option>
        ))}
      </select>
      {loading && (
        <div className="mt-2 text-xs text-indigo-600">
          Actualizando...
        </div>
      )}
    </div>
  );
}
