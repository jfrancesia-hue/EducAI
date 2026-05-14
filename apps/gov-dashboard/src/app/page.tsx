import Link from "next/link";
import { revalidatePath } from "next/cache";

import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@educai/ui";
import { getApiBaseUrl, hasApiBaseUrl } from "../lib/api";
import { hasSupabaseEnv } from "../lib/supabase/env";
import { createSupabaseServerClient } from "../lib/supabase/server";

type HandoffRecord = {
  id: string;
  conversationId: string | null;
  createdAt: string;
  status: string;
  source: string | null;
  reason: string | null;
  studentId: string | null;
  studentProfileId: string | null;
  familyId: string | null;
  whatsappPhone: string | null;
  inboundMessage: string | null;
  outboundMessage: string | null;
  requestedAt: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolutionNote: string | null;
};

async function fetchOpenHandoffs(): Promise<HandoffRecord[]> {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return [];
  }

  const response = await fetch(`${getApiBaseUrl()}/handoffs`, {
    headers: {
      authorization: `Bearer ${session.access_token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`No se pudo cargar la cola de handoffs (${response.status})`);
  }

  const payload = (await response.json()) as { data?: HandoffRecord[] };
  return payload.data ?? [];
}

async function closeHandoff(formData: FormData) {
  "use server";

  const handoffId = formData.get("handoffId");
  const resolutionNote = formData.get("resolutionNote");

  if (typeof handoffId !== "string" || !handoffId.trim()) {
    return;
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("La sesión expiró antes de cerrar el handoff.");
  }

  const response = await fetch(`${getApiBaseUrl()}/handoffs/${handoffId}/close`, {
    method: "PATCH",
    headers: {
      authorization: `Bearer ${session.access_token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      resolutionNote: typeof resolutionNote === "string" ? resolutionNote.trim() : undefined,
    }),
  });

  if (!response.ok) {
    throw new Error(`No se pudo cerrar el handoff (${response.status})`);
  }

  revalidatePath("/");
}

function summarizeBySource(handoffs: HandoffRecord[]) {
  return handoffs.reduce<Record<string, number>>((acc, handoff) => {
    const key = handoff.source ?? "desconocido";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function formatDate(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function GovDashboardHome() {
  const authReady = hasSupabaseEnv();
  const apiReady = hasApiBaseUrl();

  if (!authReady || !apiReady) {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-12">
        <header className="flex items-center justify-between gap-3 border-b border-border pb-6">
          <div>
            <Badge variant="outline">Panel provincial - Configuración pendiente</Badge>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">
              Faltan variables para operar el panel.
            </h1>
          </div>
          <Link
            href="/login/salir"
            className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Cerrar sesión
          </Link>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>Variables requeridas</CardTitle>
            <CardDescription>
              La vista de handoffs necesita Supabase SSR y el API productivo cargados en Vercel.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-muted-foreground">
            <p>{authReady ? "OK" : "Falta"} `NEXT_PUBLIC_SUPABASE_URL`</p>
            <p>{authReady ? "OK" : "Falta"} `NEXT_PUBLIC_SUPABASE_ANON_KEY`</p>
            <p>{apiReady ? "OK" : "Falta"} `NEXT_PUBLIC_API_URL`</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const handoffs = await fetchOpenHandoffs();
  const sources = summarizeBySource(handoffs);
  const academicCount = sources.academic ?? 0;
  const institutionalCount = sources.institutional ?? 0;

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-3 border-b border-border pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge variant="outline">Panel provincial - Operación de handoffs</Badge>
          <Link
            href="/login/salir"
            className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Cerrar sesión
          </Link>
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight">
          Cola operativa de derivaciones humanas.
        </h1>
        <p className="text-sm text-muted-foreground">
          Vista autenticada con datos reales del API. Cada caso sale de la cola al cerrarlo desde
          este panel.
        </p>
      </header>

      <section aria-label="Resumen" className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="shadow-whisper">
          <CardHeader>
            <CardDescription>Handoffs abiertos</CardDescription>
            <CardTitle className="font-display text-3xl tabular-nums">{handoffs.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-whisper">
          <CardHeader>
            <CardDescription>Origen académico</CardDescription>
            <CardTitle className="font-display text-3xl tabular-nums">{academicCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-whisper">
          <CardHeader>
            <CardDescription>Origen institucional</CardDescription>
            <CardTitle className="font-display text-3xl tabular-nums">
              {institutionalCount}
            </CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-4">
        {handoffs.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Sin handoffs pendientes</CardTitle>
              <CardDescription>
                La cola está vacía. Cuando el agente derive un caso, va a aparecer acá.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          handoffs.map((handoff) => (
            <Card key={handoff.id}>
              <CardHeader className="gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl">
                      {handoff.source === "academic"
                        ? "Consulta académica"
                        : "Consulta institucional"}
                    </CardTitle>
                    <CardDescription>
                      {formatDate(handoff.requestedAt ?? handoff.createdAt)} ·{" "}
                      {handoff.reason ?? "sin motivo informado"}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{handoff.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                  <p>
                    <span className="font-medium text-foreground">Alumno:</span>{" "}
                    {handoff.studentId ?? "sin studentId"}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Familia:</span>{" "}
                    {handoff.familyId ?? "sin familyId"}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Perfil:</span>{" "}
                    {handoff.studentProfileId ?? "sin profileId"}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">WhatsApp:</span>{" "}
                    {handoff.whatsappPhone ?? "sin teléfono"}
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Mensaje entrante
                    </p>
                    <p className="text-sm text-foreground">
                      {handoff.inboundMessage ?? "Sin mensaje entrante"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Respuesta del agente
                    </p>
                    <p className="text-sm text-foreground">
                      {handoff.outboundMessage ?? "Sin respuesta registrada"}
                    </p>
                  </div>
                </div>

                <form action={closeHandoff} className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <input type="hidden" name="handoffId" value={handoff.id} />
                  <textarea
                    name="resolutionNote"
                    rows={3}
                    placeholder="Nota opcional de resolución o seguimiento"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
                  >
                    Cerrar handoff
                  </button>
                </form>
              </CardContent>
            </Card>
          ))
        )}
      </section>

      <footer className="border-t border-border pt-6 text-xs text-muted-foreground">
        EducAI Gov - cola mínima operativa de handoffs humanos
      </footer>
    </main>
  );
}
