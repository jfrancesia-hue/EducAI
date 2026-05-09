import { createHmac } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getSessionSecret } from "../../../../lib/session-jwt";

export const runtime = "nodejs";

const SESSION_COOKIE = "educai_session";

export async function POST(request: NextRequest) {
  const configuredFounderEmail = process.env.EDUCAI_FOUNDER_EMAIL;
  const configuredFounderPassword = process.env.EDUCAI_FOUNDER_PASSWORD;

  if (!configuredFounderEmail || !configuredFounderPassword) {
    return NextResponse.json(
      {
        code: "FOUNDER_LOGIN_DISABLED",
        message:
          "Login fundador deshabilitado: configurar EDUCAI_FOUNDER_EMAIL y EDUCAI_FOUNDER_PASSWORD",
      },
      { status: 404 },
    );
  }

  const formData = await request.formData();
  const email = formValue(formData, "email").trim().toLowerCase();
  const password = formValue(formData, "password");
  const acceptedTerms = formData.get("acceptTerms") === "on";
  const next = safeNextPath(formValue(formData, "next") || "/app");
  const expectedEmail = configuredFounderEmail.toLowerCase();
  const expectedPassword = configuredFounderPassword;
  const secret = getSessionSecret();

  if (!acceptedTerms) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", next);
    loginUrl.searchParams.set("error", "terminos");
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  if (!secret || email !== expectedEmail || password !== expectedPassword) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", next);
    loginUrl.searchParams.set("error", "credenciales");
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  const now = Math.floor(Date.now() / 1000);
  const token = signJwt(
    {
      sub: expectedEmail,
      email: expectedEmail,
      tenantId: "tenant_visual",
      role: "SUPER_ADMIN",
      exp: now + 60 * 60 * 8,
    },
    secret,
  );

  const response = NextResponse.redirect(new URL(next, request.url), { status: 303 });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}

function signJwt(payload: Record<string, unknown>, secret: string): string {
  const header = base64UrlEncode({ alg: "HS256", typ: "JWT" });
  const body = base64UrlEncode(payload);
  const signature = createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

function base64UrlEncode(value: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function formValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function safeNextPath(next?: string): string {
  if (!next?.startsWith("/") || next.startsWith("//")) {
    return "/app";
  }
  return next;
}
