import { NextResponse } from "next/server";

function read(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return NextResponse.redirect(new URL("/registro?producto=apoyoai&error=api", request.url), {
      status: 303,
    });
  }

  const formData = await request.formData();
  const plan = read(formData, "plan") || "free";
  const parentEmail = read(formData, "parentEmail");

  const response = await fetch(`${apiUrl.replace(/\/$/u, "")}/onboarding/apoyoai/families`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      plan,
      parentEmail,
      password: read(formData, "password"),
      parentFullName: read(formData, "parentFullName"),
      parentWhatsappPhone: read(formData, "parentWhatsappPhone"),
      students: [
        {
          firstName: read(formData, "studentFirstName"),
          lastName: read(formData, "studentLastName"),
          grade: Number(read(formData, "studentGrade")),
          whatsappPhone: read(formData, "studentWhatsappPhone") || undefined,
        },
      ],
    }),
  });

  if (!response.ok) {
    const url = new URL("/registro", request.url);
    url.searchParams.set("producto", "apoyoai");
    url.searchParams.set("plan", plan);
    url.searchParams.set("error", response.status === 409 ? "exists" : "signup");
    return NextResponse.redirect(url, { status: 303 });
  }

  const url = new URL("/login", request.url);
  url.searchParams.set("registered", "apoyoai");
  url.searchParams.set("email", parentEmail);
  return NextResponse.redirect(url, { status: 303 });
}
