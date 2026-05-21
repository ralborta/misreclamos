"use client";

import { useState } from "react";

type Props = {
  value: string;
  label?: string;
  title?: string;
  className?: string;
};

export function CopyButton({ value, label, title = "Copiar", className }: Props) {
  const [copied, setCopied] = useState(false);

  const handle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={handle}
      title={copied ? "Copiado" : title}
      className={
        className ??
        "inline-flex items-center gap-1 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
      }
    >
      {copied ? (
        <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : (
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )}
      {label ? <span className="text-xs">{label}</span> : null}
    </button>
  );
}
