import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

import { withSharedAuthCookieDomain } from "./cookies";
import { getSupabaseEnv } from "./env";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export function createSupabaseServerClient() {
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            cookieStore.set(name, value, withSharedAuthCookieDomain(options));
          } catch {
            // Server component contexts can reject cookie writes.
          }
        });
      },
    },
  });
}
