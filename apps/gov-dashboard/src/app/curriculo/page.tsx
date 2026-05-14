import { GovAuthenticatedShell } from "../_components/gov-authenticated-shell";
import { PlaceholderPage } from "../_components/placeholder-page";

export const dynamic = "force-dynamic";

export default function CurriculoPage() {
  return (
    <GovAuthenticatedShell>
      <PlaceholderPage
        eyebrow="CURRICULO"
        title="Cobertura curricular"
        description="Mapa de progreso por nivel, materia y region. Deteccion de brechas curriculares."
      />
    </GovAuthenticatedShell>
  );
}
