import { GovAuthenticatedShell } from "../_components/gov-authenticated-shell";
import { PlaceholderPage } from "../_components/placeholder-page";

export const dynamic = "force-dynamic";

export default function DatosPage() {
  return (
    <GovAuthenticatedShell>
      <PlaceholderPage
        eyebrow="DATOS"
        title="Datos abiertos"
        description="Catalogo publico de datasets educativos descargables."
      />
    </GovAuthenticatedShell>
  );
}
