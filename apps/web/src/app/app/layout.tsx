import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { extractRoleFromMetadata } from "../../lib/supabase/roles";
import { createSupabaseServerClient } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";

const WEB_ALLOWED_ROLES = new Set(["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"]);

export default async function ProtectedAppLayout({ children }: { children: ReactNode }) {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const pathname = headers().get("x-educai-pathname");
    const next = pathname?.startsWith("/app") ? pathname : "/app";
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const role =
    extractRoleFromMetadata(session.user.app_metadata) ??
    extractRoleFromMetadata(session.user.user_metadata);

  if (!role || !WEB_ALLOWED_ROLES.has(role)) {
    redirect("/acceso-denegado");
  }

  return children;
}
