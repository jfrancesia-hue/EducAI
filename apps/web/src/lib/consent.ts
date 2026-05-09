import { apiFetch, ApiClientError } from "./api-client";

/**
 * Version del documento legal vigente. Aumentar cuando cambian terminos,
 * privacidad o el alcance de procesamiento de IA. Una version nueva
 * exige re-firma del padre.
 */
export const CURRENT_CONSENT_VERSION = "v1.0-2026-05-07";

export interface ParentalConsent {
  id: string;
  tenantId: string;
  studentId: string;
  parentUserId: string;
  documentVersion: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  aiProcessingAccepted: boolean;
  signedAt: string;
  ipAddress: string;
  userAgent: string;
  revokedAt: string | null;
}

export async function fetchActiveConsent(studentId: string): Promise<ParentalConsent | null> {
  try {
    const consent = await apiFetch<ParentalConsent | null>(`/consent/student/${studentId}`);
    return consent ?? null;
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 401 || error.status === 404)) {
      return null;
    }
    throw error;
  }
}

export interface SignConsentInput {
  studentId: string;
  documentVersion: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  aiProcessingAccepted: boolean;
}

export async function signConsent(input: SignConsentInput): Promise<ParentalConsent> {
  return apiFetch<ParentalConsent>("/consent", {
    method: "POST",
    body: input,
  });
}

export function isConsentValid(consent: ParentalConsent | null): boolean {
  if (!consent) return false;
  if (consent.revokedAt) return false;
  if (consent.documentVersion !== CURRENT_CONSENT_VERSION) return false;
  return consent.termsAccepted && consent.privacyAccepted && consent.aiProcessingAccepted;
}
