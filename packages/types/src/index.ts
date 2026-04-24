export type UserRole =
  | "SUPER_ADMIN"
  | "MINISTRY"
  | "SCHOOL_ADMIN"
  | "COORDINATOR"
  | "TEACHER"
  | "PARENT"
  | "STUDENT";

export type TenantType = "SCHOOL" | "FAMILY" | "MINISTRY";

export type Locale = "es-AR" | "es-419" | "pt-BR" | "en-US" | "qu" | "gn";

export interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, string | number | boolean>;
}

export interface StudentProgress {
  studentId: string;
  completedSessions: number;
  minutesThisWeek: number;
  strengths: string[];
  opportunities: string[];
}

export interface TutorResponse {
  content: string;
  tokensUsed: number;
  modelUsed: string;
  competences: string[];
  safety: {
    status: "safe" | "monitor" | "escalate";
    signals: string[];
  };
}

