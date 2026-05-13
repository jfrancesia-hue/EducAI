export type EducAiRole = "SUPER_ADMIN" | "MINISTRY" | "SCHOOL_ADMIN" | "TEACHER" | "PARENT";

export function extractRoleFromMetadata(metadata: unknown): EducAiRole | undefined {
  if (!metadata || typeof metadata !== "object") {
    return undefined;
  }

  const role = (metadata as Record<string, unknown>).role;

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
