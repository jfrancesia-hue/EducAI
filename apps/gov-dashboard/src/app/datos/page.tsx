import { GovShell } from "../_components/gov-shell";
import { PageHeader } from "../_components/page-header";
import { requireGovSession } from "../../lib/auth/require-gov-session";
import { fetchMinistryDashboard } from "../../lib/dashboard-api";

export const dynamic = "force-dynamic";

export default async function DatosPage() {
  const { session, tenantName, userRole } = await requireGovSession();
  const dashboard = await fetchMinistryDashboard(session.access_token);

  return (
    <GovShell userEmail={session.user.email ?? ""} userRole={userRole} tenantName={tenantName}>
      <PageHeader
        eyebrow="DATOS"
        title="Datos abiertos operativos"
        subtitle="Catalogo legible de los principales conjuntos disponibles hoy en la red."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          ["Colegios conectados", dashboard.metrics.schoolCount],
          ["Alumnos registrados", dashboard.metrics.studentCount],
          ["Docentes registrados", dashboard.metrics.teacherCount],
          ["Currículas cargadas", dashboard.metrics.curriculumCount],
          ["Planes IA generados", dashboard.metrics.lessonPlanCount],
          ["Handoffs abiertos", dashboard.metrics.openHandoffCount],
        ].map(([label, value]) => (
          <article
            key={label}
            className="gov-card rounded-xl border border-slate-200 bg-white p-6 shadow-whisper"
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">{label}</p>
            <p className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-900">
              {value}
            </p>
          </article>
        ))}
      </section>
    </GovShell>
  );
}
