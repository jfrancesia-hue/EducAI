"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@educai/ui";
import { signConsentAction, type ConsentFormState } from "./actions";

interface ConsentFormProps {
  studentId: string;
  studentName?: string;
  next: string;
}

const initialState: ConsentFormState = {};

export function ConsentForm({ studentId, studentName, next }: ConsentFormProps) {
  const [state, formAction] = useFormState(signConsentAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="next" value={next} />

      <div className="rounded-lg border border-[#ded6c7] bg-[#fbfaf5] p-4 text-sm leading-6 text-[#5f5647]">
        <p className="flex items-center gap-2 font-semibold text-[#11231f]">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Consentimiento parental verificable
        </p>
        <p className="mt-2">
          Como tutor legal de{" "}
          <strong className="text-[#11231f]">{studentName ?? "tu hijo/a"}</strong>, vas a autorizar
          a EducAI a procesar sus datos para fines pedagogicos. Podes retirar este consentimiento en
          cualquier momento desde tu panel.
        </p>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-[#5f5647]">Tu nombre completo como tutor</span>
        <input
          required
          minLength={3}
          name="fullName"
          autoComplete="name"
          className="mt-2 block h-12 w-full rounded-lg border border-[#ded6c7] bg-white px-3 text-[#14120f] outline-none focus:border-[#18b6a4]"
          placeholder="Maria Garcia"
        />
      </label>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-[#11231f]">Aceptaciones requeridas</legend>

        <label className="flex gap-3 rounded-lg border border-[#ded6c7] bg-white p-3 text-sm leading-6 text-[#5f5647]">
          <input
            required
            className="mt-1 h-4 w-4 rounded border-[#ded6c7] accent-[#18b6a4]"
            name="termsAccepted"
            type="checkbox"
          />
          <span>
            Acepto los{" "}
            <Link className="font-semibold text-[#087968] underline" href="/terminos">
              terminos y condiciones
            </Link>
            .
          </span>
        </label>

        <label className="flex gap-3 rounded-lg border border-[#ded6c7] bg-white p-3 text-sm leading-6 text-[#5f5647]">
          <input
            required
            className="mt-1 h-4 w-4 rounded border-[#ded6c7] accent-[#18b6a4]"
            name="privacyAccepted"
            type="checkbox"
          />
          <span>
            Acepto la{" "}
            <Link className="font-semibold text-[#087968] underline" href="/privacidad">
              politica de privacidad
            </Link>{" "}
            y el tratamiento de datos del menor segun Ley 26.061.
          </span>
        </label>

        <label className="flex gap-3 rounded-lg border border-[#ded6c7] bg-white p-3 text-sm leading-6 text-[#5f5647]">
          <input
            required
            className="mt-1 h-4 w-4 rounded border-[#ded6c7] accent-[#18b6a4]"
            name="aiProcessingAccepted"
            type="checkbox"
          />
          <span>
            Autorizo que EducAI procese los mensajes y respuestas del alumno con modelos de IA
            (Claude) para fines pedagogicos, sin entrenar modelos publicos con sus datos.
          </span>
        </label>
      </fieldset>

      {state.error ? (
        <div
          role="alert"
          className="rounded-lg border border-[#ef5da8]/35 bg-[#fdeaf4] p-3 text-sm font-medium text-[#b82170]"
        >
          {state.error}
        </div>
      ) : null}

      <SubmitButton />

      <p className="text-xs text-[#7b725f]">
        Al enviar, registramos la fecha, IP y agente del dispositivo para auditoria legal. Podes
        revocar este consentimiento en cualquier momento.
      </p>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      className="w-full bg-[#ff7a1a] text-white shadow-[0_14px_30px_rgba(255,122,26,0.28)] hover:bg-[#ea6508]"
    >
      {pending ? "Registrando consentimiento..." : "Firmar y continuar"}
      <ArrowRight className="h-5 w-5" aria-hidden="true" />
    </Button>
  );
}
