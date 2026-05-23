import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "../../../lib/supabase/server";

function read(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function safeNext(request: Request, value: string) {
  const fallback = new URL("/login", request.url);
  if (!["/app/perfil", "/familia/perfil"].includes(value)) {
    return fallback;
  }

  return new URL(value, request.url);
}

function redirectWithStatus(request: Request, next: string, profile: string) {
  const url = safeNext(request, next);
  url.searchParams.set("profile", profile);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const next = read(formData, "next");
  const displayName = read(formData, "displayName");

  if (displayName.length < 2) {
    return redirectWithStatus(request, next, "short");
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      ...session.user.user_metadata,
      fullName: displayName,
      name: displayName,
    },
  });

  if (error) {
    return redirectWithStatus(request, next, "error");
  }

  return redirectWithStatus(request, next, "updated");
}
