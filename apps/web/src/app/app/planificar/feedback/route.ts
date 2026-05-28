import { NextResponse, type NextRequest } from "next/server";

import {
  EDUCAI_ACCESS_TOKEN_COOKIE,
  readCookieValue,
  setEducaiAccessTokenCookie,
} from "../../../../lib/supabase/cookies";
import { createSupabaseRouteClient } from "../../../../lib/supabase/route";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectTo(request: NextRequest, planId: string, params: Record<string, string>) {
  const url = new URL("/app/planificar", request.url);
  url.searchParams.set("created", planId);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: NextRequest) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  const formData = await request.formData();
  const planId = readString(formData, "planId");
  const rating = Number.parseInt(readString(formData, "rating"), 10);
  const comment = readString(formData, "comment");

  if (!apiBaseUrl || !planId || rating < 1 || rating > 5) {
    return redirectTo(request, planId || "ok", { feedback: "invalid" });
  }

  const { supabase, withAuthCookies } = createSupabaseRouteClient(request);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const accessToken =
    readCookieValue(request.headers.get("cookie"), EDUCAI_ACCESS_TOKEN_COOKIE) ||
    session?.access_token;

  if (!accessToken) {
    return withAuthCookies(redirectTo(request, planId, { feedback: "auth" }));
  }

  try {
    const response = await fetch(
      `${apiBaseUrl.replace(/\/$/u, "")}/lesson-plans/${encodeURIComponent(planId)}/feedback`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating, comment: comment || undefined }),
        cache: "no-store",
      },
    );

    const redirect = redirectTo(request, planId, {
      feedback: response.ok ? "saved" : "error",
    });
    setEducaiAccessTokenCookie(redirect, accessToken);
    return withAuthCookies(redirect);
  } catch {
    return withAuthCookies(redirectTo(request, planId, { feedback: "error" }));
  }
}
