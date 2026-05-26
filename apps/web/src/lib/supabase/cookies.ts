import type { CookieOptions } from "@supabase/ssr";

const SHARED_AUTH_COOKIE_DOMAIN = ".educai.com.ar";
export const EDUCAI_ACCESS_TOKEN_COOKIE = "educai_access_token";

type CookieSetter = {
  set(name: string, value: string, options: CookieOptions): unknown;
};

export function withHostOnlyAuthCookieOptions(options: CookieOptions): CookieOptions {
  return {
    ...options,
    domain: undefined,
    path: options.path ?? "/",
  };
}

type CookieResponse = {
  cookies: CookieSetter;
  headers: {
    append(name: string, value: string): unknown;
  };
};

function expireSharedDomainCookie(response: CookieResponse, name: string, options: CookieOptions) {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const path = options.path ?? "/";
  const sameSite = typeof options.sameSite === "string" ? options.sameSite : "lax";
  response.headers.append(
    "Set-Cookie",
    [
      `${name}=`,
      `Path=${path}`,
      "Max-Age=0",
      `Domain=${SHARED_AUTH_COOKIE_DOMAIN}`,
      "Secure",
      options.httpOnly === false ? "" : "HttpOnly",
      `SameSite=${sameSite}`,
    ]
      .filter(Boolean)
      .join("; "),
  );
}

export function expireSharedSupabaseCookiesFromHeader(
  response: CookieResponse,
  cookieHeader: string | null,
) {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  parseCookieHeader(cookieHeader)
    .filter(({ name }) => name.startsWith("sb-"))
    .forEach(({ name }) => expireSharedDomainCookie(response, name, { path: "/" }));
}

export function setSupabaseAuthResponseCookie(
  response: CookieResponse,
  name: string,
  value: string,
  options: CookieOptions,
) {
  response.cookies.set(name, value, withHostOnlyAuthCookieOptions(options));
}

export function parseCookieHeader(cookieHeader: string | null) {
  const deduped = new Map<string, string>();

  for (const entry of (cookieHeader ?? "").split(/;\s*/u)) {
    if (!entry) {
      continue;
    }

    const separator = entry.indexOf("=");
    const name = separator >= 0 ? entry.slice(0, separator) : entry;
    const value = separator >= 0 ? entry.slice(separator + 1) : "";
    deduped.set(name, value);
  }

  return Array.from(deduped, ([name, value]) => ({ name, value }));
}

export function readCookieValue(cookieHeader: string | null, name: string) {
  return parseCookieHeader(cookieHeader).find((cookie) => cookie.name === name)?.value ?? "";
}

export function setEducaiAccessTokenCookie(
  response: CookieResponse,
  accessToken: string,
  maxAge = 60 * 55,
) {
  response.cookies.set(EDUCAI_ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export function clearEducaiAccessTokenCookie(response: CookieResponse) {
  response.cookies.set(EDUCAI_ACCESS_TOKEN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
