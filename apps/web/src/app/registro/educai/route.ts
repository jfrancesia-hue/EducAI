import { NextResponse } from "next/server";

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

  const response = await fetch(`${apiUrl.replace(/\/$/u, "")}/onboarding/educai/teachers`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      plan,
      email,
      password: read(formData, "password"),
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

  const url = new URL("/login", request.url);
  url.searchParams.set("registered", "educai");
  url.searchParams.set("email", email);
  return NextResponse.redirect(url, { status: 303 });
}
