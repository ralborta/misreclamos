"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface CaseTypeNav {
  id: string;
  slug: string;
  label: string;
  color: string;
}

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

export function CaseTypesNavLinks({ onNavigate }: { onNavigate?: () => void } = {}) {
  const pathname = usePathname();
  const [casos, setCasos] = useState<CaseTypeNav[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/casos")
      .then((r) => r.json())
      .then((data) => {
        if (data.casos) setCasos(data.casos);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="px-3 py-2 text-xs text-white/50">
        Cargando tipos...
      </div>
    );
  }

  return (
    <>
      {casos.map((c) => {
        const href = `/tickets/tipo/${c.slug}`;
        const active = pathname === href || pathname.startsWith(href + "/");
        const indicator = colorToBgClass[c.color] ?? "bg-slate-400";
        return (
          <Link
            key={c.id}
            href={href}
            onClick={onNavigate}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out ${
              active ? "" : "hover:bg-white/10"
            }`}
            style={active ? { backgroundColor: "#375A7F" } : undefined}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${indicator} flex-shrink-0`} />
            <span className="flex-1 min-w-0 break-words text-white/95 group-hover:text-white">{c.label}</span>
            <span className="flex-shrink-0 text-white/50 text-sm">›</span>
          </Link>
        );
      })}
    </>
  );
}
