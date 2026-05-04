import { MessageCircle } from "lucide-react";

import { SimplePage } from "../_components/simple-page";

export default function ContactPage() {
  return (
    <SimplePage
      badge="Contacto"
      title="Conversemos sobre el primer piloto."
      description="La página queda lista para conectar un formulario o CRM. La propuesta comercial: empezar chico, medir aprendizaje y seguridad, y crecer con evidencia."
      icon={MessageCircle}
      primaryLabel="Volver al inicio"
    />
  );
}
