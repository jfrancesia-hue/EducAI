import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { createPublicKey, verify, type JsonWebKey } from "node:crypto";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

import type { AuthenticatedUser, EducAiRole } from "./authenticated-user.js";

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
  aud?: string | string[];
  iss?: string;
  app_metadata?: unknown;
  user_metadata?: unknown;
};

type Jwk = JsonWebKey & {
  kid?: string;
  alg?: string;
};

type JwksResponse = {
  keys?: Jwk[];
};

@Injectable()
export class SupabaseAuthService {
  private readonly logger = new Logger(SupabaseAuthService.name);
  private client?: SupabaseClient;

  async authenticate(accessToken: string): Promise<AuthenticatedUser> {
    const parsed = this.parseJwt(accessToken);
    if (parsed?.header.alg === "ES256") {
      const jwtUser = await this.authenticateSignedJwt(accessToken);
      if (jwtUser) {
        return jwtUser;
      }
    }

    const client = this.getClient();
    let data: { user: User | null };
    let error: unknown;
    try {
      const result = await client.auth.getUser(accessToken);
      data = result.data;
      error = result.error;
    } catch (authError) {
      this.logger.warn({
        event: "supabase_auth_get_user_failed",
        error: authError instanceof Error ? authError.message : "unknown",
      });

      const jwtUser = await this.authenticateSignedJwt(accessToken);
      if (jwtUser) {
        return jwtUser;
      }

      throw new ServiceUnavailableException("No pudimos validar la sesion en este momento");
    }

    if (!error && data.user) {
      return this.mapUser(data.user);
    }

    if (parsed?.header.alg !== "ES256") {
      const jwtUser = await this.authenticateSignedJwt(accessToken);
      if (jwtUser) {
        return jwtUser;
      }
    }

    throw new UnauthorizedException("Token de acceso invalido o expirado");
  }

  private getClient(): SupabaseClient {
    if (this.client) {
      return this.client;
    }

    const url = process.env.SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !secretKey) {
      throw new ServiceUnavailableException(
        "Supabase auth no esta configurado en el API (faltan SUPABASE_URL y una key elevada: SUPABASE_SECRET_KEY o SUPABASE_SERVICE_ROLE_KEY)",
      );
    }

    this.client = createClient(url, secretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    return this.client;
  }

  private mapUser(user: User): AuthenticatedUser {
    const appMetadata = this.asRecord(user.app_metadata);
    const userMetadata = this.asRecord(user.user_metadata);

    return {
      id: user.id,
      email: user.email ?? null,
      role: this.extractRole(appMetadata, userMetadata),
      tenantId: this.extractString(appMetadata, userMetadata, "tenantId", "tenant_id"),
      familyId: this.extractString(appMetadata, userMetadata, "familyId", "family_id"),
      schoolId: this.extractString(appMetadata, userMetadata, "schoolId", "school_id"),
      teacherId: this.extractString(appMetadata, userMetadata, "teacherId", "teacher_id"),
      plan: this.extractString(appMetadata, userMetadata, "plan", "planCode", "plan_code"),
    };
  }

  private async authenticateSignedJwt(accessToken: string): Promise<AuthenticatedUser | null> {
    const parsed = this.parseJwt(accessToken);
    if (!parsed) {
      return null;
    }

    const { header, payload, signingInput, signature } = parsed;
    if (!payload.iss || !this.getAllowedIssuers().has(payload.iss)) {
      return null;
    }

    if (!this.isAudienceValid(payload)) {
      this.logger.warn({ event: "supabase_auth_invalid_audience" });
      return null;
    }

    if (!this.isTokenTimeValid(payload)) {
      return null;
    }

    const verified = await this.verifyJwtSignature(payload.iss, header, signingInput, signature);
    if (!verified || !payload.sub) {
      return null;
    }

    const appMetadata = this.asRecord(payload.app_metadata);
    const userMetadata = this.asRecord(payload.user_metadata);

    return {
      id: payload.sub,
      email: payload.email ?? null,
      role: this.extractRole(appMetadata, userMetadata),
      tenantId: this.extractString(appMetadata, userMetadata, "tenantId", "tenant_id"),
      familyId: this.extractString(appMetadata, userMetadata, "familyId", "family_id"),
      schoolId: this.extractString(appMetadata, userMetadata, "schoolId", "school_id"),
      teacherId: this.extractString(appMetadata, userMetadata, "teacherId", "teacher_id"),
      plan: this.extractString(appMetadata, userMetadata, "plan", "planCode", "plan_code"),
    };
  }

