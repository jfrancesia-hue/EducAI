import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

import {
  EDUCAI_ACCESS_TOKEN_COOKIE,
  expireSharedSupabaseCookiesFromHeader,
  parseCookieHeader,
  readCookieValue,
  setSupabaseAuthResponseCookie,
} from "./cookies";
import { hasSupabaseEnv } from "./env";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export async function updateSession(request: NextRequest): Promise<{
  response: NextResponse;
  user: User | null;
}> {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-educai-pathname", request.nextUrl.pathname);
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  const cookieHeader = request.headers.get("cookie");
  expireSharedSupabaseCookiesFromHeader(response, cookieHeader);

  if (!hasSupabaseEnv()) {
    return { response, user: null };
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(cookieHeader);
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            setSupabaseAuthResponseCookie(response, name, value, options);
          });
        },
      },
    },
  );

  let {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const fallbackAccessToken = readCookieValue(cookieHeader, EDUCAI_ACCESS_TOKEN_COOKIE);

    if (fallbackAccessToken) {
      const { data, error } = await supabase.auth.getUser(fallbackAccessToken);
      user = error ? null : data.user;
    }
  }

  if (user) {
    requestHeaders.set("x-educai-authenticated", "1");
  }

  return { response, user };
}
