import { NextResponse } from "next/server";

import { fetchFamilyStudents } from "../../../../lib/api/family-students";
import { extractRoleFromMetadata } from "../../../../lib/supabase/roles";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

const FAMILY_PLAN_LIMITS: Record<string, number> = {
  free: 1,
  basico: 1,
  plus: 1,
  familiar: 3,
  intensivo: 3,
};

function read(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectToFamily(request: Request, student: string) {
  const url = new URL("/familia", request.url);
  url.searchParams.set("student", student);
  return NextResponse.redirect(url, { status: 303 });
}

function metadataValue(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object") {
    return "";
  }

  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(new URL("/login?next=/familia", request.url), { status: 303 });
  }

  const role =
    extractRoleFromMetadata(session.user.app_metadata) ??
    extractRoleFromMetadata(session.user.user_metadata);

  if (role !== "PARENT") {
    return NextResponse.redirect(new URL("/app", request.url), { status: 303 });
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return redirectToFamily(request, "api");
  }

  const formData = await request.formData();
  const firstName = read(formData, "firstName");
  const lastName = read(formData, "lastName");
  const grade = Number(read(formData, "grade"));

  if (!firstName || !lastName || !Number.isInteger(grade) || grade < 1 || grade > 12) {
    return redirectToFamily(request, "invalid");
  }

  const plan = metadataValue(session.user.app_metadata, "plan") || "free";
  const maxChildren = FAMILY_PLAN_LIMITS[plan] ?? 1;
  const { students } = await fetchFamilyStudents(session.access_token);
  if (students.length >= maxChildren) {
    return redirectToFamily(request, "limit");
  }

  const response = await fetch(`${apiUrl.replace(/\/$/u, "")}/students`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${session.access_token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      firstName,
      lastName,
      grade,
      whatsappPhone: read(formData, "studentWhatsappPhone") || undefined,
      parentWhatsappPhone: read(formData, "parentWhatsappPhone") || undefined,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return redirectToFamily(request, "error");
  }

  return redirectToFamily(request, "created");
}
