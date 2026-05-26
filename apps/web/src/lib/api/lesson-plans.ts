export type LessonPlanDetail = {
  id: string;
  grade: number;
  subject: string;
  topic: string;
  status: string;
  durationMinutes: number;
  competences: string[];
  objectives: unknown;
  activities: unknown;
  resources: unknown;
  assessment: unknown;
  adaptations: unknown;
  generatedByAI: boolean;
  createdAt: string;
  updatedAt: string;
};

type LessonPlanResponse = {
  data: LessonPlanDetail;
};

export async function fetchLessonPlan(
  accessToken: string,
  id: string,
): Promise<LessonPlanDetail | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || id === "ok") {
    return null;
  }

  const response = await fetch(`${apiUrl.replace(/\/$/u, "")}/lesson-plans/${id}`, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as LessonPlanResponse;
  return payload.data;
}
