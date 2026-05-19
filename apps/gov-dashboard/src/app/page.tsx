import { Activity, BookOpen, GraduationCap, Inbox, School, Users } from "lucide-react";

import { GovShell } from "./_components/gov-shell";
import { KpiCard } from "./_components/kpi-card";
import { PageHeader } from "./_components/page-header";
import { requireGovSession } from "../lib/auth/require-gov-session";
import { fetchMinistryDashboard } from "../lib/dashboard-api";

export const dynamic = "force-dynamic";

export default async function GovDashboardHome() {
  const { session, tenantName, userRole } = await requireGovSession();
  const dashboard = await fetchMinistryDashboard(session.access_token);

  return (
    <GovShell userEmail={session.user.email ?? ""} userRole={userRole} tenantName={tenantName}>
      <PageHeader
        eyebrow="PANEL OPERATIVO"
        title="Resumen ministerial en vivo"
        subtitle="Conteos y distribuciones reales de colegios, alumnos, curriculas, planificaciones y handoffs."
      />

      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard icon={School} label="Colegios" value={dashboard.metrics.schoolCount} />
        <KpiCard icon={Users} label="Alumnos" value={dashboard.metrics.studentCount} />
        <KpiCard icon={GraduationCap} label="Docentes" value={dashboard.metrics.teacherCount} />
        <KpiCard icon={BookOpen} label="Curriculas" value={dashboard.metrics.curriculumCount} />
        <KpiCard icon={Activity} label="Planes IA" value={dashboard.metrics.lessonPlanCount} />
        <KpiCard
          icon={Inbox}
          label="Handoffs abiertos"
          value={dashboard.metrics.openHandoffCount}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <article className="gov-card rounded-xl border border-slate-200 bg-white p-6 shadow-whisper">
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Red de colegios reciente
          </h2>
          <div className="mt-5 grid gap-3">
            {dashboard.schools.slice(0, 6).map((school) => (
              <div key={school.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{school.name}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {[school.city, school.province].filter(Boolean).join(", ") || "Sin localidad"}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {school.studentCount} alumnos
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="gov-card rounded-xl border border-slate-200 bg-white p-6 shadow-whisper">
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Produccion por materia
          </h2>
          <div className="mt-5 grid gap-3">
            {dashboard.lessonPlansBySubject.map((item) => (
              <div key={item.subject} className="rounded-lg bg-slate-50 p-4">
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
