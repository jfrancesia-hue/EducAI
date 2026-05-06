export type SessionJwtPayload = {
  sub?: string;
  tenantId?: string;
  tenant_id?: string;
  role?: string;
  exp?: number;
};

const SESSION_ROLES = new Set<string>([
  "SUPER_ADMIN",
  "MINISTRY",
  "SCHOOL_ADMIN",
  "COORDINATOR",
  "TEACHER",
  "PARENT",
  "STUDENT",
]);

type JwtHeader = {
  alg?: string;
  typ?: string;
};

export function getSessionSecret(): string | undefined {
  return process.env.EDUCAI_SESSION_JWT_SECRET ?? process.env.JWT_SECRET;
}

export async function verifySessionJwt(
  token: string,
  secret: string,
): Promise<SessionJwtPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const encodedHeader = parts[0]!;
  const encodedPayload = parts[1]!;
  const signature = parts[2]!;
  const header = parseJson<JwtHeader>(encodedHeader);
  const payload = parseJson<SessionJwtPayload>(encodedPayload);

  if (!header || !payload || header.alg !== "HS256") {
    return null;
  }
  if (
    !payload.sub ||
    !(payload.tenantId ?? payload.tenant_id) ||
    !SESSION_ROLES.has(payload.role ?? "")
  ) {
    return null;
  }
  if (payload.exp && payload.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  const valid = await verifyHmac(`${encodedHeader}.${encodedPayload}`, signature, secret);
  return valid ? payload : null;
}

function parseJson<T>(encoded: string): T | null {
  try {
    return JSON.parse(base64UrlDecodeToString(encoded)) as T;
  } catch {
    return null;
  }
}

function base64UrlDecodeToString(encoded: string): string {
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function base64UrlDecodeToBytes(encoded: string): Uint8Array {
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function verifyHmac(data: string, signature: string, secret: string): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );

    return await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlDecodeToBytes(signature),
      new TextEncoder().encode(data),
    );
  } catch {
    return false;
  }
}
