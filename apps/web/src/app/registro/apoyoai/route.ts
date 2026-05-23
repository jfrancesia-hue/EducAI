import { NextResponse } from "next/server";

import { signInWithPasswordRedirect } from "../../../lib/supabase/password-session";

function read(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

type ApoyoAiRegisterResponse = {
  data?: {
    nextStep?: string;
    checkout?: {
      checkoutUrl?: string;
    } | null;
  };
};

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
  const password = read(formData, "password");
  const termsAccepted = read(formData, "termsAccepted") === "yes";

  if (!termsAccepted) {
    return NextResponse.redirect(
      new URL(`/registro?producto=apoyoai&plan=${plan}&error=terms`, request.url),
      { status: 303 },
    );
  }

  const response = await fetch(`${apiUrl.replace(/\/$/u, "")}/onboarding/apoyoai/families`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      plan,
      parentEmail,
      password,
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

  const body = (await response.json()) as ApoyoAiRegisterResponse;
  if (body.data?.nextStep === "mercadopago_checkout_pending" && body.data.checkout?.checkoutUrl) {
    return NextResponse.redirect(body.data.checkout.checkoutUrl, { status: 303 });
  }

  const redirectUrl = new URL("/familia", request.url);
  const auth = await signInWithPasswordRedirect(request, {
    email: parentEmail,
    password,
    redirectUrl,
  });
  if (auth) {
    return auth.response;
  }

  const url = new URL("/login", request.url);
  url.searchParams.set("registered", "apoyoai");
  url.searchParams.set("email", parentEmail);
  if (body.data?.nextStep === "mercadopago_checkout_pending") {
    url.searchParams.set("payment", "pending");
  }
  return NextResponse.redirect(url, { status: 303 });
}
