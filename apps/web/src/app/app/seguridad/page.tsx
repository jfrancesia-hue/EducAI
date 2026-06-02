import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageCircle,
  PhoneCall,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import { Badge, Button } from "@educai/ui";
import { AppShell } from "../_components/app-shell";
import { fetchHandoffs, type CrisisHandoff } from "../../../lib/api/handoffs";
import { getEducaiAppAuth } from "../../../lib/supabase/app-auth";
import { extractRoleFromMetadata } from "../../../lib/supabase/roles";

export const dynamic = "force-dynamic";

const SECURITY_ROLES = new Set(["SUPER_ADMIN", "SCHOOL_ADMIN"]);

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function isCrisis(handoff: CrisisHandoff) {
  return handoff.crisisSeverity === "critical" || handoff.crisisSeverity === "high";
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function SeguridadPage({ searchParams }: PageProps) {
  const isDevBypass =
    process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DISABLE_APP_AUTH === "true";

  let accessToken = "";
  if (!isDevBypass) {
    const auth = await getEducaiAppAuth();
    if (!auth.user) {
      redirect("/login?next=/app/seguridad");
    }
    const role =
      extractRoleFromMetadata(auth.user.app_metadata) ??
      extractRoleFromMetadata(auth.user.user_metadata);
    if (!role || !SECURITY_ROLES.has(role)) {
      redirect("/acceso-denegado");
    }
    accessToken = auth.accessToken;
  }

  const showHistory =
    (Array.isArray(searchParams?.historial)
      ? searchParams?.historial[0]
      : searchParams?.historial) === "1";

  const all = accessToken ? await fetchHandoffs(accessToken, true) : [];
  const open = all.filter((h) => h.status !== "closed");
  const closed = all.filter((h) => h.status === "closed");
  const crisisActive = open.filter(isCrisis);
  const rows = showHistory ? closed : open;

  const kpis = [
    {
      label: "Crisis activas",
      value: crisisActive.length,
      hint: "señales de autolesión, suicidio, abuso o violencia sin resolver",
      icon: ShieldAlert,
      tone: "bg-[#fde8e8] text-[#b3261e]",
      alert: crisisActive.length > 0,
    },
    {
      label: "Handoffs abiertos",
      value: open.length - crisisActive.length,
      hint: "derivaciones a humano que no son crisis",
      icon: MessageCircle,
      tone: "bg-[#fff3e0] text-[#9a4300]",
      alert: false,
    },
    {
      label: "Resueltos",
      value: closed.length,
      hint: "casos cerrados (historial reciente)",
      icon: ShieldCheck,
      tone: "bg-[#e7fbf7] text-[#087968]",
      alert: false,
    },
    {
      label: "Total registrados",
      value: all.length,
      hint: "activos + resueltos en el período",
      icon: Clock,
      tone: "bg-[#efedff] text-[#4f3ee2]",
      alert: false,
    },
  ];

  return (
    <AppShell
      title="Seguridad"
      eyebrow="Crisis y derivaciones"
      statusNote="Información sensible de estudiantes. Las crisis se derivan a un adulto responsable, nunca a la familia de forma automática. Actuá según el protocolo."
    >
      <div className="grid gap-5 p-4 sm:p-6">
        {crisisActive.length > 0 ? (
          <div className="flex items-start gap-3 rounded-2xl border border-[#f3b4b4] bg-[#fff4f4] p-4 shadow-whisper">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#b3261e]" aria-hidden="true" />
            <p className="text-sm font-semibold leading-6 text-[#8a1f1a]">
              Hay {crisisActive.length}{" "}
              {crisisActive.length === 1 ? "crisis activa" : "crisis activas"} sin resolver. Revisá
              y activá el protocolo de inmediato.
            </p>
          </div>
        ) : null}

        {/* KPIs */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <article
              key={kpi.label}
              className={[
                "rounded-[20px] border bg-white p-5 shadow-whisper",
                kpi.alert ? "border-[#f3b4b4]" : "border-[#d5e1dc]",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-11 w-11 items-center justify-center rounded-full",
                  kpi.tone,
                ].join(" ")}
              >
                <kpi.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="mt-4 text-[13px] font-semibold uppercase tracking-[0.1em] text-[#5b6962]">
                {kpi.label}
              </p>
              <p className="mt-1 font-display text-4xl font-bold tracking-tight text-[#11231f]">
                {kpi.value}
              </p>
              <p className="mt-2 text-[13px] leading-5 text-[#4f5f58]">{kpi.hint}</p>
            </article>
          ))}
        </section>

        {/* Tabs Activos / Historial */}
        <div className="flex items-center gap-2">
          <Tab href="/app/seguridad" active={!showHistory} label={`Activos (${open.length})`} />
          <Tab
            href="/app/seguridad?historial=1"
            active={showHistory}
            label={`Historial (${closed.length})`}
          />
        </div>

        {/* Tabla */}
        <section className="overflow-hidden rounded-[24px] border border-[#d5e1dc] bg-white shadow-whisper">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <ShieldCheck className="h-8 w-8 text-[#18b6a4]" aria-hidden="true" />
              <p className="font-display text-xl font-bold tracking-tight">
                {showHistory ? "Sin casos resueltos todavía" : "No hay casos activos"}
              </p>
              <p className="max-w-md text-sm leading-6 text-[#4f5f58]">
                {showHistory
                  ? "Cuando cierres un caso, va a quedar registrado acá."
                  : "Cuando el tutor detecte una crisis o pida derivar a un humano, vas a verlo acá en tiempo real."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e3ebe7] text-left text-xs uppercase tracking-wider text-[#5b6962]">
                    <th className="px-4 py-3 font-semibold">Tipo</th>
                    <th className="px-4 py-3 font-semibold">Detalle</th>
                    <th className="px-4 py-3 font-semibold">Contacto</th>
                    <th className="px-4 py-3 font-semibold">Fecha</th>
                    <th className="px-4 py-3 font-semibold">
                      {showHistory ? "Resolución" : "Acción"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((h) => (
                    <tr key={h.id} className="border-b border-[#f0f4f2] align-top last:border-0">
                      <td className="px-4 py-4">
                        <SeverityBadge handoff={h} />
                        {h.crisisAlertDelivered === false ? (
                          <p className="mt-1 text-[11px] font-semibold text-[#b3261e]">
                            ⚠ alerta no entregada
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-[#11231f]">
                          {h.reason ?? (isCrisis(h) ? "Crisis detectada" : "Derivación a humano")}
                        </p>
                        {h.safetySignals?.length ? (
                          <p className="mt-1 text-xs text-[#8a1f1a]">
                            Señales: {h.safetySignals.join(", ")}
                          </p>
                        ) : null}
                        {h.inboundMessage ? (
                          <p className="mt-1 line-clamp-2 max-w-md text-xs leading-5 text-[#4f5f58]">
                            “{h.inboundMessage}”
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4">
                        {h.whatsappPhone ? (
                          <a
                            href={`https://wa.me/${h.whatsappPhone.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 font-medium text-[#075f53] underline"
                          >
                            <PhoneCall className="h-3.5 w-3.5" aria-hidden="true" />
                            {h.whatsappPhone}
                          </a>
                        ) : (
                          <span className="text-[#7b8794]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs text-[#4f5f58]">
                        {formatDate(h.requestedAt ?? h.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        {h.status === "closed" ? (
                          <div className="text-xs text-[#4f5f58]">
                            <p className="font-semibold text-[#087968]">✓ Resuelto</p>
                            {h.resolvedBy ? <p className="mt-0.5">por {h.resolvedBy}</p> : null}
                            {h.resolutionNote ? (
                              <p className="mt-0.5 italic">“{h.resolutionNote}”</p>
                            ) : null}
                          </div>
                        ) : (
                          <form action="/app/seguridad/cerrar" method="post">
                            <input type="hidden" name="id" value={h.id} />
                            <Button
                              type="submit"
                              size="sm"
                              variant="outline"
                              className="border-[#d5e1dc] bg-white text-[#075f53] hover:bg-[#e7fbf7]"
                            >
                              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                              Marcar resuelto
                            </Button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function Tab({ href, active, label }: { href: Route; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={[
        "rounded-full px-4 py-2 text-sm font-semibold transition",
        active
          ? "bg-[#075f53] text-white shadow-whisper"
          : "border border-[#d5e1dc] bg-white text-[#33423c] hover:bg-[#e7fbf7]",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

function SeverityBadge({ handoff }: { handoff: CrisisHandoff }) {
  if (handoff.crisisSeverity === "critical") {
    return <Badge className="bg-[#d92d20] text-white">🚨 Crisis crítica</Badge>;
  }
  if (handoff.crisisSeverity === "high") {
    return <Badge className="bg-[#f59e0b] text-[#3b2a00]">⚠ Crisis alta</Badge>;
  }
  return <Badge className="bg-[#eef5f3] text-[#33423c]">Derivación</Badge>;
}
