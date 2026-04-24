import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@educai/ui/styles/globals.css";

export const metadata: Metadata = {
  title: "EducAI Gov · Panel Ministerial",
  description:
    "Sistema ministerial de monitoreo educativo. Cobertura curricular, deserción temprana, formación docente y datos abiertos del sistema educativo provincial.",
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
