import { GovAuthenticatedShell } from "../_components/gov-authenticated-shell";
import { PlaceholderPage } from "../_components/placeholder-page";

export const dynamic = "force-dynamic";

export default function ConfiguracionPage() {
  return (
    <GovAuthenticatedShell allowedRoles={["SUPER_ADMIN"]}>
      <PlaceholderPage
        eyebrow="ADMIN"
        title="Configuracion"
        description="Gestion de usuarios, roles, permisos y politicas operativas del panel."
      />
    </GovAuthenticatedShell>
  );
}
