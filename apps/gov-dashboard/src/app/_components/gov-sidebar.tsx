"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Building2, Menu, X } from "lucide-react";

import { NAV_ITEMS, type GovRole, type NavItem } from "../../lib/nav";

interface GovSidebarProps {
  userRole: GovRole;
}

function NavContent({
  items,
  userRole,
  onNavigate,
}: GovSidebarProps & {
  items: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const visibleItems = items.filter((item) => item.roles.includes(userRole));

  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-3 text-white outline-none transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/18 text-blue-200">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block font-display text-lg font-semibold leading-none">
              EducAI Gov
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate-400">Panel ministerial</span>
          </span>
        </Link>

        <nav className="mt-8 grid gap-1" aria-label="Navegacion principal" role="navigation">
          {visibleItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href as Route}
                onClick={onNavigate}
                className={[
                  "group flex min-h-11 items-center gap-3 rounded-r-lg border-l-2 px-3 py-2.5 text-sm font-medium outline-none transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]",
                  active
                    ? "border-blue-400 bg-[hsl(var(--gov-sidebar-active-bg))] text-white"
                    : "border-transparent text-slate-300 hover:bg-white/5 hover:text-white",
                ].join(" ")}
                aria-current={active ? "page" : undefined}
              >
                <item.icon
                  className={[
                    "h-4 w-4 shrink-0 transition",
                    active ? "text-blue-200" : "text-slate-400 group-hover:text-slate-200",
                  ].join(" ")}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.status === "placeholder" ? (
                  <span className="rounded-full border border-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Pronto
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs leading-5 text-slate-400">
        v0.1 - Panel ministerial
      </div>
    </div>
  );
}

export function GovSidebar({ userRole }: GovSidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const drawerId = useId();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        data-no-print
        className="fixed left-4 top-2.5 z-50 flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-900 shadow-whisper outline-none transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))] lg:hidden"
        aria-label={open ? "Cerrar navegacion" : "Abrir navegacion"}
        aria-controls={drawerId}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? (
          <X className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Menu className="h-5 w-5" aria-hidden="true" />
        )}
      </button>

      <aside
        data-no-print
        className="fixed left-0 top-0 z-40 hidden h-screen w-60 border-r border-white/10 bg-[hsl(var(--gov-sidebar-bg))] p-4 text-[hsl(var(--gov-sidebar-text))] lg:block"
      >
        <NavContent items={NAV_ITEMS} userRole={userRole} />
      </aside>

      <div
        data-no-print
        className={[
          "fixed inset-0 z-40 bg-slate-950/55 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />

      <aside
        id={drawerId}
        data-no-print
        role="dialog"
        aria-label="Navegacion principal"
        aria-modal="true"
        aria-hidden={!open}
        inert={open ? undefined : true}
        className={[
          "fixed left-0 top-0 z-50 h-screen w-72 max-w-[86vw] border-r border-white/10 bg-[hsl(var(--gov-sidebar-bg))] p-4 text-[hsl(var(--gov-sidebar-text))] shadow-2xl transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <NavContent items={NAV_ITEMS} userRole={userRole} onNavigate={() => setOpen(false)} />
      </aside>
    </>
  );
}
