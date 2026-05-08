"use server";

import { redirect } from "next/navigation";
import { ApiClientError } from "../../lib/api-client";
import { CURRENT_CONSENT_VERSION, signConsent } from "../../lib/consent";

export interface ConsentFormState {
  error?: string;
  ok?: boolean;
}

export async function signConsentAction(
  _prev: ConsentFormState,
  formData: FormData,
): Promise<ConsentFormState> {
  const studentId = readField(formData, "studentId").trim();
  const next = (readField(formData, "next") || "/app").trim();
  const terms = formData.get("termsAccepted") === "on";
  const privacy = formData.get("privacyAccepted") === "on";
  const ai = formData.get("aiProcessingAccepted") === "on";
  const fullName = readField(formData, "fullName").trim();

  if (!studentId) {
    return { error: "Falta el alumno asociado al consentimiento." };
  }
  if (!terms || !privacy || !ai) {
    return {
      error: "Debes aceptar terminos, privacidad y el procesamiento por IA para continuar.",
    };
  }
  if (fullName.length < 3) {
    return { error: "Ingresa tu nombre completo como tutor legal." };
  }

  try {
    await signConsent({
      studentId,
      documentVersion: CURRENT_CONSENT_VERSION,
      termsAccepted: terms,
      privacyAccepted: privacy,
      aiProcessingAccepted: ai,
    });
  } catch (error) {
    if (error instanceof ApiClientError) {
      return { error: error.message };
    }
    return { error: "No pudimos registrar tu consentimiento. Reintenta en unos minutos." };
  }

  redirect(safeNext(next));
}

function safeNext(next: string): string {
  if (!next.startsWith("/") || next.startsWith("//")) {
    return "/app";
  }
  return next;
}

function readField(formData: FormData, key: string): string {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : "";
}
