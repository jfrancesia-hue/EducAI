import { LockKeyhole } from "lucide-react";

import { SimplePage } from "../_components/simple-page";

export default function SecurityPage() {
  return (
    <SimplePage
      badge="Seguridad"
      title="La confianza se disena desde el primer acceso."
      description="EducAI protege el ingreso, ordena los permisos por rol y cuida que cada escuela trabaje dentro de su propio espacio."
      icon={LockKeyhole}
      primaryLabel="Hablar con el equipo"
    />
  );
}
