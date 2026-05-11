import { NextResponse } from "next/server";

const DEMO_SESSION_COOKIE = "educai_demo_session";

export async function GET(request: Request) {
  const redirectUrl = new URL("/app/agente", request.url);
  const response = NextResponse.redirect(redirectUrl);

  response.cookies.set({
    name: DEMO_SESSION_COOKIE,
    value: "1",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return response;
}
