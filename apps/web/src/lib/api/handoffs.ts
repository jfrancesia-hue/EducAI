export type CrisisHandoff = {
  id: string;
  conversationId: string | null;
  createdAt: string;
  status: string;
  source: string | null;
  reason: string | null;
  studentId: string | null;
  whatsappPhone: string | null;
  inboundMessage: string | null;
  outboundMessage: string | null;
  requestedAt: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolutionNote: string | null;
  crisisSeverity: string | null;
  safetySignals: string[] | null;
  crisisAlertDelivered: boolean | null;
};

/**
 * Trae los handoffs/crisis del tenant del usuario. Con `includeResolved` incluye el
 * historial de resueltos. Devuelve [] ante cualquier error (la pantalla degrada sola).
 */
export async function fetchHandoffs(
  accessToken: string,
  includeResolved = false,
): Promise<CrisisHandoff[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return [];
  }

  const query = includeResolved ? "?estado=todos" : "";
  const response = await fetch(`${apiUrl.replace(/\/$/u, "")}/handoffs${query}`, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as { data?: CrisisHandoff[] };
  return payload.data ?? [];
}

/** Marca un handoff/crisis como resuelto. Devuelve true si el backend lo aceptó. */
export async function closeHandoff(
  accessToken: string,
  id: string,
  resolutionNote?: string,
): Promise<boolean> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return false;
  }

  const response = await fetch(`${apiUrl.replace(/\/$/u, "")}/handoffs/${id}/close`, {
    method: "PATCH",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ resolutionNote: resolutionNote?.trim() || undefined }),
    cache: "no-store",
  });

  return response.ok;
}
