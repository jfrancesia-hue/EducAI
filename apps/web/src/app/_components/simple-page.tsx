import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Badge, Button } from "@educai/ui";

interface SimplePageProps {
  badge: string;
  title: string;
  description: string;
  icon: LucideIcon;
  primaryLabel?: string;
}

export function SimplePage({
  badge,
  title,
  description,
  icon: Icon,
  primaryLabel = "Volver a la plataforma",
}: SimplePageProps) {
  return (
    <main className="min-h-screen bg-[#f7f8f3] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] max-w-5xl flex-col justify-between rounded-lg border border-slate-200 bg-white p-6 shadow-float sm:p-10">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-3 font-display text-lg font-semibold tracking-tight"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-white">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            EducAI
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Inicio
            </Link>
          </Button>
        </header>

        <section className="max-w-3xl py-20">
          <Badge variant="outline" className="border-slate-300">
            {badge}
          </Badge>
          <h1 className="mt-6 font-display text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            {title}
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">{description}</p>
          <div className="mt-8">
            <Button asChild size="lg" pill>
              <Link href="/">
                {primaryLabel}
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>

        <footer className="border-t border-slate-200 pt-6 text-sm text-slate-500">
          Nativos Consultora Digital - EducAI
        </footer>
      </div>
    </main>
  );
}
