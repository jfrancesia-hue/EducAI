import { GovShell } from "../_components/gov-shell";
import { PageHeader } from "../_components/page-header";
import { requireGovSession } from "../../lib/auth/require-gov-session";
import { fetchMinistryDashboard } from "../../lib/dashboard-api";

export const dynamic = "force-dynamic";

export default async function CurriculoPage() {
  const { session, tenantName, userRole } = await requireGovSession();
  const dashboard = await fetchMinistryDashboard(session.access_token);

  return (
    <GovShell userEmail={session.user.email ?? ""} userRole={userRole} tenantName={tenantName}>
      <PageHeader
        eyebrow="CURRICULO"
        title="Cobertura curricular"
        subtitle="Distribucion real de curriculas cargadas por materia en la red."
      />

      <section className="grid gap-4 md:grid-cols-2">
        {dashboard.curriculaBySubject.map((item) => (
          <article
            key={item.subject}
            className="gov-card rounded-xl border border-slate-200 bg-white p-6 shadow-whisper"
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Materia</p>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900">
              {item.subject}
            </h2>
            <p className="mt-3 text-sm text-slate-600">{item.count} curriculas registradas</p>
          </article>
        ))}
      </section>
    </GovShell>
  );
}
