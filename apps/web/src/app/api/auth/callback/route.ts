import { NextResponse, type NextRequest } from "next/server";
import { getSessionSecret, verifySessionJwt } from "../../../../lib/session-jwt";

const SESSION_COOKIE = "educai_session";

type CallbackBody = {
  token?: string;
  next?: string;
};

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? undefined;
  const next = request.nextUrl.searchParams.get("next") ?? "/app";
  return completeLogin(request, { token, next });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as CallbackBody;
  return completeLogin(request, body);
}

async function completeLogin(request: NextRequest, body: CallbackBody) {
  const secret = getSessionSecret();
  if (!secret || !body.token) {
    return NextResponse.json(
      { code: "AUTH_CALLBACK_INVALID", message: "Token o secreto de sesion faltante" },
      { status: 401 },
    );
  }

  const payload = await verifySessionJwt(body.token, secret);
  if (!payload) {
    return NextResponse.json(
      { code: "AUTH_CALLBACK_INVALID", message: "Token de sesion invalido" },
      { status: 401 },
    );
  }

  const response = NextResponse.redirect(new URL(safeNextPath(body.next), request.url));
  response.cookies.set(SESSION_COOKIE, body.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(
      0,
      (payload.exp ?? Math.floor(Date.now() / 1000) + 3600) - Math.floor(Date.now() / 1000),
    ),
  });
  return response;
}

function safeNextPath(next?: string): string {
  if (!next?.startsWith("/") || next.startsWith("//")) {
    return "/app";
  }
  return next;
}
