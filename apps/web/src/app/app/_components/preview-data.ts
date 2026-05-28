import type { fetchInstitutionalDashboard } from "../../../lib/api/institutional-dashboard";

type DashboardData = NonNullable<Awaited<ReturnType<typeof fetchInstitutionalDashboard>>>;

export const previewDashboard: DashboardData = {
  scope: "teacher",
  metrics: {
    studentCount: 28,
    lessonPlanCount: 12,
    diagnosticCompletionRate: 88,
    openHandoffCount: 3,
    learningMinutesThisWeek: 420,
    curriculumCount: 6,
  },
  lessonPlanQuota: {
    plan: "free",
    period: "monthly",
    used: 12,
    baseLimit: 20,
    extraCredits: 0,
    effectiveLimit: 20,
    remaining: 8,
  },
  recentLessonPlans: [
    {
      id: "demo-1",
      subject: "Ciencias Naturales",
      topic: "Ecosistemas",
      grade: 5,
      durationMinutes: 80,
      status: "Lista para revisar",
      generatedByAI: true,
      createdAt: "2026-05-28T10:00:00.000Z",
    },
    {
      id: "demo-2",
      subject: "Lengua",
      topic: "Comprensión lectora",
      grade: 4,
      durationMinutes: 60,
      status: "Borrador",
      generatedByAI: true,
      createdAt: "2026-05-27T10:00:00.000Z",
    },
    {
      id: "demo-3",
      subject: "Matemática",
      topic: "Fracciones equivalentes",
      grade: 6,
      durationMinutes: 45,
      status: "En progreso",
      generatedByAI: true,
      createdAt: "2026-05-26T10:00:00.000Z",
    },
  ],
  subjectMix: [
    { subject: "Lengua", count: 5 },
    { subject: "Matemática", count: 4 },
    { subject: "Ciencias", count: 3 },
  ],
  recentStudents: [
    {
      id: "s1",
      name: "Lucía Herrera",
      grade: 5,
      schoolName: "Escuela Piloto",
      diagnosticCompleted: true,
      learningStyle: "visual",
      strengths: ["participación", "lectura guiada"],
      opportunities: ["lectura inferencial", "organización de ideas"],
    },
    {
      id: "s2",
      name: "Mateo Díaz",
      grade: 6,
      schoolName: "Escuela Piloto",
      diagnosticCompleted: false,
      learningStyle: "práctico",
      strengths: ["trabajo en equipo"],
      opportunities: ["resolución de problemas"],
    },
    {
      id: "s3",
      name: "Sofía Robles",
      grade: 4,
      schoolName: "Escuela Piloto",
      diagnosticCompleted: true,
      learningStyle: "lectura",
      strengths: ["comprensión oral"],
      opportunities: [],
    },
  ],
};

export const previewProfile = {
  email: "docente@educai.demo",
  visibleName: "Docente EducAI",
  plan: "free",
  role: "TEACHER",
  schoolLinked: true,
  teacherLinked: true,
};
