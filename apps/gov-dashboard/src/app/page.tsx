import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Activity, Building2, GraduationCap, Inbox, School, Users } from "lucide-react";

import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@educai/ui";
import { GovShell } from "./_components/gov-shell";
import { HandoffList, type HandoffRecord } from "./_components/handoff-list";
import { KpiCard } from "./_components/kpi-card";
import { PageHeader } from "./_components/page-header";
import { getApiBaseUrl, hasApiBaseUrl } from "../lib/api";
import type { GovRole } from "../lib/nav";
import { hasSupabaseEnv } from "../lib/supabase/env";
import { extractRoleFromMetadata } from "../lib/supabase/roles";
import { createSupabaseServerClient } from "../lib/supabase/server";

export const dynamic = "force-dynamic";

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
    throw new Error("La sesion expiro antes de cerrar el handoff.");
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

function getMetadataString(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object") {
    return undefined;
  }

  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

export default async function GovDashboardHome() {
  const authReady = hasSupabaseEnv();
  const apiReady = hasApiBaseUrl();

  if (!authReady || !apiReady) {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-12">
        <header className="flex items-center justify-between gap-3 border-b border-border pb-6">
          <div>
            <Badge variant="outline">Panel provincial - Configuracion pendiente</Badge>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">
              Faltan variables para operar el panel.
            </h1>
          </div>
          <Link
            href="/login/salir"
            className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Cerrar sesion
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

  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const role =
    extractRoleFromMetadata(session.user.app_metadata) ??
    extractRoleFromMetadata(session.user.user_metadata);

  if (!role || (role !== "SUPER_ADMIN" && role !== "MINISTRY")) {
    redirect("/acceso-denegado");
  }

  let handoffs: HandoffRecord[] = [];
  let handoffLoadError: string | null = null;

  try {
    handoffs = await fetchOpenHandoffs();
  } catch (error) {
    handoffLoadError = error instanceof Error ? error.message : "No se pudo cargar la cola.";
  }

  const sources = summarizeBySource(handoffs);
  const academicCount = sources.academic ?? 0;
  const institutionalCount = sources.institutional ?? 0;

  const appMetadata = session?.user?.app_metadata as unknown;
  const userRole: GovRole = role;
  const tenantName = getMetadataString(appMetadata, "tenantName");

  return (
    <GovShell userEmail={session?.user?.email ?? ""} userRole={userRole} tenantName={tenantName}>
      <PageHeader
        eyebrow="PANEL OPERATIVO"
        title={
          <>
            Cola operativa de <span className="gov-gradient-text">derivaciones humanas</span>
          </>
        }
        subtitle="Vista autenticada con datos reales del API. Cada caso sale de la cola al cerrarlo desde este panel."
      />

      <section aria-label="Resumen KPI" className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard icon={Inbox} label="Handoffs abiertos" value={handoffs.length} status="live" />
        <KpiCard
          icon={GraduationCap}
          label="Origen academico"
          value={academicCount}
          status="live"
        />
        <KpiCard
          icon={Building2}
          label="Origen institucional"
          value={institutionalCount}
          status="live"
        />
      </section>

      <section
        aria-label="Indicadores ministeriales"
        className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        <KpiCard
          icon={School}
          label="Colegios conectados"
          value={
            <span
              className="gov-skeleton inline-block h-8 w-16"
              role="status"
              aria-label="Cargando"
            />
          }
          status="placeholder"
        />
        <KpiCard
          icon={Users}
          label="Alumnos impactados"
          value={
            <span
              className="gov-skeleton inline-block h-8 w-20"
              role="status"
              aria-label="Cargando"
            />
          }
          status="placeholder"
        />
        <KpiCard
          icon={Activity}
          label="Cobertura curricular"
          value={
            <span
              className="gov-skeleton inline-block h-8 w-14"
              role="status"
              aria-label="Cargando"
            />
          }
          status="placeholder"
        />
      </section>

      <HandoffList handoffs={handoffs} onClose={closeHandoff} loadError={handoffLoadError} />
    </GovShell>
  );
}
