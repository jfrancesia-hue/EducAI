import type { ReactNode } from "react";

import { NAV_ITEMS, type GovRole } from "../../lib/nav";
import { GovHeader } from "./gov-header";
import { GovSidebar } from "./gov-sidebar";

interface GovShellProps {
  children: ReactNode;
  userEmail: string;
  userRole: GovRole;
  tenantName?: string;
}

export function GovShell({ children, userEmail, userRole, tenantName }: GovShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main"
        className="sr-only z-[60] rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-soft outline-none focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[hsl(var(--ring))]"
      >
        Saltar al contenido
      </a>

      <div
        aria-hidden="true"
        data-no-print
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          backgroundImage: "radial-gradient(hsl(var(--gov-canvas-dots)) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div
        aria-hidden="true"
        data-no-print
        className="pointer-events-none fixed left-60 top-0 -z-10 h-[400px] w-[600px]"
        style={{
          background:
            "radial-gradient(circle at 0% 0%, hsl(var(--gov-canvas-glow-1)), transparent 65%)",
        }}
      />

      <GovSidebar items={NAV_ITEMS} userRole={userRole} />

      <div className="lg:pl-60">
        <GovHeader userEmail={userEmail} userRole={userRole} tenantName={tenantName} />
        <main id="main" className="mx-auto w-full max-w-7xl px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
