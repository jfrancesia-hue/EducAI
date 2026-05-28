import Link from "next/link";
import { LogOut } from "lucide-react";

import { Badge } from "@educai/ui";
import type { GovRole } from "../../lib/nav";

interface GovHeaderProps {
  userEmail: string;
  userRole: GovRole;
  tenantName?: string;
}

function formatRole(role: GovRole) {
  return role === "SUPER_ADMIN" ? "SUPER ADMIN" : "MINISTERIO";
}

export function GovHeader({ userEmail, userRole, tenantName }: GovHeaderProps) {
  return (
    <header
      data-no-print
      className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md sm:px-6"
    >
      <div className="flex min-w-0 items-center gap-3 pl-14 lg:pl-0">
        {tenantName ? (
          <span className="truncate rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            {tenantName}
          </span>
        ) : (
          <span className="truncate rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            Jurisdiccion ministerial
          </span>
        )}
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <Badge
          variant="outline"
          className="hidden border-blue-200 bg-blue-50 text-blue-800 sm:inline-flex"
        >
          {formatRole(userRole)}
        </Badge>
        <span className="hidden max-w-[220px] truncate text-sm text-slate-600 md:block">
          {userEmail || "sesión ministerial"}
        </span>
        <Link
          href="/login/salir"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 outline-none transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]"
          aria-label="Cerrar sesión"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
