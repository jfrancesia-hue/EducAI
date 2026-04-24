import Link from "next/link";

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@educai/ui";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-start gap-16 px-6 py-16 md:px-10 md:py-24">
      <header className="flex w-full items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-display text-lg font-bold">
            A
          </div>
          <div>
            <p className="font-display text-lg font-semibold tracking-tight">ApoyoAI</p>
            <p className="text-xs text-muted-foreground">Nativos Consultora Digital</p>
          </div>
        </div>
        <nav className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Iniciar sesión</Link>
          </Button>
          <Button asChild pill>
            <Link href="/onboarding">Probar gratis 7 días</Link>
          </Button>
        </nav>
      </header>

      <section className="flex flex-col gap-6">
        <Badge variant="outline">Hecho en Argentina · LATAM</Badge>
        <h1 className="max-w-3xl font-display text-5xl font-bold leading-tight tracking-tight md:text-6xl">
          Tu hijo puede. <span className="text-primary">Vos no tenés que saberlo todo.</span>
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Un tutor de inteligencia artificial que acompaña a tu hijo en matemática, lengua y ciencias —
          por WhatsApp, todos los días, sin juzgarlo.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild size="lg" pill>
            <Link href="/onboarding">Empezar gratis 7 días</Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link href="#como-funciona">Ver cómo funciona</Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            No requiere tarjeta. Cancelás cuando quieras.
          </span>
        </div>
      </section>

      <section id="ecosistema" className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Badge>B2C · ApoyoAI</Badge>
            <CardTitle>Tutor IA para familias</CardTitle>
            <CardDescription>
              Tutor socrático por WhatsApp para alumnos de 4° a 12° grado. Pagado por los padres,
              desde USD 6 por mes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/planes">Ver planes</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Badge variant="outline">B2B / B2G · EducAI</Badge>
            <CardTitle>Sistema operativo para colegios y ministerios</CardTitle>
            <CardDescription>
              Diagnóstico curricular, planificaciones por IA, formación docente y detección temprana de
              deserción. Para colegios y gobiernos provinciales.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/colegios">Para colegios</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <footer className="w-full border-t border-border pt-8 text-sm text-muted-foreground">
        © 2026 Nativos Consultora Digital · Hecho con cariño en Catamarca para LATAM · Cumplimiento Ley 26.061
      </footer>
    </main>
  );
}
