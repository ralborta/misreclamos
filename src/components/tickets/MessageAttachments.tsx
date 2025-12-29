"use client";

import { useState } from "react";

interface Attachment {
  url: string;
  type: string;
  name: string;
}

export function MessageAttachments({ attachments }: { attachments: Attachment[] }) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <>
      <div className="mt-2 flex flex-wrap gap-2">
        {attachments.map((att, idx) => (
          <div key={idx}>
            {att.type === "image" ? (
              <button
                onClick={() => setLightboxUrl(att.url)}
                className="group relative overflow-hidden rounded-lg border border-slate-200 hover:border-indigo-400 transition-all"
              >
                <img
                  src={att.url}
                  alt={att.name}
                  className="h-32 w-32 object-cover transition group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition text-sm font-semibold">
                    🔍 Ver
                  </span>
                </div>
              </button>
            ) : att.type === "video" ? (
              <video
                src={att.url}
                controls
                className="h-32 rounded-lg border border-slate-200"
              />
            ) : att.type === "audio" ? (
              <audio src={att.url} controls className="rounded-lg" />
            ) : (
              <a
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 hover:bg-slate-100 transition"
              >
                <span className="text-2xl">📎</span>
                <div className="text-left">
                  <div className="text-sm font-medium text-slate-900">{att.name}</div>
                  <div className="text-xs text-slate-500">{att.type}</div>
                </div>
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-4xl hover:text-slate-300 transition"
            onClick={() => setLightboxUrl(null)}
          >
            ×
          </button>
          <img
            src={lightboxUrl}
            alt="Vista completa"
            className="max-h-full max-w-full rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
