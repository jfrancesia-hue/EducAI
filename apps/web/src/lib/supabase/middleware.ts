import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

import {
  EDUCAI_ACCESS_TOKEN_COOKIE,
  clearLegacySharedCookiesOnce,
  parseCookieHeader,
  readCookieValue,
  setEducaiAccessTokenCookie,
  setSupabaseAuthResponseCookie,
} from "./cookies";
import { hasSupabaseEnv } from "./env";
import { accessTokenClaimsToUser, isAccessTokenUsable } from "./access-token";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

// Si al token local le queda más de este margen, evitamos la llamada de red a
// Supabase (getUser): una conexión móvil lenta o intermitente ya no agrega
// latencia ("demora mucho en entrar") ni desloguea por un bache de red. Solo
// refrescamos contra Supabase cuando el token está por vencer.
const REFRESH_THRESHOLD_SECONDS = 5 * 60;

export async function updateSession(request: NextRequest): Promise<{
  response: NextResponse;
  user: User | null;
}> {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-educai-pathname", request.nextUrl.pathname);
  const cookieHeader = request.headers.get("cookie");
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Limpieza única (no en cada request) de cookies legacy del dominio compartido.
  clearLegacySharedCookiesOnce(response, cookieHeader);

  if (!hasSupabaseEnv()) {
    return { response, user: null };
  }

  const localToken = readCookieValue(cookieHeader, EDUCAI_ACCESS_TOKEN_COOKIE);
  const localCheck = isAccessTokenUsable(localToken);

  // Fast path: token local sano y lejos de vencer → seguimos sin tocar la red.
  // Esto arregla la lentitud y los deslogueos por red intermitente en mobile.
  if (
    localCheck.usable &&
    localCheck.claims &&
    localCheck.secondsRemaining > REFRESH_THRESHOLD_SECONDS
  ) {
    return { response, user: accessTokenClaimsToUser(localCheck.claims) };
  }

  // Token ausente o por vencer → refrescamos contra Supabase (red, best-effort).
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(cookieHeader);
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            setSupabaseAuthResponseCookie(response, name, value, options);
          });
        },
      },
    },
  );

  let user: User | null = null;
  try {
    const {
      data: { user: networkUser },
    } = await supabase.auth.getUser();
    user = networkUser;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      setEducaiAccessTokenCookie(response, session.access_token, session.expires_in);
    }
  } catch {
    // Falla de red (típica en mobile con señal floja): no desloguear todavía;
    // se decide abajo según el token local.
    user = null;
  }

  // Si la red no devolvió usuario pero el token local sigue vigente, mantenemos
  // la sesión en lugar de mandar a /login por un problema transitorio.
  if (!user && localCheck.usable && localCheck.claims) {
    user = accessTokenClaimsToUser(localCheck.claims);
  }

  return { response, user };
}
