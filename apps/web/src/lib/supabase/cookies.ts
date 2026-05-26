import type { CookieOptions } from "@supabase/ssr";

const SHARED_AUTH_COOKIE_DOMAIN = ".educai.com.ar";

export function withSharedAuthCookieDomain(options: CookieOptions): CookieOptions {
  if (process.env.NODE_ENV !== "production") {
    return options;
  }

  return {
    ...options,
    domain: options.domain ?? SHARED_AUTH_COOKIE_DOMAIN,
    path: options.path ?? "/",
  };
}
