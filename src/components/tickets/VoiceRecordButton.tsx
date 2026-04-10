"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MAX_MS = 60_000;

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}

function formatMs(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

type Props = {
  disabled?: boolean;
  /** Nota lista para enviar (mismo flujo que adjunto) */
  onVoiceReady: (file: File) => void;
  /** Quitar preview sin enviar */
  onVoiceClear: () => void;
  voiceFile: File | null;
};

export function VoiceRecordButton({ disabled, onVoiceReady, onVoiceClear, voiceFile }: Props) {
  const [recording, setRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTsRef = useRef(0);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") {
      rec.stop();
    }
    setRecording(false);
    setElapsedMs(0);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      cleanupStream();
    };
  }, [cleanupStream]);

  const startRecording = async () => {
    setMicError(null);
    if (typeof MediaRecorder === "undefined") {
      setMicError("Grabación no disponible en este navegador.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicError("Tu navegador no permite grabar audio.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mime = pickMimeType();
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorderRef.current = rec;

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      rec.onstop = () => {
        cleanupStream();
        const blobType = rec.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: blobType });
        if (blob.size === 0) {
          setMicError("No se grabó audio. Probá de nuevo.");
          return;
        }
        const ext = blobType.includes("mp4") ? "m4a" : blobType.includes("webm") ? "webm" : "webm";
        const file = new File([blob], `nota-de-voz.${ext}`, { type: blobType });
        onVoiceReady(file);
      };

      rec.start(200);
      setRecording(true);
      startTsRef.current = Date.now();
      setElapsedMs(0);
      timerRef.current = setInterval(() => {
        const e = Date.now() - startTsRef.current;
        setElapsedMs(e);
        if (e >= MAX_MS) {
          stopRecording();
        }
      }, 150);
    } catch {
      setMicError("No se pudo acceder al micrófono.");
    }
  };

  const busy = disabled || !!voiceFile;

  if (voiceFile) {
    return (
      <div className="flex items-center gap-1">
        <span
          className="flex h-9 max-w-[140px] items-center gap-1 truncate rounded-lg bg-emerald-50 px-2 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200/80"
          title={voiceFile.name}
        >
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
          Nota de voz
        </span>
        <button
          type="button"
          onClick={onVoiceClear}
          className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          Quitar
        </button>
      </div>
    );
  }

  if (recording) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" />
          {formatMs(elapsedMs)} / 1:00
        </span>
        <button
          type="button"
          onClick={stopRecording}
          className="rounded-lg bg-slate-800 px-2 py-1 text-xs font-medium text-white hover:bg-slate-700"
        >
          Parar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-0.5">
      <button
        type="button"
        onClick={startRecording}
        disabled={busy}
        title="Grabar nota de voz (máx. 1 min)"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
      </button>
      {micError ? <span className="max-w-[200px] text-[10px] text-red-600">{micError}</span> : null}
    </div>
  );
}
