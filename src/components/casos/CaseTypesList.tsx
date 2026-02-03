"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface CaseTypeItem {
  id: string;
  slug: string;
  label: string;
  legalType: string;
  color: string;
  order: number;
}

const COLOR_OPTIONS = [
  "amber-500", "blue-500", "orange-500", "violet-500", "emerald-500",
  "slate-500", "slate-400", "red-500", "teal-500",
];

const colorToBgClass: Record<string, string> = {
  "amber-500": "bg-amber-500",
  "blue-500": "bg-blue-500",
  "orange-500": "bg-orange-500",
  "violet-500": "bg-violet-500",
  "emerald-500": "bg-emerald-500",
  "slate-500": "bg-slate-500",
  "slate-400": "bg-slate-400",
  "red-500": "bg-red-500",
  "teal-500": "bg-teal-500",
};

export function CaseTypesList({ casos }: { casos: CaseTypeItem[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CaseTypeItem | null>(null);

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`¿Eliminar el tipo de caso "${label}"?`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/casos/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Error al eliminar");
        return;
      }
      router.refresh();
    } catch {
      alert("Error de red");
    } finally {
      setDeleting(null);
    }
  };

  const startEdit = (c: CaseTypeItem) => {
    setEditingId(c.id);
    setEditForm({ ...c });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editForm) return;
    try {
      const res = await fetch(`/api/casos/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: editForm.slug,
          label: editForm.label,
          legalType: editForm.legalType,
          color: editForm.color,
          order: editForm.order,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Error al guardar");
        return;
      }
      cancelEdit();
      router.refresh();
    } catch {
      alert("Error de red");
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">Tipos de caso</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {casos.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            No hay tipos de caso. Creá uno desde el formulario.
          </div>
        ) : (
          casos.map((c) => (
            <div key={c.id} className="px-4 py-4 hover:bg-slate-50">
              {editingId === c.id && editForm ? (
                <form onSubmit={handleEditSubmit} className="space-y-3">
                  <input
                    type="text"
                    value={editForm.label}
                    onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    placeholder="Etiqueta"
                    required
                  />
                  <input
                    type="text"
                    value={editForm.slug}
                    onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    placeholder="slug"
                    required
                  />
                  <input
                    type="text"
                    value={editForm.legalType}
                    onChange={(e) => setEditForm({ ...editForm, legalType: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    placeholder="legalType"
                    required
                  />
                  <select
                    value={editForm.color}
                    onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  >
                    {COLOR_OPTIONS.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={0}
                    value={editForm.order}
                    onChange={(e) => setEditForm({ ...editForm, order: parseInt(e.target.value, 10) || 0 })}
                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2 w-2 flex-shrink-0 rounded-full ${colorToBgClass[c.color] ?? "bg-slate-400"}`}
                      title={c.color}
                    />
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-slate-900">{c.label}</span>
                      <div className="text-xs text-slate-500">
                        /tickets/tipo/{c.slug} · legalType: {c.legalType}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(c)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id, c.label)}
                      disabled={deleting === c.id}
                      className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deleting === c.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
