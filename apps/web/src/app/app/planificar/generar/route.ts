import { NextResponse, type NextRequest } from "next/server";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";

import {
  EDUCAI_ACCESS_TOKEN_COOKIE,
  readCookieValue,
  setEducaiAccessTokenCookie,
} from "../../../../lib/supabase/cookies";
import { createSupabaseRouteClient } from "../../../../lib/supabase/route";

export const runtime = "nodejs";
export const maxDuration = 420;

const API_GENERATE_TIMEOUT_MS = 410_000;

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

type ApiErrorPayload = {
  code?: string | null;
  message?: string | null;
  reason?: string | null;
  status?: number;
};

type ApiResponse = {
  ok: boolean;
  status: number;
  bodyText: string;
};

function readApiError(response: ApiResponse): ApiErrorPayload {
  try {
    const body = JSON.parse(response.bodyText) as {
      code?: unknown;
      message?: unknown;
      reason?: unknown;
    };
    return {
      code: typeof body.code === "string" ? body.code : null,
      message: typeof body.message === "string" ? body.message : null,
      reason: typeof body.reason === "string" ? body.reason : null,
      status: response.status,
    };
  } catch {
    return { code: null, status: response.status };
  }
}

function postJsonToApi(url: string, accessToken: string, payload: unknown): Promise<ApiResponse> {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const body = Buffer.from(JSON.stringify(payload));
    const transport = target.protocol === "https:" ? httpsRequest : httpRequest;

    if (target.protocol !== "https:" && target.protocol !== "http:") {
      reject(new Error(`Unsupported API protocol: ${target.protocol}`));
      return;
    }

    const req = transport(
      target,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Content-Length": String(body.byteLength),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];

        res.on("data", (chunk: Buffer | string) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });

        res.on("end", () => {
          const status = res.statusCode ?? 0;
          resolve({
            ok: status >= 200 && status < 300,
            status,
            bodyText: Buffer.concat(chunks).toString("utf8"),
          });
        });

        res.on("error", reject);
      },
    );

    req.setTimeout(API_GENERATE_TIMEOUT_MS, () => {
      req.destroy(new Error(`API request timed out after ${API_GENERATE_TIMEOUT_MS}ms`));
    });
    req.on("error", reject);
    req.end(body);
  });
}

function readApiSuccessId(response: ApiResponse) {
  try {
    const body = JSON.parse(response.bodyText) as { data?: { id?: unknown } };
    return typeof body.data?.id === "string" ? body.data.id : "ok";
  } catch {
    return "ok";
  }
}

function describeNetworkError(error: unknown) {
  const record = error && typeof error === "object" ? (error as Record<string, unknown>) : {};
  const cause =
    record.cause && typeof record.cause === "object"
      ? (record.cause as Record<string, unknown>)
      : {};

  return {
    errorName: error instanceof Error ? error.name : readStringFromRecord(record, "name"),
    errorMessage:
      error instanceof Error
        ? error.message
        : (readStringFromRecord(record, "message") ?? "unknown"),
    causeName: readStringFromRecord(cause, "name"),
    causeMessage: readStringFromRecord(cause, "message"),
    causeCode: readStringFromRecord(cause, "code"),
    causeErrno: readStringFromRecord(cause, "errno"),
    causeSyscall: readStringFromRecord(cause, "syscall"),
  };
}

function readStringFromRecord(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
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
    session?.access_token ||
    readCookieValue(request.headers.get("cookie"), EDUCAI_ACCESS_TOKEN_COOKIE) ||
    readString(formData, "accessToken");

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
    courseId: readString(formData, "courseId") || undefined,
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

  const startedAt = Date.now();

  try {
    const response = await postJsonToApi(
      `${apiBaseUrl.replace(/\/$/u, "")}/lesson-plans/generate`,
      accessToken,
      payload,
    );
    if (!response.ok) {
      const apiError = readApiError(response);
      const code = apiError.code;
      console.error("lesson_plan_generate_api_failed", {
        status: response.status,
        elapsedMs: Date.now() - startedAt,
        code: apiError.code,
        reason: apiError.reason,
        message: apiError.message,
      });

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

    const planId = readApiSuccessId(response);
    console.warn("lesson_plan_generate_api_completed", {
      status: response.status,
      elapsedMs: Date.now() - startedAt,
      planId,
    });
    return withStableAuthCookies(redirectTo(request, { created: planId }));
  } catch (error) {
    console.error("lesson_plan_generate_network_failed", {
      elapsedMs: Date.now() - startedAt,
      ...describeNetworkError(error),
    });
    return withStableAuthCookies(redirectTo(request, { error: "network" }));
  }
}
