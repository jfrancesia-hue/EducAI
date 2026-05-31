import { GraduationCap } from "lucide-react";

import { SimplePage } from "../_components/simple-page";

export default function SchoolsPage() {
  return (
    <SimplePage
      badge="Para escuelas"
      title="Una forma más clara de acompañar el trabajo docente en toda la escuela."
      description="Para directivos y equipos pedagógicos: planificación docente más ordenada, materiales editables, seguimiento de aula, reportes y decisiones con información cuidada."
      icon={GraduationCap}
      primaryLabel="Solicitar demo institucional"
    />
  );
}
