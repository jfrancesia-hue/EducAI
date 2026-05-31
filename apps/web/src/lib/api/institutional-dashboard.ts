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

export type PlanningDashboardResponse = {
  data: {
    scope: "teacher" | "institution";
    metrics: {
      lessonPlanCount: number;
    };
    recentLessonPlans: InstitutionalDashboardResponse["data"]["recentLessonPlans"];
    lessonPlanQuota: InstitutionalDashboardResponse["data"]["lessonPlanQuota"];
  };
};

export type StudentsDashboardResponse = {
  data: {
    scope: "teacher" | "institution";
    metrics: Pick<
      InstitutionalDashboardResponse["data"]["metrics"],
      "studentCount" | "diagnosticCompletionRate" | "learningMinutesThisWeek"
    >;
    recentStudents: InstitutionalDashboardResponse["data"]["recentStudents"];
  };
};

export type ReportsDashboardResponse = {
  data: {
    scope: "teacher" | "institution";
    metrics: Pick<
      InstitutionalDashboardResponse["data"]["metrics"],
      | "studentCount"
      | "lessonPlanCount"
      | "curriculumCount"
      | "openHandoffCount"
      | "diagnosticCompletionRate"
      | "learningMinutesThisWeek"
    >;
    recentStudents: InstitutionalDashboardResponse["data"]["recentStudents"];
    subjectMix: InstitutionalDashboardResponse["data"]["subjectMix"];
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

export async function fetchPlanningDashboard(
  accessToken: string,
): Promise<PlanningDashboardResponse["data"] | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return null;
  }

  const response = await fetch(`${apiUrl.replace(/\/$/u, "")}/dashboard/planning`, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as PlanningDashboardResponse;
  return payload.data;
}

export async function fetchStudentsDashboard(
  accessToken: string,
): Promise<StudentsDashboardResponse["data"] | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return null;
  }

  const response = await fetch(`${apiUrl.replace(/\/$/u, "")}/dashboard/students`, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as StudentsDashboardResponse;
  return payload.data;
}

export async function fetchReportsDashboard(
  accessToken: string,
): Promise<ReportsDashboardResponse["data"] | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return null;
  }

  const response = await fetch(`${apiUrl.replace(/\/$/u, "")}/dashboard/reports`, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as ReportsDashboardResponse;
  return payload.data;
}
