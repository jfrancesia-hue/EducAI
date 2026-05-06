import { LockKeyhole } from "lucide-react";

import { SimplePage } from "../_components/simple-page";

export default function SecurityPage() {
  return (
    <SimplePage
      badge="Seguridad"
      title="La confianza se disena antes de escalar."
      description="EducAI bloquea rutas internas sin sesion, exige JWT en la API y mantiene controles de tenant, auditoria y validaciones de webhooks para operar con datos sensibles."
      icon={LockKeyhole}
      primaryLabel="Ver checklist"
    />
  );
}
