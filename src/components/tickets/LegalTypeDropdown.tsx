"use client";

import { useState } from "react";
import { ticketTypeConfig } from "@/lib/tickets";

type Props = {
  ticketId: string;
  currentLegalType: string | null;
};

export function LegalTypeDropdown({ ticketId, currentLegalType }: Props) {
  const [value, setValue] = useState(currentLegalType ?? "");
  const [loading, setLoading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value || null;
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ legalType: newValue }),
      });
      if (res.ok) setValue(newValue ?? "");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Tipo de caso
      </label>
      <select
        value={value}
        onChange={handleChange}
        disabled={loading}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
      >
        <option value="">Sin asignar</option>
        {ticketTypeConfig.map((t) => (
          <option key={t.slug} value={t.legalType}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}
