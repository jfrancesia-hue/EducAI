import { NextResponse, type NextRequest } from "next/server";

import {
  EDUCAI_ACCESS_TOKEN_COOKIE,
  readCookieValue,
  setEducaiAccessTokenCookie,
} from "../../../../lib/supabase/cookies";
import { createSupabaseRouteClient } from "../../../../lib/supabase/route";

export const maxDuration = 420;

const GRADE_RANGES: Record<string, { min: number; max: number }> = {
  primaria: { min: 1, max: 7 },
  secundaria: { min: 1, max: 7 },
  terciario: { min: 1, max: 5 },
  universitario: { min: 1, max: 8 },
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readInteger(formData: FormData, key: string) {
  const value = Number.parseInt(readString(formData, key), 10);
  return Number.isFinite(value) ? value : Number.NaN;
}

function redirectTo(request: NextRequest, params: Record<string, string>) {
  const url = new URL("/app/planificar", request.url);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return NextResponse.redirect(url, { status: 303 });
}

function withAccessTokenCookie<T extends NextResponse>(response: T, accessToken: string) {
  setEducaiAccessTokenCookie(response, accessToken);
  return response;
}

async function readApiErrorCode(response: Response) {
  try {
    const body = (await response.json()) as { code?: unknown };
    return typeof body.code === "string" ? body.code : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!apiBaseUrl) {
    return redirectTo(request, { error: "config" });
  }

  const formData = await request.formData();
  const { supabase, withAuthCookies } = createSupabaseRouteClient(request);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const accessToken =
    readString(formData, "accessToken") ||
    readCookieValue(request.headers.get("cookie"), EDUCAI_ACCESS_TOKEN_COOKIE) ||
    session?.access_token;

  if (!accessToken) {
    return withAuthCookies(redirectTo(request, { error: "auth" }));
  }
  const withStableAuthCookies = <T extends NextResponse>(response: T) =>
    withAccessTokenCookie(withAuthCookies(response), accessToken);

  const payload = {
    educationLevel: readString(formData, "educationLevel"),
    grade: readInteger(formData, "grade"),
    subject: readString(formData, "subject"),
    courseLabel: readString(formData, "courseLabel") || undefined,
    institutionName: readString(formData, "institutionName") || undefined,
    lessonIntent: readString(formData, "lessonIntent") || undefined,
    levelContext: readString(formData, "levelContext") || undefined,
    plannedDate: readString(formData, "plannedDate") || undefined,
    careerName:
      readString(formData, "educationLevel") === "universitario"
        ? readString(formData, "careerName") || undefined
        : undefined,
    topic: readString(formData, "topic"),
    sessionCount: readInteger(formData, "sessionCount"),
    totalDurationMinutes: readInteger(formData, "totalDurationMinutes"),
    learningGoal: readString(formData, "learningGoal") || undefined,
    groupProfile: readString(formData, "groupProfile") || undefined,
    priorKnowledge: readString(formData, "priorKnowledge") || undefined,
    curriculumContext: readString(formData, "curriculumContext") || undefined,
    availableResources: readString(formData, "availableResources") || undefined,
    assessmentFocus: readString(formData, "assessmentFocus") || undefined,
    inclusionNeeds: readString(formData, "inclusionNeeds") || undefined,
    outputFormat: readString(formData, "outputFormat") || undefined,
  };
  const gradeRange = GRADE_RANGES[payload.educationLevel];

  if (
    !gradeRange ||
    (payload.educationLevel === "universitario" && !payload.careerName) ||
    payload.grade < gradeRange.min ||
    payload.grade > gradeRange.max ||
    !payload.subject ||
    !payload.topic ||
    payload.sessionCount < 1 ||
    payload.sessionCount > 10 ||
    payload.totalDurationMinutes < 10 ||
    payload.totalDurationMinutes > 600
  ) {
    return withStableAuthCookies(redirectTo(request, { error: "invalid" }));
  }

  try {
    const response = await fetch(`${apiBaseUrl.replace(/\/$/u, "")}/lesson-plans/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      const code = await readApiErrorCode(response);
      if (code === "TEACHER_PROFILE_MISSING") {
        return withStableAuthCookies(redirectTo(request, { error: "teacher_profile" }));
      }

      if (code === "LESSON_PLAN_QUOTA_EXCEEDED") {
        return withStableAuthCookies(redirectTo(request, { error: "quota" }));
      }

      if (code === "LESSON_PLAN_AI_UNAVAILABLE") {
        return withStableAuthCookies(redirectTo(request, { error: "ai_unavailable" }));
      }

      return withStableAuthCookies(redirectTo(request, { error: "api" }));
    }

    const body = (await response.json()) as { data?: { id?: string } };
    return withStableAuthCookies(redirectTo(request, { created: body.data?.id ?? "ok" }));
  } catch {
    return withStableAuthCookies(redirectTo(request, { error: "network" }));
  }
}
