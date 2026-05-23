import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "../../../../lib/supabase/server";

function read(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectToReset(request: Request, password: string) {
  const url = new URL("/cuenta/restablecer", request.url);
  url.searchParams.set("password", password);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = read(formData, "password");
  const confirmPassword = read(formData, "confirmPassword");

  if (!password || password.length < 8) {
    return redirectToReset(request, "short");
  }

  if (password !== confirmPassword) {
    return redirectToReset(request, "mismatch");
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(new URL("/login?error=invalid", request.url), { status: 303 });
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return redirectToReset(request, "error");
  }

  return NextResponse.redirect(new URL("/login?password=updated", request.url), { status: 303 });
}
