import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";

import { getSupabaseEnv } from "../../../lib/supabase/env";

const GOOGLE_SIGNUP_COOKIE = "educai_google_signup";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

function read(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function redirectToRegister(request: Request, product: string, plan: string, error: string) {
  const url = new URL("/registro", request.url);
  url.searchParams.set("producto", product);
  url.searchParams.set("plan", plan);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const product = read(formData, "producto");
  const plan = read(formData, "plan") || "free";
  const termsAccepted = read(formData, "termsAccepted") === "yes";

  if (!["educai", "apoyoai"].includes(product)) {
    return redirectToRegister(request, "educai", plan, "signup");
  }

  if (!termsAccepted) {
    return redirectToRegister(request, product, plan, "terms");
  }

  if (product === "educai" && plan !== "free") {
    return NextResponse.redirect(
      new URL(`/contacto?producto=educai&plan=${encodeURIComponent(plan)}`, request.url),
      { status: 303 },
    );
  }

  const payload =
    product === "educai"
      ? {
          product,
          plan,
          fullName: read(formData, "fullName"),
          schoolName: read(formData, "schoolName"),
          province: read(formData, "province"),
          city: read(formData, "city"),
          title: read(formData, "title"),
          subjects: read(formData, "subjects"),
        }
      : {
          product,
          plan,
          parentFullName: read(formData, "parentFullName"),
          parentWhatsappPhone: read(formData, "parentWhatsappPhone"),
          studentFirstName: read(formData, "studentFirstName"),
          studentLastName: read(formData, "studentLastName"),
          studentGrade: read(formData, "studentGrade"),
          studentWhatsappPhone: read(formData, "studentWhatsappPhone"),
        };

  const { url, anonKey } = getSupabaseEnv();
  const cookiesToSet: CookieToSet[] = [];
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll(nextCookies: CookieToSet[]) {
        cookiesToSet.push(...nextCookies);
      },
    },
  });

  const origin = new URL(request.url).origin;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=/registro/google/finalizar`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data.url) {
    return redirectToRegister(request, product, plan, "google");
  }

  const response = NextResponse.redirect(data.url, { status: 303 });
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  response.cookies.set(GOOGLE_SIGNUP_COOKIE, encode(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:",
    path: "/",
    maxAge: 10 * 60,
  });

  return response;
}
