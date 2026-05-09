import { cookies } from "next/headers";

const SESSION_COOKIE = "educai_session";

export interface ApiClientOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

/**
 * Cliente server-side de la API NestJS de EducAI.
 *
 * Toma el token de sesion del cookie httpOnly y lo reenvia como Bearer.
 * Se usa solo desde Server Components, route handlers y server actions —
 * nunca desde cliente, porque el cookie es httpOnly.
 *
 * Lanza ApiClientError con codigo del backend en respuestas no 2xx.
 */
export async function apiFetch<T>(path: string, options: ApiClientOptions = {}): Promise<T> {
  const apiUrl = process.env.EDUCAI_API_URL;
  if (!apiUrl) {
    throw new ApiClientError(503, "API_NOT_CONFIGURED", "EDUCAI_API_URL no esta configurado");
  }

  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) {
    throw new ApiClientError(401, "SESSION_REQUIRED", "Sesion requerida");
  }

  const url = joinUrl(apiUrl, path);
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
    signal: options.signal,
  });

  const text = await response.text();
  const payload = text ? safeParse(text) : null;

  if (!response.ok) {
    const fallbackCode = `HTTP_${response.status}`;
    const code = pickStringField(payload, "code") ?? fallbackCode;
    const message = pickStringField(payload, "message") ?? response.statusText;
    throw new ApiClientError(response.status, code, message);
  }

  return payload as T;
}

function joinUrl(base: string, path: string): string {
  const trimmedBase = base.replace(/\/$/, "");
  const prefixedPath = path.startsWith("/") ? path : `/${path}`;
  return `${trimmedBase}${prefixedPath}`;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function pickStringField(payload: unknown, key: string): string | undefined {
  if (typeof payload !== "object" || payload === null) return undefined;
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}
