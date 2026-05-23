import { NextResponse } from "next/server";

import { extractRoleFromMetadata } from "../../../../lib/supabase/roles";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

type TutorPayload = {
  studentId?: string;
  message?: string;
  subject?: string;
};

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const role =
    extractRoleFromMetadata(session.user.app_metadata) ??
    extractRoleFromMetadata(session.user.user_metadata);

  if (role !== "PARENT") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return NextResponse.json({ error: "api_unavailable" }, { status: 503 });
  }

  const payload = (await request.json().catch(() => ({}))) as TutorPayload;
  const studentId = payload.studentId?.trim();
  const message = payload.message?.trim();

  if (!studentId || !message || message.length < 2) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const response = await fetch(`${apiUrl.replace(/\/$/u, "")}/students/${studentId}/tutor`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${session.access_token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      message,
      subject: payload.subject?.trim() || undefined,
    }),
    cache: "no-store",
  });

  const body = (await response.json().catch(() => ({}))) as unknown;
  return NextResponse.json(body, { status: response.status });
}
