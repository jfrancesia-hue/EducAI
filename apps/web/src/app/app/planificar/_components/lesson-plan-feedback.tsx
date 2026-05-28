"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Star } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-10 items-center rounded-lg bg-[#075f53] px-4 text-sm font-bold text-white transition hover:bg-[#087968] disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? "Guardando..." : "Enviar feedback"}
    </button>
  );
}

export function LessonPlanFeedback({
  initialRating,
  message,
  planId,
}: {
  initialRating?: number | null;
  message?: string;
  planId: string;
}) {
  const [rating, setRating] = useState(initialRating ?? 0);

  return (
    <section className="educai-no-print rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight">
            ¿Qué tan útil fue esta guía?
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#5b6962]">
            Tu valoración nos ayuda a mejorar si realmente ahorra tiempo y deja la clase lista.
          </p>
        </div>
        {message ? (
          <span className="rounded-lg bg-[#e7fbf7] px-3 py-2 text-sm font-bold text-[#087968]">
            {message}
          </span>
        ) : null}
      </div>

      <form action="/app/planificar/feedback" className="mt-4 grid gap-4">
        <input type="hidden" name="planId" value={planId} />
        <input type="hidden" name="rating" value={rating} />

        <div className="flex flex-wrap gap-2" aria-label="Calificación de 1 a 5 estrellas">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#d5e1dc] bg-[#fbfffd] text-[#876100] transition hover:border-[#f8d95c]"
              aria-label={`${value} estrella${value === 1 ? "" : "s"}`}
            >
              <Star
                className="h-6 w-6"
                fill={value <= rating ? "currentColor" : "none"}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-[#33423c]">Comentario opcional</span>
          <textarea
            name="comment"
            rows={3}
            maxLength={1000}
            placeholder="Ej: me sirvió para entrar al aula, pero le agregaría más ejemplos locales..."
            className="w-full rounded-lg border border-[#cbdad4] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#18b6a4] focus:ring-2 focus:ring-[#18b6a4]/20"
          />
        </label>

        <div>
          <SubmitButton />
        </div>
      </form>
    </section>
  );
}
