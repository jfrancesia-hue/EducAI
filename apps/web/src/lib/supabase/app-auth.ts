import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { EDUCAI_ACCESS_TOKEN_COOKIE } from "./cookies";
import { createSupabaseServerClient } from "./server";

export type EducaiAppAuth = {
  accessToken: string;
  user: User | null;
};

export async function getEducaiAppAuth(): Promise<EducaiAppAuth> {
  const supabase = createSupabaseServerClient();
  const accessToken = cookies().get(EDUCAI_ACCESS_TOKEN_COOKIE)?.value ?? "";
  if (accessToken) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (!error && user) {
      return { accessToken, user };
    }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    return { accessToken: session.access_token, user: session.user };
  }

  return { accessToken: "", user: null };
}
