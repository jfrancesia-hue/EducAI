import { ShieldCheck } from "lucide-react";

import { SimplePage } from "../_components/simple-page";

export default function PrivacyPage() {
  return (
    <SimplePage
      badge="Privacidad"
      title="Datos educativos tratados con criterio de minimo acceso."
      description="Esta seccion queda preparada para documentar consentimiento, retencion, derechos de titulares, uso de proveedores IA, auditoria y controles sobre informacion escolar."
      icon={ShieldCheck}
      primaryLabel="Volver a EducAI"
    />
  );
}
