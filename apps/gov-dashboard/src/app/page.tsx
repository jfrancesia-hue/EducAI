import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@educai/ui";

const kpis = [
  { label: "Matrícula total", value: "187.432", delta: "+1.2% QoQ" },
  { label: "Tasa de deserción", value: "8,4%", delta: "-0,6 pp" },
  { label: "Cobertura curricular", value: "81%", delta: "+3 pp" },
  { label: "Docentes formados en IA", value: "2.134", delta: "+284 MoM" },
  { label: "Colegios en EducAI", value: "842 / 1.204", delta: "+18 MoM" },
  { label: "Brechas OCDE cerradas", value: "127", delta: "+9 QoQ" },
];

export default function GovDashboardHome() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-3 border-b border-border pb-6">
        <Badge variant="outline">Panel provincial · Catamarca</Badge>
        <h1 className="font-display text-4xl font-bold tracking-tight">
          Buen día. Esto es lo que está pasando hoy en el sistema educativo provincial.
        </h1>
        <p className="text-sm text-muted-foreground">
          Última sincronización hace 12 min · 842 colegios · 187.432 alumnos · 12.854 docentes ·
          Datos al 23 de abril 2026.
        </p>
      </header>

      <section aria-label="Indicadores clave" className="grid grid-cols-2 gap-4 md:grid-cols-6">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="shadow-whisper">
            <CardHeader>
              <CardDescription className="text-[11px] uppercase tracking-wide">
                {kpi.label}
              </CardDescription>
              <CardTitle className="font-display text-3xl tabular-nums">{kpi.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-xs text-muted-foreground">{kpi.delta}</span>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Deserción temprana por departamento</CardTitle>
            <CardDescription>
              Heatmap pendiente de implementación en Fase 2 (EducAI institucional). Usar Tremor
              + mapa SVG de Catamarca con score por departamento.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Alertas accionables</CardTitle>
            <CardDescription>
              4 alertas que requieren decisión ministerial hoy. Pipeline de alertas conectado al
              motor de deserción temprana en Fase 4 (B2G).
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      <footer className="border-t border-border pt-6 text-xs text-muted-foreground">
        Nativos Consultora Digital · EducAI Gov v0.1 · Cumplimiento Ley 26.061 · Auditoría externa anual
      </footer>
    </main>
  );
}
