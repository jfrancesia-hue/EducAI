import { GovAuthenticatedShell } from "../_components/gov-authenticated-shell";
import { PlaceholderPage } from "../_components/placeholder-page";

export const dynamic = "force-dynamic";

export default function ColegiosPage() {
  return (
    <GovAuthenticatedShell>
      <PlaceholderPage
        eyebrow="RED"
        title="Red de colegios"
        description="Inventario de instituciones educativas conectadas, con su estado de adopcion y metricas basicas."
      />
    </GovAuthenticatedShell>
  );
}
