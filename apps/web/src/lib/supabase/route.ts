import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import {
  expireSharedSupabaseCookiesFromHeader,
  parseCookieHeader,
  setSupabaseAuthResponseCookie,
} from "./cookies";
import { getSupabaseEnv } from "./env";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export function createSupabaseRouteClient(request: Request): {
  supabase: SupabaseClient;
  withAuthCookies: <T extends NextResponse>(response: T) => T;
} {
  const { url, anonKey } = getSupabaseEnv();
  const cookiesToSet: CookieToSet[] = [];
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get("cookie"));
      },
      setAll(nextCookies: CookieToSet[]) {
        cookiesToSet.push(...nextCookies);
      },
    },
  });

  return {
    supabase,
    withAuthCookies(response) {
      expireSharedSupabaseCookiesFromHeader(response, request.headers.get("cookie"));
      cookiesToSet.forEach(({ name, value, options }) => {
        setSupabaseAuthResponseCookie(response, name, value, options);
      });
      return response;
    },
  };
}
