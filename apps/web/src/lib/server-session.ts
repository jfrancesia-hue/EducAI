import { cookies } from "next/headers";
import { getSessionSecret, verifySessionJwt, type SessionJwtPayload } from "./session-jwt";

const SESSION_COOKIE = "educai_session";

export async function getServerSession(): Promise<SessionJwtPayload | null> {
  const secret = getSessionSecret();
  const token = cookies().get(SESSION_COOKIE)?.value;

  if (!secret || !token) {
    return null;
  }

  return verifySessionJwt(token, secret);
}

export function isAdminSession(session: SessionJwtPayload | null): boolean {
  return ["SUPER_ADMIN", "MINISTRY", "SCHOOL_ADMIN"].includes(session?.role ?? "");
}
