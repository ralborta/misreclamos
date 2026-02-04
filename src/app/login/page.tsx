"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Credenciales inválidas");
      } else {
        router.replace("/tickets");
      }
    } catch {
      setError("Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f8fd] px-4">
      <div className="w-full max-w-md">
        {/* Logo: public/Logo-MisReclamos.png */}
        <div className="text-center mb-10">
          <img
            src="/Logo-MisReclamos.png"
            alt="MisReclamos"
            className="h-14 w-auto mx-auto object-contain mb-4 logo-img"
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              (e.target as HTMLImageElement).style.display = "none";
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
            }}
          />
          <div className="hidden logo-fallback">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-lg bg-[#213b5c] text-[#f7941d] text-3xl font-bold mb-4 shadow-sm">
              ⚖
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[#213b5c] mb-2 tracking-tight">MisReclamos</h1>
          <p className="text-[#213b5c]/70 text-sm">Tus derechos, tu abogado</p>
        </div>

        {/* Login Card */}
        <div className="rounded-xl bg-white p-8 shadow-sm border border-[#f7941d]/30">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#213b5c] mb-1">Acceso interno</h2>
            <p className="text-sm text-[#213b5c]/70">Ingresa tus credenciales para continuar</p>
          </div>
          
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#213b5c]" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                className="w-full rounded-lg border border-[#213b5c]/30 bg-white px-4 py-3 text-[#213b5c] focus:border-[#f7941d] focus:ring-1 focus:ring-[#f7941d] focus:outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Dejar vacío si APP_PASSWORD no está configurado"
              />
            </div>
            {error ? (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-lg bg-[#f7941d] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#e58519] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center mt-8 text-xs text-[#213b5c]/60">
          Sistema de gestión de reclamos y casos legales
        </p>
      </div>
    </div>
  );
}
