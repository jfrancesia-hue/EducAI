export type InstitutionalDashboardResponse = {
  data: {
    scope: "teacher" | "institution";
    metrics: {
      studentCount: number;
      lessonPlanCount: number;
      curriculumCount: number;
      openHandoffCount: number;
      diagnosticCompletionRate: number;
      learningMinutesThisWeek: number;
    };
    recentStudents: Array<{
      id: string;
      name: string;
      grade: number;
      schoolName: string | null;
      diagnosticCompleted: boolean;
      learningStyle: string | null;
      strengths: string[];
      opportunities: string[];
    }>;
    recentLessonPlans: Array<{
      id: string;
      grade: number;
      subject: string;
      topic: string;
      status: string;
      durationMinutes: number;
      generatedByAI: boolean;
      createdAt: string;
    }>;
    lessonPlanQuota: {
      plan: string;
      period: "lifetime" | "monthly" | "unlimited";
      used: number;
      baseLimit: number | null;
      extraCredits: number;
      effectiveLimit: number | null;
      remaining: number | null;
    } | null;
    subjectMix: Array<{
      subject: string;
      count: number;
    }>;
  };
};

export async function fetchInstitutionalDashboard(
  accessToken: string,
): Promise<InstitutionalDashboardResponse["data"] | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return null;
  }

  const response = await fetch(`${apiUrl.replace(/\/$/u, "")}/dashboard/institutional`, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as InstitutionalDashboardResponse;
  return payload.data;
}
