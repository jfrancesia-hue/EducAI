import { GovShell } from "../_components/gov-shell";
import { PageHeader } from "../_components/page-header";
import { requireGovSession } from "../../lib/auth/require-gov-session";
import { fetchMinistryDashboard } from "../../lib/dashboard-api";

export const dynamic = "force-dynamic";

export default async function ReportesPage() {
  const { session, tenantName, userRole } = await requireGovSession();
  const dashboard = await fetchMinistryDashboard(session.access_token);

  return (
    <GovShell userEmail={session.user.email ?? ""} userRole={userRole} tenantName={tenantName}>
      <PageHeader
        eyebrow="REPORTES"
        title="Reportes ejecutivos"
        subtitle="Resumen listo para lectura operativa con los principales totales y mix por materia."
      />

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="gov-card rounded-xl border border-slate-200 bg-white p-6 shadow-whisper">
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Totales principales
          </h2>
          <div className="mt-5 grid gap-3">
            {[
              ["Colegios", dashboard.metrics.schoolCount],
              ["Docentes", dashboard.metrics.teacherCount],
              ["Alumnos", dashboard.metrics.studentCount],
              ["Currículas", dashboard.metrics.curriculumCount],
              ["Planes IA", dashboard.metrics.lessonPlanCount],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{label}</p>
                  <p className="font-display text-2xl font-bold text-slate-900">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="gov-card rounded-xl border border-slate-200 bg-white p-6 shadow-whisper">
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Planificaciónes por materia
          </h2>
          <div className="mt-5 grid gap-3">
            {dashboard.lessonPlansBySubject.map((item) => (
              <div key={item.subject} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{item.subject}</p>
                  <p className="font-display text-2xl font-bold text-slate-900">{item.count}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </GovShell>
  );
}
