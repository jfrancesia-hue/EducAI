import { BarChart3, BookOpen, Inbox, School, Users } from "lucide-react";

import { GovShell } from "../_components/gov-shell";
import { KpiCard } from "../_components/kpi-card";
import { PageHeader } from "../_components/page-header";
import { requireGovSession } from "../../lib/auth/require-gov-session";
import { fetchMinistryDashboard } from "../../lib/dashboard-api";

export const dynamic = "force-dynamic";

export default async function IndicadoresPage() {
  const { session, tenantName, userRole } = await requireGovSession();
  const dashboard = await fetchMinistryDashboard(session.access_token);

  return (
    <GovShell userEmail={session.user.email ?? ""} userRole={userRole} tenantName={tenantName}>
      <PageHeader
        eyebrow="INDICADORES"
        title="Indicadores ministeriales"
        subtitle="Lectura consolidada de cobertura de red, actividad pedagógica y derivaciones."
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard icon={School} label="Colegios" value={dashboard.metrics.schoolCount} />
        <KpiCard icon={Users} label="Alumnos" value={dashboard.metrics.studentCount} />
        <KpiCard icon={BookOpen} label="Currículas" value={dashboard.metrics.curriculumCount} />
        <KpiCard icon={BarChart3} label="Planes IA" value={dashboard.metrics.lessonPlanCount} />
        <KpiCard
          icon={Inbox}
          label="Handoffs abiertos"
          value={dashboard.metrics.openHandoffCount}
        />
      </section>
    </GovShell>
  );
}
