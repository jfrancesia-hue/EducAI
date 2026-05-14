import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { updateSession } from "./src/lib/supabase/middleware";
import { extractRoleFromMetadata } from "./src/lib/supabase/roles";

const GOV_ALLOWED_ROLES = new Set(["SUPER_ADMIN", "MINISTRY"]);
const PUBLIC_PATHS = new Set(["/login", "/login/enter", "/login/salir", "/acceso-denegado"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { response, user } = await updateSession(request);
  const hasSession = Boolean(user);
  const role =
    extractRoleFromMetadata(user?.app_metadata) ?? extractRoleFromMetadata(user?.user_metadata);
  const isPublicPath = PUBLIC_PATHS.has(pathname);

  if (!isPublicPath && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!isPublicPath && hasSession && (!role || !GOV_ALLOWED_ROLES.has(role))) {
    return NextResponse.redirect(new URL("/acceso-denegado", request.url));
  }

  if (pathname === "/login" && hasSession && role && GOV_ALLOWED_ROLES.has(role)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
