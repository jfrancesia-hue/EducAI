import { GovAuthenticatedShell } from "../_components/gov-authenticated-shell";
import { PlaceholderPage } from "../_components/placeholder-page";

export const dynamic = "force-dynamic";

export default function AuditoriaPage() {
  return (
    <GovAuthenticatedShell>
      <PlaceholderPage
        eyebrow="AUDITORIA"
        title="Registro de auditoria"
        description="Log completo de eventos del sistema con trazabilidad por usuario, rol y tenant."
      />
    </GovAuthenticatedShell>
  );
}
