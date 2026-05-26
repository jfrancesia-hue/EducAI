import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { parseCookieHeader, setSupabaseAuthResponseCookie } from "../../../lib/supabase/cookies";
import { getSupabaseEnv } from "../../../lib/supabase/env";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

function safeNext(value: string | null) {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return "/app";
  }

  return value;
}

function transitionUrl(request: NextRequest, next: string) {
  if (!next.startsWith("/app") && !next.startsWith("/familia")) {
    return new URL(next, request.url);
  }

  const url = new URL("/login/entrando", request.url);
  url.searchParams.set("next", next);
  return url;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNext(requestUrl.searchParams.get("next"));
  const response = NextResponse.redirect(transitionUrl(request, next), { status: 303 });

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=invalid", request.url), { status: 303 });
  }

  const { url, anonKey } = getSupabaseEnv();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get("cookie"));
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          setSupabaseAuthResponseCookie(response, name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?error=invalid", request.url), { status: 303 });
  }

  return response;
}
