"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const POLL_INTERVAL_MS = 12 * 1000; // 12 segundos

/**
 * Refresca los datos del ticket (mensajes, estado) cada cierto tiempo
 * para que los mensajes nuevos aparezcan sin recargar la página.
 * Solo hace refresh cuando la pestaña está visible.
 */
export function TicketLiveRefresh() {
  const router = useRouter();

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const refreshIfVisible = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        router.refresh();
      }
    };

    intervalId = setInterval(refreshIfVisible, POLL_INTERVAL_MS);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [router]);

  return null;
}
