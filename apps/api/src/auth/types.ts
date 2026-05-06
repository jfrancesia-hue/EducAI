export type AuthenticatedRole =
  | "SUPER_ADMIN"
  | "MINISTRY"
  | "SCHOOL_ADMIN"
  | "COORDINATOR"
  | "TEACHER"
  | "PARENT"
  | "STUDENT";

const AUTHENTICATED_ROLES = new Set<string>([
  "SUPER_ADMIN",
  "MINISTRY",
  "SCHOOL_ADMIN",
  "COORDINATOR",
  "TEACHER",
  "PARENT",
  "STUDENT",
]);

export interface AuthenticatedUser {
  sub: string;
  tenantId: string;
  role: AuthenticatedRole;
  familyId?: string;
  schoolId?: string;
  teacherId?: string;
}

export interface AuthenticatedRequest {
  headers: Record<string, string | string[] | undefined>;
  user: AuthenticatedUser;
}

export function isElevatedRole(user: AuthenticatedUser): boolean {
  return ["SUPER_ADMIN", "MINISTRY", "SCHOOL_ADMIN", "COORDINATOR"].includes(user.role);
}

export function isAuthenticatedRole(role: string | undefined): role is AuthenticatedRole {
  return role != null && AUTHENTICATED_ROLES.has(role);
}
