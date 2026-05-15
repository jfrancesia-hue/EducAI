"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Bell,
  ClipboardList,
  GraduationCap,
  Home,
  LineChart,
  MessageCircle,
  Search,
  Settings,
  Sparkles,
  UsersRound,
  WalletCards,
} from "lucide-react";

import { Button } from "@educai/ui";

const navItems = [
  { label: "Hoy", icon: Home, href: "/app" },
  { label: "Estudiantes", icon: UsersRound, href: "/app/estudiantes" },
  { label: "Planificar", icon: ClipboardList, href: "/app/planificar" },
  { label: "Agente IA", icon: MessageCircle, href: "/app/agente" },
  { label: "Reportes", icon: LineChart, href: "/app/reportes" },
  { label: "Planes", icon: WalletCards, href: "/app/planes" },
] satisfies Array<{ label: string; icon: typeof Home; href: Route }>;

type AppShellProps = {
  title: string;
  eyebrow?: string;
  children: ReactNode;
};

export function AppShell({
  title,
  eyebrow = "Colegio del Valle - Sesion institucional",
  children,
}: AppShellProps) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-[#eef5f3] p-3 text-[15px] text-[#14120f] [text-rendering:optimizeLegibility] sm:p-5">
      <div className="grid min-h-[calc(100vh-24px)] overflow-hidden rounded-lg border border-[#d5e1dc] bg-[#f8fbf7] shadow-float lg:grid-cols-[240px_1fr]">
        <aside className="hidden border-r border-[#d5e1dc] bg-[#11231f] p-4 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <Link href="/" className="flex items-center gap-3 rounded-lg bg-white/8 p-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#f8d95c] text-[#11231f]">
                <GraduationCap className="h-6 w-6" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-display text-lg font-semibold leading-none">
                  EducAI
                </span>
                <span className="mt-1 block text-[13px] leading-5 text-white/68">
                  Centro operativo
                </span>
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
                        ? "bg-white text-[#11231f] shadow-whisper"
                        : "text-white/72 hover:bg-white/10 hover:text-white",
                    ].join(" ")}
                  >
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/8 p-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#18b6a4]" />
              <p className="text-[15px] font-semibold leading-6">Agente activo</p>
            </div>
            <p className="mt-2 text-[13px] leading-5 text-white/70">
              Monitoreando planificaciones, recursos y pendientes docentes.
            </p>
            <Link
              href="/app/agente"
              className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#ff7a1a] text-sm font-bold text-white shadow-[0_14px_30px_rgba(255,122,26,0.24)] transition hover:bg-[#ea6508]"
            >
              Ejecutar
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/login/salir"
              className="mt-2 flex h-10 w-full items-center justify-center rounded-lg bg-white/10 text-white/72 transition hover:bg-white/15 hover:text-white"
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="flex flex-col gap-4 border-b border-[#d5e1dc] bg-white/75 px-4 py-4 backdrop-blur-xl sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5b6962]">
                {eyebrow}
              </p>
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                {title}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden h-11 items-center gap-2 rounded-lg border border-[#d5e1dc] bg-white px-3 text-[15px] text-[#5b6962] md:flex">
                <Search className="h-4 w-4" aria-hidden="true" />
                Buscar estudiante, tema o curso
              </div>
              <button
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#d5e1dc] bg-white"
                type="button"
                title="Notificaciones"
              >
                <Bell className="h-5 w-5" aria-hidden="true" />
              </button>
              <Button
                asChild
                className="bg-[#ff7a1a] text-white shadow-[0_14px_34px_rgba(255,122,26,0.36)] hover:bg-[#ea6508]"
              >
                <Link href="/app/agente">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Ejecutar agente
                </Link>
              </Button>
            </div>
          </header>

          <nav className="flex gap-2 overflow-x-auto border-b border-[#d5e1dc] bg-white/70 px-4 py-3 sm:px-6 lg:hidden">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={[
                    "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[15px] font-medium leading-6",
                    active
                      ? "bg-[#11231f] text-white"
                      : "border border-[#d5e1dc] bg-white text-[#33423c]",
                  ].join(" ")}
                >
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {children}
        </section>
      </div>
    </main>
  );
}
