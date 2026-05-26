import type { CookieOptions } from "@supabase/ssr";

const SHARED_AUTH_COOKIE_DOMAIN = ".educai.com.ar";

type CookieSetter = {
  set(name: string, value: string, options: CookieOptions): unknown;
};

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

export function setSupabaseAuthCookie(
  cookies: CookieSetter,
  name: string,
  value: string,
  options: CookieOptions,
) {
  const hostOptions = { ...options, path: options.path ?? "/" };

  if (process.env.NODE_ENV === "production") {
    cookies.set(name, value, withSharedAuthCookieDomain(options));
  }

  cookies.set(name, value, hostOptions);
}
