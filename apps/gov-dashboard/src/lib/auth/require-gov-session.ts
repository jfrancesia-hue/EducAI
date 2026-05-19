import { redirect } from "next/navigation";

import type { GovRole } from "../nav";
import { createSupabaseServerClient } from "../supabase/server";
import { extractRoleFromMetadata } from "../supabase/roles";

function getMetadataString(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object") {
    return undefined;
  }

  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

export async function requireGovSession(allowedRoles: GovRole[] = ["SUPER_ADMIN", "MINISTRY"]) {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect("/login");
  }

  const role =
    extractRoleFromMetadata(session.user.app_metadata) ??
    extractRoleFromMetadata(session.user.user_metadata);

  if (!role || !allowedRoles.includes(role as GovRole)) {
    redirect("/acceso-denegado");
  }

  return {
    session,
    userRole: role as GovRole,
    tenantName: getMetadataString(session.user.app_metadata, "tenantName"),
  };
}
