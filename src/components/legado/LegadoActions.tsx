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

  const whatsappUrl = phone
    ? `https://wa.me/${phone.startsWith("54") ? phone : `54${phone}`}`
    : null;

  return (
    <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-6">
      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          Abrir en WhatsApp
        </a>
      )}
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
      {!phone && (
        <span className="text-xs text-slate-500">
          Sin teléfono válido: no se puede migrar ni abrir WhatsApp.
        </span>
      )}
    </div>
  );
}
