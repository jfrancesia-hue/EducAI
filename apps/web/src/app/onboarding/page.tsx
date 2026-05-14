import { Sparkles } from "lucide-react";

import { SimplePage } from "../_components/simple-page";

export default function OnboardingPage() {
  return (
    <SimplePage
      badge="Piloto EducAI"
      title="Armemos una experiencia piloto docente, cuidada y medible."
      description="La plataforma queda lista para capturar interes sin prometer magia: docentes, equipos pedagogicos y escuelas pueden entrar por un flujo de piloto con seguridad, produccion de recursos y metricas claras."
      icon={Sparkles}
      primaryLabel="Ir a ingresar"
      primaryHref="/login"
    />
  );
}
