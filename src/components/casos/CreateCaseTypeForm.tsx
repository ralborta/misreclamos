"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const COLOR_OPTIONS = [
  { value: "amber-500", label: "Ámbar" },
  { value: "blue-500", label: "Azul" },
  { value: "orange-500", label: "Naranja" },
  { value: "violet-500", label: "Violeta" },
  { value: "emerald-500", label: "Esmeralda" },
  { value: "slate-500", label: "Gris" },
  { value: "slate-400", label: "Gris claro" },
  { value: "red-500", label: "Rojo" },
  { value: "teal-500", label: "Teal" },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CreateCaseTypeForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    slug: "",
    label: "",
    legalType: "",
    color: "slate-500",
    order: 0,
  });

  const handleLabelChange = (label: string) => {
    setFormData((prev) => ({
      ...prev,
      label,
      legalType: prev.legalType || label,
      slug: prev.slug || slugify(label),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.slug.trim() || !formData.label.trim() || !formData.legalType.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/casos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al crear tipo de caso");
        return;
      }

      setFormData({ slug: "", label: "", legalType: "", color: "slate-500", order: 0 });
      router.refresh();
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Alta de tipo de caso</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nombre (etiqueta)</label>
          <input
            type="text"
            value={formData.label}
            onChange={(e) => handleLabelChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none"
            placeholder="Ej: Accidente de tránsito"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Slug (URL)</label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none"
            placeholder="accidente-transito"
            required
          />
          <p className="mt-1 text-xs text-slate-500">Solo minúsculas, números y guiones</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Valor en ticket (legalType)</label>
          <input
            type="text"
            value={formData.legalType}
            onChange={(e) => setFormData({ ...formData, legalType: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none"
            placeholder="Debe coincidir con el valor del ticket"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Color</label>
          <select
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none"
          >
            {COLOR_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Orden</label>
          <input
            type="number"
            min={0}
            value={formData.order}
            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value, 10) || 0 })}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Creando..." : "Dar de alta"}
        </button>
      </form>
    </div>
  );
}
