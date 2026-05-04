import { LockKeyhole } from "lucide-react";

import { SimplePage } from "../_components/simple-page";

export default function SecurityPage() {
  return (
    <SimplePage
      badge="Seguridad"
      title="La confianza se diseña antes de escalar."
      description="El producto ya comunica seguridad; el siguiente tramo técnico es cerrar auth, RBAC, rate limiting, auditoría, monitoreo y validaciones de webhooks antes de abrir a usuarios reales."
      icon={LockKeyhole}
      primaryLabel="Ver checklist"
    />
  );
}
