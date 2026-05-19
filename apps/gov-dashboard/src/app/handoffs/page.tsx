import { revalidatePath } from "next/cache";

import { GovShell } from "../_components/gov-shell";
import { HandoffList, type HandoffRecord } from "../_components/handoff-list";
import { PageHeader } from "../_components/page-header";
import { getApiBaseUrl } from "../../lib/api";
import { requireGovSession } from "../../lib/auth/require-gov-session";

export const dynamic = "force-dynamic";

async function fetchOpenHandoffs(accessToken: string): Promise<HandoffRecord[]> {
  const response = await fetch(`${getApiBaseUrl()}/handoffs`, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`No se pudo cargar la cola de handoffs (${response.status})`);
  }

  const payload = (await response.json()) as { data?: HandoffRecord[] };
  return payload.data ?? [];
}

export default async function HandoffsPage() {
  const { session, tenantName, userRole } = await requireGovSession();

  async function closeHandoff(formData: FormData) {
    "use server";

    const handoffId = formData.get("handoffId");
    const resolutionNote = formData.get("resolutionNote");

    if (typeof handoffId !== "string" || !handoffId.trim()) {
      return;
    }

    const current = await requireGovSession();
    const response = await fetch(`${getApiBaseUrl()}/handoffs/${handoffId}/close`, {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${current.session.access_token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        resolutionNote: typeof resolutionNote === "string" ? resolutionNote.trim() : undefined,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`No se pudo cerrar el handoff (${response.status})`);
    }

    revalidatePath("/handoffs");
    revalidatePath("/");
  }

  let handoffs: HandoffRecord[] = [];
  let loadError: string | null = null;

  try {
    handoffs = await fetchOpenHandoffs(session.access_token);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "No se pudo cargar la cola.";
  }

  return (
    <GovShell userEmail={session.user.email ?? ""} userRole={userRole} tenantName={tenantName}>
      <PageHeader
        eyebrow="OPERACION"
        title="Cola completa de handoffs"
        subtitle="Derivaciones humanas abiertas, con detalle de contexto y cierre operativo desde el panel."
      />
      <HandoffList handoffs={handoffs} onClose={closeHandoff} loadError={loadError} />
    </GovShell>
  );
}
