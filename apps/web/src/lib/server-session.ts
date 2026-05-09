import { cookies } from "next/headers";
import { getSessionSecret, verifySessionJwt, type SessionJwtPayload } from "./session-jwt";

const SESSION_COOKIE = "educai_session";
const FOUNDER_EMAIL = "jfrancesia@gmail.com";

export async function getServerSession(): Promise<SessionJwtPayload | null> {
  const secret = getSessionSecret();
  const token = cookies().get(SESSION_COOKIE)?.value;

  if (!secret || !token) {
    return null;
  }

  return verifySessionJwt(token, secret);
}

export function isAdminSession(session: SessionJwtPayload | null): boolean {
  const founderEmail = (process.env.EDUCAI_FOUNDER_EMAIL ?? FOUNDER_EMAIL).toLowerCase();
  const sessionEmail = (session?.email ?? session?.sub ?? "").toLowerCase();
  return session?.role === "SUPER_ADMIN" && sessionEmail === founderEmail;
}
