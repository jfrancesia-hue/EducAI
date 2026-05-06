import { NextResponse } from "next/server";
import { loadAdminMetrics } from "../../../../lib/admin-metrics";
import { getServerSession, isAdminSession } from "../../../../lib/server-session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession();
  if (!isAdminSession(session)) {
    return NextResponse.json(
      { code: "ADMIN_SESSION_REQUIRED", message: "Sesion admin requerida" },
      { status: 401 },
    );
  }

  const metrics = await loadAdminMetrics();
  return NextResponse.json(metrics);
}
