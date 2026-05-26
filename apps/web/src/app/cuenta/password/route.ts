import { NextResponse } from "next/server";

import { createSupabaseRouteClient } from "../../../lib/supabase/route";

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

function redirectWithStatus(request: Request, next: string, params: Record<string, string>) {
  const url = safeNext(request, next);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const next = read(formData, "next");
  const password = read(formData, "password");
  const confirmPassword = read(formData, "confirmPassword");

  if (!password || password.length < 8) {
    return redirectWithStatus(request, next, { password: "short" });
  }

  if (password !== confirmPassword) {
    return redirectWithStatus(request, next, { password: "mismatch" });
  }

  const { supabase, withAuthCookies } = createSupabaseRouteClient(request);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return withAuthCookies(NextResponse.redirect(new URL("/login", request.url), { status: 303 }));
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return withAuthCookies(redirectWithStatus(request, next, { password: "error" }));
  }

  return withAuthCookies(redirectWithStatus(request, next, { password: "updated" }));
}
