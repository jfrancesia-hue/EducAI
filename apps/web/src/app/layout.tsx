import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@educai/ui/styles/globals.css";

export const metadata: Metadata = {
  title: "ApoyoAI · Tutor IA por WhatsApp",
  description:
    "Tutor de inteligencia artificial que acompaña a tu hijo en matemática, lengua y ciencias por WhatsApp. Producto de Nativos Consultora Digital.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-AR" data-brand="apoyoai">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
