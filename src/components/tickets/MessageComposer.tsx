"use client";

import { useState, useRef } from "react";
import type { MessageDirection, MessageFrom } from "@/lib/types";
import { BotPausedToggle } from "./BotPausedToggle";

type Props = {
  ticketId: string;
  customerId?: string | null;
  botPaused?: boolean;
};

const MAX_FILE_MB = 16;

export function MessageComposer({ ticketId, customerId, botPaused = false }: Props) {
  const [text, setText] = useState("");
  const [direction, setDirection] = useState<MessageDirection>("OUTBOUND");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasText = text.trim().length > 0;
    if (!hasText && !file) return;
    setLoading(true);
    setError(null);
    try {
      if (file) {
        const formData = new FormData();
        formData.append("text", text.trim());
        formData.append("direction", direction);
        formData.append("from", "HUMAN");
        formData.append("file", file);
        const res = await fetch(`/api/tickets/${ticketId}/messages`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "No se pudo enviar el mensaje");
          setLoading(false);
          return;
        }
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        const res = await fetch(`/api/tickets/${ticketId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: text.trim(),
            direction,
            from: "HUMAN" as MessageFrom,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "No se pudo guardar el mensaje");
          setLoading(false);
          return;
        }
      }
      setText("");
      window.location.reload();
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`El archivo no puede superar ${MAX_FILE_MB} MB`);
      e.target.value = "";
      return;
    }
    setError(null);
    setFile(f);
  };

  const canSend = text.trim().length > 0 || file;

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <input
          ref={fileInputRef}
          type="file"
          id="ticket-attach"
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mp3,.wav,.ogg"
          onChange={onFileChange}
          disabled={loading}
        />
        <label
          htmlFor="ticket-attach"
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          title="Adjuntar archivo (documento, imagen, audio, vídeo)"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
          </svg>
        </label>
        <textarea
          className="min-h-[40px] flex-1 resize-none rounded-lg border-0 bg-transparent px-2 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
          rows={1}
          placeholder="Escribe una nota interna o mensaje..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading || !canSend}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#2196F3] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1976D2] disabled:opacity-60"
        >
          {loading ? "..." : "Enviar"}
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>
      {file && (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
          <span className="text-slate-600 truncate flex-1" title={file.name}>
            📎 {file.name}
          </span>
          <button
            type="button"
            onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
            className="shrink-0 rounded px-2 py-1 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
          >
            Quitar
          </button>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <select
          value={direction}
          onChange={(e) => setDirection(e.target.value as MessageDirection)}
          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 focus:border-[#2196F3] focus:outline-none"
        >
          <option value="OUTBOUND">Respuesta al cliente</option>
          <option value="INTERNAL_NOTE">Nota interna</option>
        </select>
        {customerId ? (
          <BotPausedToggle customerId={customerId} initialPaused={botPaused} />
        ) : null}
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </form>
  );
}
