import { NextResponse } from "next/server";

import { hasSupabaseEnv } from "../../../lib/supabase/env";
import { signInWithPasswordRedirect } from "../../../lib/supabase/password-session";

function readFormValue(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function safeNextPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  if (value.startsWith("/app") || value.startsWith("/familia")) {
    return value;
  }

  return null;
}

function redirectToLogin(request: Request, params: Record<string, string>) {
  const loginUrl = new URL("/login", request.url);
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      loginUrl.searchParams.set(key, value);
    }
  });
  return NextResponse.redirect(loginUrl, { status: 303 });
}

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return redirectToLogin(request, { error: "config" });
  }

  const formData = await request.formData();
  const email = readFormValue(formData, "email");
  const password = readFormValue(formData, "password");
  const nextPath = safeNextPath(readFormValue(formData, "next"));

  if (!email || !password) {
    return redirectToLogin(request, { error: "missing", next: nextPath ?? "", email });
  }

  const redirectUrl = new URL(nextPath ?? "/app", request.url);
  const auth = await signInWithPasswordRedirect(request, { email, password, redirectUrl });

  if (!auth) {
    return redirectToLogin(request, { error: "invalid", next: nextPath ?? "", email });
  }

  const metadata = {
    ...(auth.user.user_metadata ?? {}),
    ...(auth.user.app_metadata ?? {}),
  } as Record<string, unknown>;
  if (metadata.role === "PARENT") {
    redirectUrl.pathname = "/familia";
    redirectUrl.search = "";
  }
  return auth.response;
}
