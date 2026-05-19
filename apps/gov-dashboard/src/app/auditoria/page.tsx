import { GovShell } from "../_components/gov-shell";
import { PageHeader } from "../_components/page-header";
import { requireGovSession } from "../../lib/auth/require-gov-session";
import { fetchMinistryDashboard } from "../../lib/dashboard-api";

export const dynamic = "force-dynamic";

export default async function AuditoriaPage() {
  const { session, tenantName, userRole } = await requireGovSession();
  const dashboard = await fetchMinistryDashboard(session.access_token);

  return (
    <GovShell userEmail={session.user.email ?? ""} userRole={userRole} tenantName={tenantName}>
      <PageHeader
        eyebrow="AUDITORIA"
        title="Registro de auditoria"
        subtitle="Eventos reales del sistema, agrupados por accion y con ultimos movimientos visibles."
      />

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <article className="gov-card rounded-xl border border-slate-200 bg-white p-6 shadow-whisper">
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Acciones mas frecuentes
          </h2>
          <div className="mt-5 grid gap-3">
            {dashboard.auditActions.map((item) => (
              <div key={item.action} className="rounded-lg bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-sm text-slate-700">{item.action}</p>
                  <p className="font-display text-2xl font-bold text-slate-900">{item.count}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="gov-card rounded-xl border border-slate-200 bg-white p-6 shadow-whisper">
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Ultimos eventos
          </h2>
          <div className="mt-5 grid gap-3">
            {dashboard.recentAudit.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 p-4">
                <p className="font-mono text-sm text-slate-700">{item.action}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {item.entity}
                  {item.tenantId ? ` · tenant ${item.tenantId}` : ""}
                </p>
                <p className="mt-2 text-xs text-slate-500">{item.createdAt}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </GovShell>
  );
}
