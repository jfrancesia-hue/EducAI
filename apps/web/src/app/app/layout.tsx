import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getEducaiAppAuth } from "../../lib/supabase/app-auth";
import { extractRoleFromMetadata } from "../../lib/supabase/roles";
import { RoleProvider } from "./_components/role-context";

export const dynamic = "force-dynamic";

const WEB_ALLOWED_ROLES = new Set(["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"]);

export default async function ProtectedAppLayout({ children }: { children: ReactNode }) {
  // Bypass de auth SOLO en desarrollo y con opt-in explícito (nunca en producción).
  if (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_DISABLE_APP_AUTH === "true"
  ) {
    return <RoleProvider role="SUPER_ADMIN">{children}</RoleProvider>;
  }

  const { user } = await getEducaiAppAuth();

  if (!user) {
    redirect("/login");
  }

  const role =
    extractRoleFromMetadata(user.app_metadata) ?? extractRoleFromMetadata(user.user_metadata);

  if (!role || !WEB_ALLOWED_ROLES.has(role)) {
    redirect("/acceso-denegado");
  }

  return <RoleProvider role={role}>{children}</RoleProvider>;
}