  private parseJwt(accessToken: string): {
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
        payload: JSON.parse(
          Buffer.from(payloadSegment, "base64url").toString("utf8"),
        ) as JwtPayload,
        signingInput: `${headerSegment}.${payloadSegment}`,
        signature: Buffer.from(signatureSegment, "base64url"),
      };
    } catch {
      return null;
    }
  }

  private isAudienceValid(payload: JwtPayload): boolean {
    const allowed = this.getAllowedAudiences();
    const tokenAudiences = Array.isArray(payload.aud)
      ? payload.aud
      : payload.aud
        ? [payload.aud]
        : [];

    // Fail-closed: un token sin `aud` no se acepta por la via de verificacion local.
    if (tokenAudiences.length === 0) {
      return false;
    }

    return tokenAudiences.some((aud) => allowed.has(aud.trim()));
  }

  private getAllowedAudiences(): Set<string> {
    const configured = (process.env.SUPABASE_JWT_AUDIENCE ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    // `authenticated` es la audiencia por defecto de los access tokens de Supabase.
    return new Set([...configured, "authenticated"]);
  }

  private isTokenTimeValid(payload: JwtPayload): boolean {
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === "number" && payload.exp <= now) {
      return false;
    }

    if (typeof payload.nbf === "number" && payload.nbf > now) {
      return false;
    }

    return true;
  }

  private async verifyJwtSignature(
    issuer: string,
    header: JwtHeader,
    signingInput: string,
    signature: Buffer,
  ): Promise<boolean> {
    if (header.alg !== "ES256" || !header.kid) {
      return false;
    }

    const jwks = await this.fetchJwks(issuer);
    const jwk = jwks.keys?.find((key) => key.kid === header.kid);
    if (!jwk) {
      return false;
    }

    const publicKey = createPublicKey({ key: jwk as JsonWebKey, format: "jwk" });
    return verify(
      "sha256",
      Buffer.from(signingInput),
      { key: publicKey, dsaEncoding: "ieee-p1363" },
      signature,
    );
  }

  private async fetchJwks(issuer: string): Promise<JwksResponse> {
    const response = await fetch(`${issuer.replace(/\/$/u, "")}/.well-known/jwks.json`);
    if (!response.ok) {
      return {};
    }

    return (await response.json()) as JwksResponse;
  }

  private getAllowedIssuers(): Set<string> {
    const configuredIssuers = [
      process.env.SUPABASE_AUTH_ISSUERS,
      process.env.SUPABASE_JWT_ISSUER_ALLOWLIST,
      process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL.replace(/\/$/u, "")}/auth/v1` : "",
    ]
      .flatMap((value) => (value ?? "").split(","))
      .map((value) => value.trim().replace(/\/$/u, ""))
      .filter(Boolean);

    return new Set([...configuredIssuers, EDUCAI_SUPABASE_AUTH_ISSUER]);
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  }

  private extractRole(
    appMetadata: Record<string, unknown>,
    userMetadata: Record<string, unknown>,
  ): EducAiRole | undefined {
    const role = this.extractString(appMetadata, userMetadata, "role");

    switch (role) {
      case "SUPER_ADMIN":
      case "MINISTRY":
      case "SCHOOL_ADMIN":
      case "TEACHER":
      case "PARENT":
        return role;
      default:
        return undefined;
    }
  }

  private extractString(
    appMetadata: Record<string, unknown>,
    userMetadata: Record<string, unknown>,
    ...keys: string[]
  ): string | undefined {
    for (const key of keys) {
      const appValue = appMetadata[key];
      if (typeof appValue === "string" && appValue.trim()) {
        return appValue.trim();
      }

      const userValue = userMetadata[key];
      if (typeof userValue === "string" && userValue.trim()) {
        return userValue.trim();
      }
    }

    return undefined;
  }
}
