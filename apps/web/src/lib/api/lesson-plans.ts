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
  rating?: number | null;
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

  const url = `${apiUrl.replace(/\/$/u, "")}/lesson-plans/${id}`;
  let response: Response | null = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      response = await fetch(url, {
        headers: { authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });

      if (response.ok || response.status < 500) {
        break;
      }
    } catch {
      response = null;
    }

    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    }
  }

  if (!response?.ok) {
    return null;
  }

  const payload = (await response.json()) as LessonPlanResponse;
  return payload.data;
}
