import { GovAuthenticatedShell } from "../_components/gov-authenticated-shell";
import { PlaceholderPage } from "../_components/placeholder-page";

export const dynamic = "force-dynamic";

export default function IndicadoresPage() {
  return (
    <GovAuthenticatedShell>
      <PlaceholderPage
        eyebrow="INDICADORES"
        title="Indicadores ministeriales"
        description="Cobertura curricular, desercion temprana, formacion docente y datos abiertos del sistema educativo provincial."
      />
    </GovAuthenticatedShell>
  );
}
