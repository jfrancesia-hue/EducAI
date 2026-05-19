import { GovShell } from "../_components/gov-shell";
import { PageHeader } from "../_components/page-header";
import { fetchMinistryDashboard } from "../../lib/dashboard-api";
import { requireGovSession } from "../../lib/auth/require-gov-session";

export const dynamic = "force-dynamic";

export default async function ColegiosPage() {
  const { session, tenantName, userRole } = await requireGovSession();
  const dashboard = await fetchMinistryDashboard(session.access_token);

  return (
    <GovShell userEmail={session.user.email ?? ""} userRole={userRole} tenantName={tenantName}>
      <PageHeader
        eyebrow="RED"
        title="Colegios conectados"
        subtitle="Inventario real de instituciones con conteo de docentes, alumnos y curriculas."
      />

      <section className="grid gap-4">
        {dashboard.schools.map((school) => (
          <article
            key={school.id}
            className="gov-card rounded-xl border border-slate-200 bg-white p-6 shadow-whisper"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                  {school.name}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {[school.city, school.province].filter(Boolean).join(", ") ||
                    "Sin ubicacion cargada"}
                </p>
              </div>
              <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                <span>{school.teacherCount} docentes</span>
                <span>{school.studentCount} alumnos</span>
                <span>{school.curriculumCount} curriculas</span>
              </div>
            </div>
          </article>
        ))}
      </section>
    </GovShell>
  );
}
