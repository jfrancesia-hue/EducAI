import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "node:crypto";
import { AuthTokenInvalidError, AuthTokenMissingError } from "./errors.js";
import { isAuthenticatedRole, type AuthenticatedRequest, type AuthenticatedUser } from "./types.js";

const AUTH_HEADER = "authorization";
const SUPPORTED_ALG = "HS256";

interface JwtHeader {
  alg?: string;
  typ?: string;
}

interface JwtPayload {
  sub?: string;
  tenantId?: string;
  tenant_id?: string;
  role?: string;
  familyId?: string;
  family_id?: string;
  schoolId?: string;
  school_id?: string;
  teacherId?: string;
  teacher_id?: string;
  exp?: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);
    const secret = process.env.JWT_SECRET;

    if (!token) {
      throw new AuthTokenMissingError();
    }
    if (!secret) {
      throw new Error("JWT_SECRET no esta configurado");
    }

    request.user = this.verify(token, secret);
    return true;
  }

  private extractBearerToken(request: AuthenticatedRequest): string | undefined {
    const raw = request.headers[AUTH_HEADER];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!value?.startsWith("Bearer ")) {
      return undefined;
    }
    return value.slice("Bearer ".length).trim() || undefined;
  }

  private verify(token: string, secret: string): AuthenticatedUser {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new AuthTokenInvalidError();
    }

    const encodedHeader = parts[0]!;
    const encodedPayload = parts[1]!;
    const signature = parts[2]!;
    const header = this.decodePart<JwtHeader>(encodedHeader);
    const payload = this.decodePart<JwtPayload>(encodedPayload);

    if (header.alg !== SUPPORTED_ALG) {
      throw new AuthTokenInvalidError();
    }
    if (!this.isSignatureValid(`${encodedHeader}.${encodedPayload}`, signature, secret)) {
      throw new AuthTokenInvalidError();
    }
    if (payload.exp && payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new AuthTokenInvalidError();
    }

    const tenantId = payload.tenantId ?? payload.tenant_id;
    const role = payload.role;
    if (!payload.sub || !tenantId || !isAuthenticatedRole(role)) {
      throw new AuthTokenInvalidError();
    }

    return {
      sub: payload.sub,
      tenantId,
      role,
      familyId: payload.familyId ?? payload.family_id,
      schoolId: payload.schoolId ?? payload.school_id,
      teacherId: payload.teacherId ?? payload.teacher_id,
    };
  }

  private decodePart<T>(encoded: string): T {
    try {
      return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as T;
    } catch {
      throw new AuthTokenInvalidError();
    }
  }

  private isSignatureValid(data: string, signature: string, secret: string): boolean {
    const expected = createHmac("sha256", secret).update(data).digest("base64url");
    const expectedBuffer = Buffer.from(expected);
    const actualBuffer = Buffer.from(signature);
    return (
      expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer)
    );
  }
}
