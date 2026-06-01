import { generateKeyPairSync, sign, type KeyObject } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SupabaseAuthService } from "./supabase-auth.service.js";

const ISSUER = "https://mfjpoaipjlimzdxkusav.supabase.co/auth/v1";
const KID = "test-key-1";

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function mintToken(privateKey: KeyObject, payload: Record<string, unknown>): string {
  const header = { alg: "ES256", typ: "JWT", kid: KID };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const signature = sign("sha256", Buffer.from(signingInput), {
    key: privateKey,
    dsaEncoding: "ieee-p1363",
  });
  return `${signingInput}.${base64url(signature)}`;
}

describe("SupabaseAuthService — validacion de audience del JWT", () => {
  let service: SupabaseAuthService;
  let privateKey: KeyObject;
  let jwk: Record<string, unknown>;
  const now = Math.floor(Date.now() / 1000);

  const basePayload = (overrides: Record<string, unknown>) => ({
    sub: "user-123",
    email: "docente@colegio.edu.ar",
    iss: ISSUER,
    exp: now + 3600,
    nbf: now - 10,
    app_metadata: { role: "TEACHER", tenantId: "tenant-1" },
    ...overrides,
  });

  beforeEach(() => {
    const keyPair = generateKeyPairSync("ec", { namedCurve: "P-256" });
    privateKey = keyPair.privateKey;
    jwk = { ...keyPair.publicKey.export({ format: "jwk" }), kid: KID, alg: "ES256" };

    service = new SupabaseAuthService();
    // Stub de la descarga de JWKS para no salir a la red.
    vi.spyOn(
      service as unknown as { fetchJwks: () => Promise<unknown> },
      "fetchJwks",
    ).mockResolvedValue({ keys: [jwk] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("acepta un token con aud='authenticated'", async () => {
    const token = mintToken(privateKey, basePayload({ aud: "authenticated" }));
    const user = await service.authenticate(token);
    expect(user.id).toBe("user-123");
    expect(user.role).toBe("TEACHER");
    expect(user.tenantId).toBe("tenant-1");
  });

  it("rechaza un token con aud distinto (no cae al path local)", async () => {
    const token = mintToken(privateKey, basePayload({ aud: "otra-audiencia" }));
    // Sin client de Supabase configurado, el fallback lanza ServiceUnavailable/Unauthorized:
    // lo importante es que NO devuelve un usuario autenticado.
    await expect(service.authenticate(token)).rejects.toThrow();
  });

  it("rechaza un token sin claim aud (fail-closed)", async () => {
    const token = mintToken(privateKey, basePayload({}));
    await expect(service.authenticate(token)).rejects.toThrow();
  });
});
