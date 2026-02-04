"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  legadoId: string;
  phone: string | null;
};

export function LegadoActions({ legadoId, phone }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [sendResult, setSendResult] = useState<"ok" | "error" | null>(null);

  const handleBorrar = async () => {
    if (!confirm("¿Borrar este registro de legado? No se puede deshacer.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/legado/${legadoId}`, { method: "DELETE" });
      if (res.ok) router.push("/legado");
      else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "Error al borrar");
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

  return (
    <div className="mt-8 space-y-6 border-t border-slate-100 pt-6">
      {phone && (
        <form onSubmit={handleEnviarMensaje} className="space-y-2">
          <label className="block text-sm font-semibold text-[#213b5c]">
            Enviar mensaje por WhatsApp
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribí el mensaje a enviar..."
            rows={3}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#f7941d] focus:outline-none focus:ring-1 focus:ring-[#f7941d]"
            disabled={sending}
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? "Enviando..." : "Enviar mensaje"}
            </button>
            {sendResult === "ok" && (
              <span className="text-sm font-medium text-emerald-600">Mensaje enviado</span>
            )}
          </div>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleMigrar}
          disabled={migrating || !phone}
          className="inline-flex items-center gap-2 rounded-lg bg-[#f7941d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#e58519] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {migrating ? "Migrando..." : "Migrar como caso nuevo"}
        </button>
        <button
          type="button"
          onClick={handleBorrar}
          disabled={deleting}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {deleting ? "Borrando..." : "Borrar registro"}
        </button>
      </div>

      {!phone && (
        <span className="text-xs text-slate-500">
          Sin teléfono válido: no se puede enviar mensaje ni migrar.
        </span>
      )}
    </div>
  );
}
