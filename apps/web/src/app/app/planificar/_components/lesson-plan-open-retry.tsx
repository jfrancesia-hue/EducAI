"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

const MAX_OPEN_ATTEMPTS = 6;

export function LessonPlanOpenRetry({ planId }: { planId: string }) {
  const [attempts, setAttempts] = useState(0);
  const exhausted = attempts >= MAX_OPEN_ATTEMPTS;

  useEffect(() => {
    const storageKey = `educai-open-guide-attempts:${planId}`;
    const storedAttempts = Number.parseInt(window.sessionStorage.getItem(storageKey) ?? "0", 10);
    const currentAttempts = Number.isFinite(storedAttempts) ? storedAttempts : 0;
    setAttempts(currentAttempts);

    if (currentAttempts >= MAX_OPEN_ATTEMPTS) {
      return;
    }

    const timer = window.setTimeout(() => {
      window.sessionStorage.setItem(storageKey, String(currentAttempts + 1));
      window.location.reload();
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [planId]);

  function retryNow() {
    window.sessionStorage.removeItem(`educai-open-guide-attempts:${planId}`);
    window.location.reload();
  }

  return (
    <div className="rounded-lg border border-[#18b6a4]/35 bg-white p-5 shadow-whisper">
      <div className="flex gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#e7fbf7] text-[#087968]">
          {exhausted ? (
            <RefreshCw className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          )}
        </span>
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">
            {exhausted ? "No pudimos abrirla automáticamente" : "Estamos abriendo la guía"}
          </h2>
          <p className="mt-2 text-[15px] leading-6 text-[#4f5f58]">
            {exhausted
              ? "La clase está guardada, pero la vista final no respondió después de varios intentos. Reintentá ahora o volvé más tarde desde Últimas clases."
              : "La clase ya fue guardada. Estamos sincronizando la vista final para mostrarla en formato A4."}
          </p>
          <p className="mt-2 text-sm font-semibold text-[#5b6962]">ID: {planId}</p>
          <button
            type="button"
            onClick={retryNow}
            className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#cbdad4] bg-white px-4 text-sm font-bold text-[#33423c] transition hover:border-[#18b6a4]"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reintentar ahora
          </button>
        </div>
      </div>
    </div>
  );
}
