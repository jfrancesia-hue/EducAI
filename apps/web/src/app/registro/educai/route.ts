import { NextResponse } from "next/server";

import { signInWithPasswordRedirect } from "../../../lib/supabase/password-session";

function read(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return NextResponse.redirect(new URL("/registro?producto=educai&error=api", request.url), {
      status: 303,
    });
  }

  const formData = await request.formData();
  const plan = read(formData, "plan") || "free";
  const email = read(formData, "email");
  const password = read(formData, "password");
  const termsAccepted = read(formData, "termsAccepted") === "yes";

  if (!termsAccepted) {
    return NextResponse.redirect(
      new URL(`/registro?producto=educai&plan=${plan}&error=terms`, request.url),
      { status: 303 },
    );
  }

  const response = await fetch(`${apiUrl.replace(/\/$/u, "")}/onboarding/educai/teachers`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      plan,
      email,
      password,
      fullName: read(formData, "fullName"),
      schoolName: read(formData, "schoolName") || undefined,
      province: read(formData, "province") || undefined,
      city: read(formData, "city") || undefined,
      title: read(formData, "title") || undefined,
      subjects: read(formData, "subjects") || undefined,
    }),
  });

  if (!response.ok) {
    const url = new URL("/registro", request.url);
    url.searchParams.set("producto", "educai");
    url.searchParams.set("plan", plan);
    url.searchParams.set("error", response.status === 409 ? "exists" : "signup");
    return NextResponse.redirect(url, { status: 303 });
  }

  const redirectUrl = new URL("/app", request.url);
  const auth = await signInWithPasswordRedirect(request, { email, password, redirectUrl });
  if (auth) {
    return auth.response;
  }

  const url = new URL("/login", request.url);
  url.searchParams.set("registered", "educai");
  url.searchParams.set("email", email);
  url.searchParams.set("next", "/app");
  return NextResponse.redirect(url, { status: 303 });
}
