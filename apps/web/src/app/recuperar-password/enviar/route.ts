import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "../../../lib/supabase/server";

function read(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = read(formData, "email");

  if (!email) {
    return NextResponse.redirect(new URL("/recuperar-password?status=missing", request.url), {
      status: 303,
    });
  }

  const supabase = createSupabaseServerClient();
  const redirectTo = new URL("/auth/callback", request.url);
  redirectTo.searchParams.set("next", "/cuenta/restablecer");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo.toString(),
  });

  if (error) {
    return NextResponse.redirect(new URL("/recuperar-password?status=error", request.url), {
      status: 303,
    });
  }

  return NextResponse.redirect(new URL("/recuperar-password?status=sent", request.url), {
    status: 303,
  });
}
