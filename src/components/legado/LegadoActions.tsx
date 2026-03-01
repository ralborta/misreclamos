"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  legadoId: string;
  phone: string | null;
  contactName?: string;
};

export function LegadoActions({ legadoId, phone, contactName }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [sendResult, setSendResult] = useState<"ok" | "error" | null>(null);

  const handleBorrar = async () => {
    if (!confirm("¿Eliminar este registro de legado? No se puede deshacer.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/legado/${legadoId}`, { method: "DELETE" });
      if (res.ok) router.push("/legado");
      else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "Error al eliminar");
      }
    } catch {
      alert("Error de red");
    } finally {
      setDeleting(false);
    }
  };

  const handleMigrar = async () => {
    setMigrating(true);
    try {
      const res = await fetch(`/api/legado/${legadoId}/migrate`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ticketId) {
        router.push(`/tickets/${data.ticketId}`);
        return;
      }
      alert(data.error || "Error al migrar");
    } catch {
      alert("Error de red");
    } finally {
      setMigrating(false);
    }
  };

  const handleEnviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !message.trim()) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/legado/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: phone, message: message.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.sent) {
        setSendResult("ok");
        setMessage("");
      } else {
        setSendResult("error");
        alert(data.error || "No se pudo enviar el mensaje");
      }
    } catch {
      setSendResult("error");
      alert("Error de red");
    } finally {
      setSending(false);
    }
  };

  const sendLabel = contactName
    ? `Enviar mensaje al ${contactName}`
    : "Enviar mensaje";

  return (
    <div className="space-y-5 border-t border-slate-100 pt-5">
      {phone && (
        <form onSubmit={handleEnviarMensaje} className="space-y-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribí el mensaje a enviar..."
            rows={2}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            disabled={sending}
          />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3 21l18-9L3 0l18 9-15 9z" />
              </svg>
              {sending ? "Enviando..." : sendLabel}
            </button>
            <div className="text-xs text-slate-500 space-y-0.5">
              <p>Último mensaje enviado: —</p>
              <p>Última respuesta: —</p>
            </div>
          </div>
          {sendResult === "ok" && (
            <span className="text-sm font-medium text-emerald-600">Mensaje enviado</span>
          )}
        </form>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleMigrar}
          disabled={migrating || !phone}
          className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {migrating ? "Migrando..." : "Migrar como caso activo"}
        </button>
        <button
          type="button"
          onClick={handleBorrar}
          disabled={deleting}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
        >
          {deleting ? "Eliminando..." : "Eliminar registro"}
        </button>
      </div>

      {!phone && (
        <p className="text-xs text-slate-500">
          Sin teléfono válido: no se puede enviar mensaje ni migrar.
        </p>
      )}
    </div>
  );
}
