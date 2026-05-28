import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createPublicKey, verify, type JsonWebKey } from "node:crypto";

import { EDUCAI_ACCESS_TOKEN_COOKIE } from "./cookies";
import { createSupabaseServerClient } from "./server";

const EDUCAI_SUPABASE_AUTH_ISSUER = "https://mfjpoaipjlimzdxkusav.supabase.co/auth/v1";

type JwtHeader = {
  alg?: string;
  kid?: string;
};

type JwtPayload = {
  sub?: string;
  email?: string;
  exp?: number;
  nbf?: number;
  iss?: string;
  app_metadata?: unknown;
  user_metadata?: unknown;
};

type Jwk = JsonWebKey & {
  kid?: string;
};

export type EducaiAppAuth = {
  accessToken: string;
  user: User | null;
};

export async function getEducaiAppAuth(): Promise<EducaiAppAuth> {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    return { accessToken: session.access_token, user: session.user };
  }

  const accessToken = cookies().get(EDUCAI_ACCESS_TOKEN_COOKIE)?.value ?? "";
  if (accessToken) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (!error && user) {
      return { accessToken, user };
    }

    const signedUser = await authenticateSignedJwt(accessToken);
    if (signedUser) {
      return { accessToken, user: signedUser };
    }
  }

  return { accessToken: "", user: null };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function parseJwt(accessToken: string): {
  header: JwtHeader;
  payload: JwtPayload;
  signingInput: string;
  signature: Buffer;
} | null {
  const [headerSegment, payloadSegment, signatureSegment] = accessToken.split(".");
  if (!headerSegment || !payloadSegment || !signatureSegment) {
    return null;
  }

  try {
    return {
      header: JSON.parse(Buffer.from(headerSegment, "base64url").toString("utf8")) as JwtHeader,
      payload: JSON.parse(Buffer.from(payloadSegment, "base64url").toString("utf8")) as JwtPayload,
      signingInput: `${headerSegment}.${payloadSegment}`,
      signature: Buffer.from(signatureSegment, "base64url"),
    };
  } catch {
    return null;
  }
}

function isTokenTimeValid(payload: JwtPayload) {
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === "number" && payload.exp <= now) {
    return false;
  }

  if (typeof payload.nbf === "number" && payload.nbf > now) {
    return false;
  }

  return true;
}

async function authenticateSignedJwt(accessToken: string): Promise<User | null> {
  const parsed = parseJwt(accessToken);
  if (!parsed || parsed.payload.iss !== EDUCAI_SUPABASE_AUTH_ISSUER || !parsed.payload.sub) {
    return null;
  }

  if (!isTokenTimeValid(parsed.payload)) {
    return null;
  }

  if (parsed.header.alg !== "ES256" || !parsed.header.kid) {
    return null;
  }

  const response = await fetch(
    `${EDUCAI_SUPABASE_AUTH_ISSUER.replace(/\/$/u, "")}/.well-known/jwks.json`,
    { cache: "force-cache", next: { revalidate: 3600 } },
  );
  if (!response.ok) {
    return null;
  }

  const jwks = (await response.json()) as { keys?: Jwk[] };
  const jwk = jwks.keys?.find((key) => key.kid === parsed.header.kid);
  if (!jwk) {
    return null;
  }

  const publicKey = createPublicKey({ key: jwk as JsonWebKey, format: "jwk" });
  const verified = verify(
    "sha256",
    Buffer.from(parsed.signingInput),
    { key: publicKey, dsaEncoding: "ieee-p1363" },
    parsed.signature,
  );
  if (!verified) {
    return null;
  }

  return {
    id: parsed.payload.sub,
    email: parsed.payload.email ?? undefined,
    app_metadata: asRecord(parsed.payload.app_metadata),
    user_metadata: asRecord(parsed.payload.user_metadata),
  } as User;
}
