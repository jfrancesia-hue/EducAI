import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";

import { setSupabaseAuthCookie } from "../../../lib/supabase/cookies";
import { getSupabaseEnv } from "../../../lib/supabase/env";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

function read(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function safeNext(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/login";
  }

  if (value.startsWith("/app") || value.startsWith("/familia")) {
    return value;
  }

  return "/login";
}

function redirectToLogin(request: Request, error: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const next = safeNext(read(formData, "next"));
  const { url, anonKey } = getSupabaseEnv();
  const cookiesToSet: CookieToSet[] = [];
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll(nextCookies: CookieToSet[]) {
        cookiesToSet.push(...nextCookies);
      },
    },
  });

  const origin = new URL(request.url).origin;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });

  if (error || !data.url) {
    return redirectToLogin(request, "google");
  }

  const response = NextResponse.redirect(data.url, { status: 303 });
  cookiesToSet.forEach(({ name, value, options }) => {
    setSupabaseAuthCookie(response.cookies, name, value, options);
  });

  return response;
}
