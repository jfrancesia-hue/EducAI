import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";

import {
  parseCookieHeader,
  setEducaiAccessTokenCookie,
  setSupabaseAuthResponseCookie,
} from "./cookies";
import { getSupabaseEnv, hasSupabaseEnv } from "./env";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export async function signInWithPasswordRedirect(
  request: Request,
  input: {
    email: string;
    password: string;
    redirectUrl: URL;
  },
) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const { url, anonKey } = getSupabaseEnv();
  const response = NextResponse.redirect(input.redirectUrl, { status: 303 });
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

  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error || !data.user || !data.session?.access_token) {
    return null;
  }

  setEducaiAccessTokenCookie(response, data.session.access_token, data.session.expires_in);
  return { response, user: data.user };
}
