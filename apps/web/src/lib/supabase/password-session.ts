import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";

import { setSupabaseAuthCookie } from "./cookies";
import { getSupabaseEnv, hasSupabaseEnv } from "./env";

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
  const requestCookies = parseCookies(request);
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return requestCookies;
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          setSupabaseAuthCookie(response.cookies, name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error || !data.user) {
    return null;
  }

  return { response, user: data.user };
}
