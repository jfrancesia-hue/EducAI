import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "@educai/ui/styles/globals.css";
import { PwaProvider } from "./_components/pwa-provider";

export const metadata: Metadata = {
  title: "EducAI - Asistente docente para planificar mejor",
  description:
    "Herramienta educativa para docentes y escuelas: planificación más simple, materiales editables, seguimiento pedagógico y datos cuidados. Hecha en Argentina para LATAM.",
  applicationName: "EducAI",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/pwa-icon.svg",
    apple: "/icons/pwa-icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EducAI",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#080d17",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-AR" data-brand="educai">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <PwaProvider />
        {children}
      </body>
    </html>
  );
}
