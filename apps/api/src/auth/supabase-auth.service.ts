import { Injectable, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

import type { AuthenticatedUser, EducAiRole } from "./authenticated-user.js";

@Injectable()
export class SupabaseAuthService {
  private client?: SupabaseClient;

  async authenticate(accessToken: string): Promise<AuthenticatedUser> {
    const client = this.getClient();
    const { data, error } = await client.auth.getUser(accessToken);

    if (error || !data.user) {
      throw new UnauthorizedException("Token de acceso invalido o expirado");
    }

    return this.mapUser(data.user);
  }

  private getClient(): SupabaseClient {
    if (this.client) {
      return this.client;
    }

    const url = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      throw new ServiceUnavailableException(
        "Supabase auth no esta configurado en el API (faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY)",
      );
    }

    this.client = createClient(url, serviceRoleKey, {
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
    };
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
