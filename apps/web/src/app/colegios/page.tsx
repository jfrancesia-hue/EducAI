import { GraduationCap } from "lucide-react";

import { SimplePage } from "../_components/simple-page";

export default function SchoolsPage() {
  return (
    <SimplePage
      badge="Para escuelas"
      title="EducAI organiza planificación, recursos y visibilidad institucional."
      description="El foco B2B queda planteado para directivos y equipos pedagógicos: planificación docente, producción de materiales, evaluación, reportes y seguimiento de aula."
      icon={GraduationCap}
      primaryLabel="Explorar la plataforma"
    />
  );
}
