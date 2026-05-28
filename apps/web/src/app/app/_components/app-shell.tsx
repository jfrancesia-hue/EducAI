"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  ClipboardList,
  GraduationCap,
  Home,
  Info,
  LineChart,
  LogOut,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";

import { Button } from "@educai/ui";

const navItems = [
  {
    label: "Inicio",
    icon: Home,
    href: "/app",
    tone: "bg-[#e7fbf7] text-[#087968]",
    activeTone: "bg-[#18b6a4] text-white",
  },
  {
    label: "Crear clase",
    icon: ClipboardList,
    href: "/app/planificar",
    tone: "bg-[#fff8d7] text-[#876100]",
    activeTone: "bg-[#f8d95c] text-[#11231f]",
  },
  {
    label: "Estudiantes",
    icon: UsersRound,
    href: "/app/estudiantes",
    tone: "bg-[#fdeaf4] text-[#b82170]",
    activeTone: "bg-[#ef5da8] text-white",
  },
  {
    label: "Reportes",
    icon: LineChart,
    href: "/app/reportes",
    tone: "bg-[#efedff] text-[#4f3ee2]",
    activeTone: "bg-[#7c6cff] text-white",
  },
  {
    label: "Mi perfil",
    icon: UserRound,
    href: "/app/perfil",
    tone: "bg-[#edf7ff] text-[#176b9a]",
    activeTone: "bg-[#5bb7e5] text-white",
  },
] satisfies Array<{
  label: string;
  icon: typeof Home;
  href: Route;
  tone: string;
  activeTone: string;
}>;

type AppShellProps = {
  title: string;
  eyebrow?: string;
  hideNavigation?: boolean;
  statusNote?: string;
  children: ReactNode;
};

export function AppShell({
  title,
  eyebrow = "Espacio docente",
  hideNavigation = false,
  statusNote,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const isPlanningPage = pathname === "/app/planificar";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(98,220,202,0.72),transparent_34%),linear-gradient(135deg,#f7f8f3_0%,#e7fbf7_46%,#fff8d7_100%)] p-3 text-[15px] text-[#14120f] [text-rendering:optimizeLegibility] sm:p-5">
      <div
        className={[
          "grid min-h-[calc(100vh-24px)] overflow-hidden rounded-[28px] border border-white/65 bg-[#f8fbf7]/94 shadow-float backdrop-blur-sm",
          hideNavigation ? "" : "lg:grid-cols-[268px_1fr]",
        ].join(" ")}
      >
        {!hideNavigation ? (
        <aside className="hidden border-r border-[#0c6f62]/20 bg-[linear-gradient(180deg,#075f53_0%,#0a7668_54%,#11231f_100%)] p-4 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <Link href="/app" className="flex items-center gap-3 rounded-lg bg-white/12 p-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#f8d95c] text-[#075f53]">
                <GraduationCap className="h-6 w-6" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-display text-lg font-semibold leading-none">
                  EducAI
                </span>
                <span className="mt-1 block text-[13px] leading-5 text-white/78">Docentes</span>
              </span>
            </Link>

            <nav className="mt-8 grid gap-2">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={[
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-medium leading-6 transition",
                      active
                        ? "bg-white text-[#075f53] shadow-whisper"
                        : "text-white/78 hover:bg-white/12 hover:text-white",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "flex h-9 w-9 items-center justify-center rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.12)]",
                        active ? item.activeTone : item.tone,
                      ].join(" ")}
                    >
                      <item.icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="rounded-lg border border-white/18 bg-white/12 p-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#f8d95c]" />
              <p className="text-[15px] font-semibold leading-6">Flujo principal</p>
            </div>
            <p className="mt-2 text-[13px] leading-5 text-white/70">
              Crear una clase ordenada con objetivos, actividades y evaluación.
            </p>
            <Link
              href="/app/planificar"
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#ff7a1a] text-sm font-bold text-white shadow-[0_14px_30px_rgba(255,122,26,0.28)] transition hover:-translate-y-0.5 hover:bg-[#ea6508]"
            >
              Crear clase
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/login/salir"
              className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-full border border-white/12 bg-white/10 text-sm font-semibold text-white/72 transition hover:bg-white/15 hover:text-white"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Salir
            </Link>
          </div>
        </aside>
        ) : null}

        <section className="min-w-0">
          <header className="flex flex-col gap-4 border-b border-[#62dcca]/25 bg-white/88 px-4 py-4 backdrop-blur-xl sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#087968]">
                {eyebrow}
              </p>
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                {title}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {!hideNavigation && !isPlanningPage ? (
                <Button
                  asChild
                  className="bg-[#ff7a1a] text-white shadow-[0_14px_34px_rgba(255,122,26,0.36)] hover:bg-[#ea6508]"
                >
                  <Link href="/app/planificar">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    Crear clase
                  </Link>
                </Button>
              ) : null}
              <Button
                asChild
                variant="outline"
                className="border-[#d5e1dc] bg-white text-[#11231f] shadow-whisper hover:border-[#18b6a4]/45 hover:bg-[#e7fbf7]"
              >
                <Link href="/login/salir">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Salir
                </Link>
              </Button>
            </div>
          </header>

          {!hideNavigation ? (
          <nav className="flex gap-2 overflow-x-auto border-b border-[#62dcca]/25 bg-white/74 px-4 py-3 sm:px-6 lg:hidden">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={[
                    "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[15px] font-medium leading-6",
                    active
                      ? "bg-[#075f53] text-white shadow-whisper"
                      : "border border-[#d5e1dc] bg-white text-[#33423c] shadow-whisper",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-7 w-7 items-center justify-center rounded-full",
                      active ? item.activeTone : item.tone,
                    ].join(" ")}
                  >
                    <item.icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          ) : null}

          {statusNote ? (
            <div className="border-b border-[#18b6a4]/20 bg-[#e7fbf7] px-4 py-3 sm:px-6">
              <p className="flex items-start gap-2 text-sm font-medium leading-6 text-[#075c50]">
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {statusNote}
              </p>
            </div>
          ) : null}

          {children}
        </section>
      </div>
    </main>
  );
}
