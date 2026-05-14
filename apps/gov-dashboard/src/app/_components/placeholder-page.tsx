import { BarChart3, FileText, ShieldCheck } from "lucide-react";

import { Card, CardContent } from "@educai/ui";
import { KpiCard } from "./kpi-card";
import { PageHeader } from "./page-header";

interface PlaceholderPageProps {
  eyebrow: string;
  title: string;
  description: string;
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`gov-skeleton ${className}`} role="status" aria-label="Cargando" />;
}

export function PlaceholderPage({ eyebrow, title, description }: PlaceholderPageProps) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} subtitle={description} />

      <section
        aria-label="Indicadores pendientes"
        className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        <KpiCard
          icon={BarChart3}
          label="Cobertura"
          value={<SkeletonBlock className="h-8 w-24" />}
          status="placeholder"
        />
        <KpiCard
          icon={ShieldCheck}
          label="Auditoria"
          value={<SkeletonBlock className="h-8 w-20" />}
          status="placeholder"
        />
        <KpiCard
          icon={FileText}
          label="Reportes"
          value={<SkeletonBlock className="h-8 w-24" />}
          status="placeholder"
        />
      </section>

      <Card className="gov-card border-slate-200 bg-white shadow-whisper">
        <CardContent className="grid gap-4 p-6">
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">
            Esta seccion estara disponible en el proximo corte de datos ministerial. Volve en unos
            dias.
          </div>
          <SkeletonBlock className="h-4 w-2/3" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-5/6" />
        </CardContent>
      </Card>
    </>
  );
}
