import type { User } from "@supabase/supabase-js";

/**
 * Helpers de access token SEGUROS para el Edge runtime (middleware de Next.js).
 *
 * No usa `node:crypto` ni `Buffer` a propósito: el middleware corre en Edge y esos
 * módulos no están disponibles ahí. Acá solo decodificamos los claims y validamos
 * tiempo/emisor de forma local (sin red), para decidir el gate de ruteo.
 *
 * La verificación de FIRMA (el control fuerte) sigue ocurriendo en `app-auth.ts`
 * sobre el runtime de Node, y el backend NestJS revalida cada token en cada request.
 * Acá la firma no se chequea: solo se usa para decidir redirect-a-login vs seguir.
 */

export const EDUCAI_SUPABASE_AUTH_ISSUER = "https://mfjpoaipjlimzdxkusav.supabase.co/auth/v1";

export type AccessTokenClaims = {
  sub?: string;
  email?: string;
  exp?: number;
  nbf?: number;
  iss?: string;
  app_metadata?: unknown;
  user_metadata?: unknown;
};

function base64UrlDecode(segment: string): string {
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function decodeAccessTokenClaims(
  token: string | null | undefined,
): AccessTokenClaims | null {
  if (!token) {
    return null;
  }

  const segments = token.split(".");
  if (segments.length !== 3 || !segments[1]) {
    return null;
  }

  try {
    return JSON.parse(base64UrlDecode(segments[1])) as AccessTokenClaims;
  } catch {
    return null;
  }
}

export type AccessTokenCheck = {
  usable: boolean;
  claims: AccessTokenClaims | null;
  secondsRemaining: number;
};

/**
 * Valida estructura, emisor y vigencia (exp/nbf) de un access token, SIN red.
 * `secondsRemaining` permite decidir si conviene refrescar proactivamente.
 */
export function isAccessTokenUsable(
  token: string | null | undefined,
  opts: { issuer?: string; nowMs?: number } = {},
): AccessTokenCheck {
  const claims = decodeAccessTokenClaims(token);
  if (!claims) {
    return { usable: false, claims: null, secondsRemaining: -1 };
  }

  const nowSec = Math.floor((opts.nowMs ?? Date.now()) / 1000);
  const secondsRemaining = typeof claims.exp === "number" ? claims.exp - nowSec : -1;

  if (!claims.sub) {
    return { usable: false, claims, secondsRemaining };
  }

  const expectedIssuer = opts.issuer ?? EDUCAI_SUPABASE_AUTH_ISSUER;
  if (claims.iss && claims.iss !== expectedIssuer) {
    return { usable: false, claims, secondsRemaining };
  }

  if (typeof claims.exp === "number" && claims.exp <= nowSec) {
    return { usable: false, claims, secondsRemaining };
  }

  if (typeof claims.nbf === "number" && claims.nbf > nowSec) {
    return { usable: false, claims, secondsRemaining };
  }

  return { usable: true, claims, secondsRemaining };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

/**
 * Construye un `User` mínimo a partir de los claims del token, para que el
 * middleware pueda resolver rol/redirecciones sin depender de una llamada de red.
 */
export function accessTokenClaimsToUser(claims: AccessTokenClaims): User {
  return {
    id: claims.sub ?? "",
    email: claims.email ?? undefined,
    app_metadata: asRecord(claims.app_metadata),
    user_metadata: asRecord(claims.user_metadata),
  } as User;
}
