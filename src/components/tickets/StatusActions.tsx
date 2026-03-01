"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import type { TicketStatus } from "@/lib/types";

export function StatusActions({
  ticketId,
  currentStatus,
  variant,
}: {
  ticketId: string;
  currentStatus: TicketStatus;
  variant?: "header";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const updateStatus = (status: TicketStatus) => {
    setOpen(false);
    startTransition(async () => {
      await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    });
  };

  if (variant === "header") {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Cambiar estado
          <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              {(["WAITING_CUSTOMER", "RESOLVED", "CLOSED"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={isPending || currentStatus === status}
                  onClick={() => updateStatus(status)}
                  className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {status === "WAITING_CUSTOMER" && "Esperando Cliente"}
                  {status === "RESOLVED" && "Marcar como Resuelto"}
                  {status === "CLOSED" && "Cerrar"}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={isPending || currentStatus === "WAITING_CUSTOMER"}
        onClick={() => updateStatus("WAITING_CUSTOMER")}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
      >
        Esperando Cliente
      </button>
      <button
        type="button"
        disabled={isPending || currentStatus === "RESOLVED"}
        onClick={() => updateStatus("RESOLVED")}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
      >
        Marcar como Resuelto
      </button>
      <button
        type="button"
        disabled={isPending || currentStatus === "CLOSED"}
        onClick={() => updateStatus("CLOSED")}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
      >
        Cerrar
      </button>
    </div>
  );
}
