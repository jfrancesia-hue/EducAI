import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "../../../../lib/supabase/server";

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

export async function POST(request: NextRequest) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!apiBaseUrl) {
    return redirectTo(request, { error: "config" });
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return redirectTo(request, { error: "auth" });
  }

  const formData = await request.formData();
  const payload = {
    grade: readInteger(formData, "grade"),
    subject: readString(formData, "subject"),
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

  if (
    payload.grade < 1 ||
    payload.grade > 12 ||
    !payload.subject ||
    !payload.topic ||
    payload.sessionCount < 1 ||
    payload.sessionCount > 10 ||
    payload.totalDurationMinutes < 10 ||
    payload.totalDurationMinutes > 600
  ) {
    return redirectTo(request, { error: "invalid" });
  }

  try {
    const response = await fetch(`${apiBaseUrl.replace(/\/$/u, "")}/lesson-plans/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      return redirectTo(request, { error: "api" });
    }

    const body = (await response.json()) as { data?: { id?: string } };
    return redirectTo(request, { created: body.data?.id ?? "ok" });
  } catch {
    return redirectTo(request, { error: "network" });
  }
}
