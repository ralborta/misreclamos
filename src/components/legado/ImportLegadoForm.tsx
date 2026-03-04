"use client";

import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function ImportLegadoForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    inserted: number;
    total: number;
    errors: string[];
    message: string;
  } | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      setError("El archivo debe ser Excel (.xlsx o .xls)");
      setTimeout(() => setError(null), 5000);
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/legado/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al importar archivo");
      }

      setResult({
        inserted: data.inserted,
        total: data.total,
        errors: data.errors || [],
        message: data.message,
      });
      router.refresh();
      e.target.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al importar archivo");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <FileSpreadsheet className="w-5 h-5 text-amber-700" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Subir Excel de legado</h3>
      </div>

      <p className="text-sm text-slate-600 mb-4">
        Sube un archivo Excel (.xlsx o .xls). Cada fila de la primera hoja se importa como un registro de legado (se guardan todas las columnas).
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className="mb-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold text-emerald-900">Importación completada</span>
          </div>
          <div className="text-sm text-emerald-700 space-y-1">
            <div>✅ {result.inserted} de {result.total} registros importados</div>
            {result.errors.length > 0 && (
              <div className="mt-2 pt-2 border-t border-emerald-200">
                <div className="font-semibold">⚠️ {result.errors.length} error(es):</div>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {result.errors.slice(0, 5).map((err, idx) => (
                    <li key={idx} className="text-xs">{err}</li>
                  ))}
                  {result.errors.length > 5 && (
                    <li className="text-xs">... y {result.errors.length - 5} más</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        id="legado-excel-upload"
        onChange={handleFileSelect}
        className="hidden"
        accept=".xlsx,.xls"
        disabled={isUploading}
      />
      <label
        htmlFor="legado-excel-upload"
        className={`group flex items-center justify-center gap-3 w-full border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all ${
          isUploading
            ? "border-slate-300 bg-slate-50 cursor-not-allowed"
            : "border-amber-300 bg-amber-50 hover:border-amber-500 hover:bg-amber-100"
        }`}
      >
        {isUploading ? (
          <>
            <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
            <span className="text-slate-700 font-semibold">Procesando archivo...</span>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div className="text-center">
              <span className="text-slate-700 font-semibold block">Subir archivo Excel</span>
              <span className="text-xs text-slate-500 mt-1">XLSX o XLS (máx. 10MB)</span>
            </div>
          </>
        )}
      </label>
    </div>
  );
}
