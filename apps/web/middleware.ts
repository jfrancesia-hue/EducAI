import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const DEMO_SESSION_COOKIE = "educai_demo_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasDemoSession = request.cookies.get(DEMO_SESSION_COOKIE)?.value === "1";

  if (pathname.startsWith("/app") && !hasDemoSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/login" && hasDemoSession) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/login"],
};
