"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type CaseTypeOption = { id: string; label: string; legalType: string };

type Props = {
  ticketId: string;
  currentLegalType: string | null;
};

export function LegalTypeDropdown({ ticketId, currentLegalType }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(currentLegalType ?? "");
  const [loading, setLoading] = useState(false);
  const [classifyLoading, setClassifyLoading] = useState(false);
  const [options, setOptions] = useState<CaseTypeOption[]>([]);

  useEffect(() => {
    setValue(currentLegalType ?? "");
  }, [currentLegalType]);

  useEffect(() => {
    fetch("/api/casos")
      .then((r) => r.json())
      .then((data) => (data.casos ? setOptions(data.casos) : []))
      .catch(() => {});
  }, []);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value || null;
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ legalType: newValue }),
      });
      if (res.ok) {
        setValue(newValue ?? "");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClassifyWithAI = async () => {
    setClassifyLoading(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/classify-type`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.legalType) {
        setValue(data.legalType);
        router.refresh();
      } else if (!res.ok) {
        console.error(data.error || "Error al clasificar");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setClassifyLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Tipo de caso
      </label>
      <div className="flex gap-2">
        <select
          value={value}
          onChange={handleChange}
          disabled={loading}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
        >
          <option value="">Sin asignar</option>
          {options.map((t) => (
            <option key={t.id} value={t.legalType}>
              {t.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleClassifyWithAI}
          disabled={classifyLoading}
          className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
          title="Clasificar según la conversación con IA"
        >
          {classifyLoading ? "..." : "IA"}
        </button>
      </div>
    </div>
  );
}
