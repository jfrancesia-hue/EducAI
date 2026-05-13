import Link from "next/link";

import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@educai/ui";

const kpis = [
  { label: "Matricula total", value: "187.432", delta: "+1.2% trimestral" },
  { label: "Desercion temprana", value: "8,4%", delta: "-0,6 pp" },
  { label: "Cobertura curricular", value: "81%", delta: "+3 pp" },
  { label: "Docentes formados en IA", value: "2.134", delta: "+284 mensual" },
  { label: "Colegios en EducAI", value: "842 / 1.204", delta: "+18 mensual" },
  { label: "Brechas criticas cerradas", value: "127", delta: "+9 trimestral" },
];

const territorySignals = [
  {
    area: "Capital",
    risk: "Bajo",
    note: "Asistencia estable y adopcion alta",
    tone: "text-[#0f766e]",
  },
  {
    area: "Valle Viejo",
    risk: "Medio",
    note: "Sube la demanda de apoyo en secundaria",
    tone: "text-[#b45309]",
  },
  {
    area: "Belen",
    risk: "Alto",
    note: "Alertas de trayectorias interrumpidas en primer ano",
    tone: "text-[#be123c]",
  },
];

const actionQueue = [
  "Coordinar refuerzo de alfabetizacion en 23 escuelas primarias",
  "Validar cobertura docente en zonas rurales antes del cierre semanal",
  "Liberar acompanamiento focalizado para secundaria basica en Belen",
  "Revisar cohortes con baja actividad digital durante 10 dias o mas",
];

export default function GovDashboardHome() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-3 border-b border-border pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge variant="outline">Panel provincial - Catamarca</Badge>
          <Link
            href="/login/salir"
            className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Cerrar sesion
          </Link>
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight">
          Estado operativo del sistema educativo provincial.
        </h1>
        <p className="text-sm text-muted-foreground">
          Ultima sincronizacion hace 12 min - 842 colegios - 187.432 alumnos - 12.854 docentes -
          vista institucional autenticada al 23 de abril de 2026.
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
            <CardTitle>Lectura territorial priorizada</CardTitle>
            <CardDescription>
              Senales de riesgo sintetizadas para orientar acompanamiento, visitas y refuerzos.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {territorySignals.map((signal) => (
              <div
                key={signal.area}
                className="rounded-lg border border-border bg-muted/30 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{signal.area}</p>
                  <span className={["text-sm font-semibold", signal.tone].join(" ")}>
                    {signal.risk}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{signal.note}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cola de decisiones</CardTitle>
            <CardDescription>
              Acciones sugeridas para supervision central, equipos territoriales y direccion de
              nivel.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {actionQueue.map((item) => (
              <div key={item} className="rounded-lg border border-border bg-background px-4 py-3">
                <p className="text-sm text-foreground">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <footer className="border-t border-border pt-6 text-xs text-muted-foreground">
        Nativos Consultora Digital - EducAI Gov v0.1 - Cumplimiento Ley 26.061 - Auditoria externa
        anual
      </footer>
    </main>
  );
}
