import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";

import { withSharedAuthCookieDomain } from "../../../lib/supabase/cookies";
import { getSupabaseEnv, hasSupabaseEnv } from "../../../lib/supabase/env";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

function parseCookies(request: Request) {
  const cookieHeader = new Headers(request.headers).get("cookie") ?? "";

  return cookieHeader
    .split(/;\s*/u)
    .filter(Boolean)
    .map((entry) => {
      const separator = entry.indexOf("=");
      const name = separator >= 0 ? entry.slice(0, separator) : entry;
      const value = separator >= 0 ? entry.slice(separator + 1) : "";
      return { name, value };
    });
}

export async function GET(request: Request) {
  const redirectUrl = new URL("/login", request.url);
  const response = NextResponse.redirect(redirectUrl);

  if (!hasSupabaseEnv()) {
    return response;
  }

  const { url, anonKey } = getSupabaseEnv();
  const requestCookies = parseCookies(request);
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return requestCookies;
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, withSharedAuthCookieDomain(options));
        });
      },
    },
  });

  await supabase.auth.signOut();
  return response;
}
