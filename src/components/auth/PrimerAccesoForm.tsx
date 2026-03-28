"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function PrimerAccesoForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/setup-first-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, name, email, phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "No se pudo crear el administrador");
        return;
      }
      router.replace("/login?nuevo=1");
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="rounded-xl bg-white p-8 shadow-sm border border-[#f7941d]/30">
        <h1 className="text-xl font-semibold text-[#213b5c] mb-1">Primer acceso</h1>
        <p className="text-sm text-[#213b5c]/70 mb-6">
          Creá el usuario administrador. Esta pantalla solo aparece cuando todavía no hay ninguna contraseña
          cargada en el sistema.
        </p>
        <form className="space-y-4" onSubmit={submit}>
          <div>
            <label className="text-sm font-medium text-[#213b5c]">Nombre completo</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#213b5c]/30 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#213b5c]">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#213b5c]/30 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#213b5c]">Teléfono (WhatsApp)</label>
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="549..."
              className="mt-1 w-full rounded-lg border border-[#213b5c]/30 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#213b5c]">Usuario (para iniciar sesión)</label>
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ej: admin"
              autoComplete="username"
              className="mt-1 w-full rounded-lg border border-[#213b5c]/30 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#213b5c]">Contraseña (mín. 8 caracteres)</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-[#213b5c]/30 px-3 py-2.5 text-sm"
            />
          </div>
          {error ? (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#f7941d] py-3 text-sm font-semibold text-white hover:bg-[#e58519] disabled:opacity-60"
          >
            {loading ? "Creando…" : "Crear administrador e ir al login"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          <Link href="/login" className="text-[#2196F3] hover:underline">
            Ya tengo usuario → ir al login
          </Link>
        </p>
      </div>
    </div>
  );
}
