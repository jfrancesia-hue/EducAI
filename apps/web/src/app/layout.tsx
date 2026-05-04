import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@educai/ui/styles/globals.css";

export const metadata: Metadata = {
  title: "EducAI - IA educativa para docentes y escuelas",
  description:
    "Plataforma educativa con agente IA docente, planificacion, produccion de recursos, evaluacion y analitica institucional. Hecha en Argentina para LATAM.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-AR" data-brand="educai">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
