import { NextResponse } from "next/server";

import { closeHandoff } from "../../../../lib/api/handoffs";
import { getEducaiAppAuth } from "../../../../lib/supabase/app-auth";
import { extractRoleFromMetadata } from "../../../../lib/supabase/roles";

const SECURITY_ROLES = new Set(["SUPER_ADMIN", "SCHOOL_ADMIN"]);

export async function POST(request: Request) {
  const back = new URL("/app/seguridad", request.url);

  const { user, accessToken } = await getEducaiAppAuth();
  if (!user || !accessToken) {
    return NextResponse.redirect(new URL("/login?next=/app/seguridad", request.url), 303);
  }

  const role =
    extractRoleFromMetadata(user.app_metadata) ?? extractRoleFromMetadata(user.user_metadata);
  if (!role || !SECURITY_ROLES.has(role)) {
    return NextResponse.redirect(new URL("/acceso-denegado", request.url), 303);
  }

  const form = await request.formData();
  const idValue = form.get("id");
  const noteValue = form.get("resolutionNote");
  const id = typeof idValue === "string" ? idValue.trim() : "";
  const resolutionNote = typeof noteValue === "string" ? noteValue.trim() : "";

  if (id) {
    await closeHandoff(accessToken, id, resolutionNote || undefined);
  }

  return NextResponse.redirect(back, 303);
}
