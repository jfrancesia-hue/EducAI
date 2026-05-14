import { GovAuthenticatedShell } from "../_components/gov-authenticated-shell";
import { PlaceholderPage } from "../_components/placeholder-page";

export const dynamic = "force-dynamic";

export default function HandoffsPage() {
  return (
    <GovAuthenticatedShell>
      <PlaceholderPage
        eyebrow="OPERACION"
        title="Cola completa de handoffs"
        description="Historico de derivaciones humanas con filtros por origen, fecha y resolucion."
      />
    </GovAuthenticatedShell>
  );
}
