import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { updateSession } from "./lib/supabase/middleware";
import { extractRoleFromMetadata } from "./lib/supabase/roles";

const WEB_ALLOWED_ROLES = new Set(["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER"]);

function safeNextPath(value: string | null) {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  if (value.startsWith("/app") || value.startsWith("/familia")) {
    return value;
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { response, user } = await updateSession(request);
  const hasSession = Boolean(user);
  const role =
    extractRoleFromMetadata(user?.app_metadata) ?? extractRoleFromMetadata(user?.user_metadata);

  if (pathname.startsWith("/app") && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/familia") && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/app") && hasSession && role === "PARENT") {
    return NextResponse.redirect(new URL("/familia", request.url));
  }

  if (pathname.startsWith("/app") && hasSession && (!role || !WEB_ALLOWED_ROLES.has(role))) {
    return NextResponse.redirect(new URL("/acceso-denegado", request.url));
  }

  if (pathname.startsWith("/familia") && hasSession && role && WEB_ALLOWED_ROLES.has(role)) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  if (pathname.startsWith("/familia") && hasSession && role !== "PARENT") {
    return NextResponse.redirect(new URL("/acceso-denegado", request.url));
  }

  if (pathname === "/login" && hasSession && role === "PARENT") {
    return NextResponse.redirect(new URL("/familia", request.url));
  }

  if (pathname === "/login" && hasSession && role && WEB_ALLOWED_ROLES.has(role)) {
    const nextPath = safeNextPath(request.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(new URL(nextPath ?? "/app", request.url));
  }

  if (pathname === "/acceso-denegado" && hasSession && role === "PARENT") {
    return NextResponse.redirect(new URL("/familia", request.url));
  }

  if (pathname === "/acceso-denegado" && hasSession && role && WEB_ALLOWED_ROLES.has(role)) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*", "/familia/:path*", "/login", "/acceso-denegado"],
};
