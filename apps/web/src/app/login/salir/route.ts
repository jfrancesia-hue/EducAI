import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";

import {
  clearEducaiAccessTokenCookie,
  parseCookieHeader,
  setSupabaseAuthResponseCookie,
} from "../../../lib/supabase/cookies";
import { getSupabaseEnv, hasSupabaseEnv } from "../../../lib/supabase/env";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export async function GET(request: Request) {
  const redirectUrl = new URL("/login", request.url);
  const response = NextResponse.redirect(redirectUrl);
  clearEducaiAccessTokenCookie(response);

  if (!hasSupabaseEnv()) {
    return response;
  }

  const { url, anonKey } = getSupabaseEnv();
  const requestCookies = parseCookieHeader(new Headers(request.headers).get("cookie"));
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return requestCookies;
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          setSupabaseAuthResponseCookie(response, name, value, options);
        });
      },
    },
  });

  await supabase.auth.signOut();
  return response;
}
