export type EducAiRole = "MINISTRY" | "SCHOOL_ADMIN" | "TEACHER" | "PARENT";

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  role?: EducAiRole;
  tenantId?: string;
  familyId?: string;
  schoolId?: string;
  teacherId?: string;
}

export interface AuthenticatedRequest {
  user?: AuthenticatedUser;
  headers: Record<string, string | string[] | undefined>;
  params?: Record<string, string | undefined>;
}
