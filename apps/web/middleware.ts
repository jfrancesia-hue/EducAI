import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { updateSession } from "./src/lib/supabase/middleware";
import { extractRoleFromMetadata } from "./src/lib/supabase/roles";

const WEB_ALLOWED_ROLES = new Set(["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { response, user } = await updateSession(request);
  const hasSession = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token"));
  const role =
    extractRoleFromMetadata(user?.app_metadata) ?? extractRoleFromMetadata(user?.user_metadata);

  if (pathname.startsWith("/app") && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/app") && hasSession && (!role || !WEB_ALLOWED_ROLES.has(role))) {
    return NextResponse.redirect(new URL("/acceso-denegado", request.url));
  }

  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*", "/login", "/acceso-denegado"],
};
