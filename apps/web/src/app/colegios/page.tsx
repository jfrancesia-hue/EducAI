import { GraduationCap } from "lucide-react";

import { SimplePage } from "../_components/simple-page";

export default function SchoolsPage() {
  return (
    <SimplePage
      badge="Para escuelas"
      title="EducAI organiza planificacion, recursos y visibilidad institucional."
      description="El foco B2B queda planteado para directivos y equipos pedagogicos: planificacion docente, produccion de materiales, evaluacion, reportes y seguimiento de aula."
      icon={GraduationCap}
      primaryLabel="Explorar la plataforma"
    />
  );
}
