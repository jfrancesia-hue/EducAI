import { NextResponse, type NextRequest } from "next/server";
import { getSessionSecret, verifySessionJwt } from "./lib/session-jwt";

const SESSION_COOKIE = "educai_session";

export async function middleware(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  const secret = getSessionSecret();

  if (session && secret && (await verifySessionJwt(session, secret))) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

export const config = {
  matcher: ["/app/:path*"],
};
