import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "../../../../lib/server-session";

export const runtime = "nodejs";

const SESSION_COOKIE = "educai_session";

type AgentRunRequest = {
  mode?: string;
  grade?: string;
  subject?: string;
  topic?: string;
  duration?: string;
  prompt?: string;
};

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json(
      { code: "AGENT_SESSION_REQUIRED", message: "Sesion requerida" },
      { status: 401 },
    );
  }

  const apiUrl = process.env.EDUCAI_API_URL;
  if (!apiUrl) {
    return NextResponse.json(
      {
        code: "AGENT_API_NOT_CONFIGURED",
        message: "EDUCAI_API_URL no esta configurado: el agente debe pasar por la API NestJS",
      },
      { status: 503 },
    );
  }

  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json(
      { code: "AGENT_TOKEN_MISSING", message: "Sesion sin token" },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as AgentRunRequest;

  const upstream = await fetch(joinUrl(apiUrl, "/agent/run"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = await upstream.text();
  return new NextResponse(payload, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
}

function joinUrl(base: string, path: string): string {
  const trimmedBase = base.replace(/\/$/, "");
  const prefixedPath = path.startsWith("/") ? path : `/${path}`;
  return `${trimmedBase}${prefixedPath}`;
}
