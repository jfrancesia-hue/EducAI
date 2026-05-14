import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import type { GovRole } from "../../lib/nav";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import { extractRoleFromMetadata } from "../../lib/supabase/roles";
import { GovShell } from "./gov-shell";

interface GovAuthenticatedShellProps {
  children: ReactNode;
  allowedRoles?: GovRole[];
}

function getMetadataString(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object") {
    return undefined;
  }

  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

export async function GovAuthenticatedShell({
  children,
  allowedRoles = ["SUPER_ADMIN", "MINISTRY"],
}: GovAuthenticatedShellProps) {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const role =
    extractRoleFromMetadata(session.user.app_metadata) ??
    extractRoleFromMetadata(session.user.user_metadata);

  if (!role || !allowedRoles.includes(role as GovRole)) {
    redirect("/acceso-denegado");
  }

  return (
    <GovShell
      userEmail={session.user.email ?? ""}
      userRole={role as GovRole}
      tenantName={getMetadataString(session.user.app_metadata, "tenantName")}
    >
      {children}
    </GovShell>
  );
}
