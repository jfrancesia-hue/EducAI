import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "../../../../lib/supabase/server";

const GOOGLE_SIGNUP_COOKIE = "educai_google_signup";

type PendingGoogleSignup =
  | {
      product: "educai";
      plan: string;
      fullName: string;
      schoolName?: string;
      province?: string;
      city?: string;
      title?: string;
      subjects?: string;
    }
  | {
      product: "apoyoai";
      plan: string;
      parentFullName: string;
      parentWhatsappPhone: string;
      studentFirstName: string;
      studentLastName: string;
      studentGrade: string;
      studentWhatsappPhone?: string;
    };

type RegisterResponse = {
  data?: {
    nextStep?: string;
    checkout?: {
      checkoutUrl?: string;
    } | null;
  };
};

function decode(value: string): PendingGoogleSignup | null {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as PendingGoogleSignup;
  } catch {
    return null;
  }
}

function redirectWithClearedCookie(url: URL) {
  const response = NextResponse.redirect(url, { status: 303 });
  response.cookies.set(GOOGLE_SIGNUP_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}

export async function GET(request: Request) {
  const cookieStore = cookies();
  const pending = decode(cookieStore.get(GOOGLE_SIGNUP_COOKIE)?.value ?? "");
  if (!pending) {
    return redirectWithClearedCookie(new URL("/registro?error=signup", request.url));
  }

  if (pending.product === "educai" && pending.plan !== "free") {
    return redirectWithClearedCookie(
      new URL(`/contacto?producto=educai&plan=${encodeURIComponent(pending.plan)}`, request.url),
    );
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return redirectWithClearedCookie(
      new URL(`/registro?producto=${pending.product}&plan=${pending.plan}&error=api`, request.url),
    );
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return redirectWithClearedCookie(
      new URL(`/login?next=/registro/google/finalizar`, request.url),
    );
  }

  const endpoint =
    pending.product === "educai"
      ? "/onboarding/educai/teachers/google"
      : "/onboarding/apoyoai/families/google";
  const body =
    pending.product === "educai"
      ? {
          plan: pending.plan,
          fullName: pending.fullName,
          schoolName: pending.schoolName || undefined,
          province: pending.province || undefined,
          city: pending.city || undefined,
          title: pending.title || undefined,
          subjects: pending.subjects || undefined,
        }
      : {
          plan: pending.plan,
          parentFullName: pending.parentFullName,
          parentWhatsappPhone: pending.parentWhatsappPhone,
          students: [
            {
              firstName: pending.studentFirstName,
              lastName: pending.studentLastName,
              grade: Number(pending.studentGrade),
              whatsappPhone: pending.studentWhatsappPhone || undefined,
            },
          ],
        };

  const response = await fetch(`${apiUrl.replace(/\/$/u, "")}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    return redirectWithClearedCookie(
      new URL(
        `/registro?producto=${pending.product}&plan=${pending.plan}&error=${
          response.status === 409 ? "exists" : "signup"
        }`,
        request.url,
      ),
    );
  }

  const payload = (await response.json()) as RegisterResponse;
  if (
    payload.data?.nextStep === "mercadopago_checkout_pending" &&
    payload.data.checkout?.checkoutUrl
  ) {
    return redirectWithClearedCookie(new URL(payload.data.checkout.checkoutUrl));
  }
  if (
    payload.data?.nextStep === "mercadopago_checkout_pending" ||
    payload.data?.nextStep === "payment_unavailable"
  ) {
    return redirectWithClearedCookie(
      new URL(
        `/registro?producto=${pending.product}&plan=${pending.plan}&error=payment`,
        request.url,
      ),
    );
  }

  if (pending.product === "apoyoai") {
    return redirectWithClearedCookie(new URL("/familia", request.url));
  }

  return redirectWithClearedCookie(new URL("/app", request.url));
}
