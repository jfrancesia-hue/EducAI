import { GovAuthenticatedShell } from "../_components/gov-authenticated-shell";
import { PlaceholderPage } from "../_components/placeholder-page";

export const dynamic = "force-dynamic";

export default function ReportesPage() {
  return (
    <GovAuthenticatedShell>
      <PlaceholderPage
        eyebrow="REPORTES"
        title="Reportes y exportaciones"
        description="Informes oficiales en PDF, CSV y JSON. Generados a pedido o programados."
      />
    </GovAuthenticatedShell>
  );
}
