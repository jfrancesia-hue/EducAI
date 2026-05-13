import Link from "next/link";
import { ArrowRight, Building2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

import { Button } from "@educai/ui";
import { hasSupabaseEnv } from "../../lib/supabase/env";

const errorMessages: Record<string, string> = {
  config:
    "Falta configurar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en gov-dashboard.",
  invalid: "Las credenciales no son validas o el usuario no existe en Supabase Auth.",
  missing: "Completa email y contrasena para iniciar sesion.",
};

export default function GovLoginPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const authReady = hasSupabaseEnv();
  const errorCode =
    typeof searchParams?.error === "string"
      ? searchParams.error
      : Array.isArray(searchParams?.error)
        ? searchParams.error[0]
        : undefined;
  const errorMessage = errorCode ? (errorMessages[errorCode] ?? null) : null;

  return (
    <main className="min-h-screen bg-[#102033] p-4 text-white sm:p-6">
      <div className="grid min-h-[calc(100vh-32px)] overflow-hidden rounded-lg border border-white/10 bg-[#f5f7fb] text-[#0f172a] shadow-float lg:grid-cols-[0.95fr_1.05fr]">
        <section className="flex flex-col justify-between bg-[#102033] p-6 text-white sm:p-10">
          <Link
            href="/login"
            className="flex items-center gap-3 font-display text-xl font-bold tracking-tight"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#7dd3fc] text-[#082f49]">
              <Building2 className="h-6 w-6" aria-hidden="true" />
            </span>
            EducAI Gov
          </Link>

          <div className="max-w-xl py-16">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#7dd3fc]">
              Acceso institucional
            </p>
            <h1 className="mt-5 font-display text-5xl font-bold leading-tight tracking-tight">
              Ingreso seguro para supervision ministerial.
            </h1>
            <p className="mt-5 text-lg leading-8 text-white/72">
              El panel deja de ser una vista abierta de demostracion. La sesion vive en Supabase
              Auth y prepara el terreno para permisos por jurisdiccion, nivel y rol.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/12 bg-white/8 p-4">
              <ShieldCheck className="h-5 w-5 text-[#7dd3fc]" aria-hidden="true" />
              <p className="mt-3 text-sm leading-6 text-white/72">
                Sesion real para equipos ministeriales y jurisdiccionales.
              </p>
            </div>
            <div className="rounded-lg border border-white/12 bg-white/8 p-4">
              <LockKeyhole className="h-5 w-5 text-[#7dd3fc]" aria-hidden="true" />
              <p className="mt-3 text-sm leading-6 text-white/72">
                Base lista para cerrar RBAC y tenant ministerial.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="rounded-lg border border-[#d8e0eb] bg-white p-6 shadow-whisper">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#475569]">
                Panel EducAI Gov
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">Ingresar</h2>
              <form action="/login/enter" method="post" className="mt-6 space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-[#475569]">Email</span>
                  <span className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-[#d8e0eb] bg-[#f8fafc] px-3 text-[#64748b]">
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    <input
                      type="email"
                      name="email"
                      placeholder="supervision@educai.gov"
                      autoComplete="email"
                      disabled={!authReady}
                      className="h-full w-full border-0 bg-transparent p-0 text-[#0f172a] outline-none placeholder:text-[#94a3b8]"
                    />
                  </span>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-[#475569]">Contrasena</span>
                  <span className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-[#d8e0eb] bg-[#f8fafc] px-3 text-[#64748b]">
                    <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                    <input
                      type="password"
                      name="password"
                      placeholder="Tu contrasena"
                      autoComplete="current-password"
                      disabled={!authReady}
                      className="h-full w-full border-0 bg-transparent p-0 text-[#0f172a] outline-none placeholder:text-[#94a3b8]"
                    />
                  </span>
                </label>
                {errorMessage ? (
                  <p className="rounded-lg border border-[#f0c9c9] bg-[#fff4f4] px-3 py-2 text-sm text-[#a33b3b]">
                    {errorMessage}
                  </p>
                ) : null}
                {!authReady ? (
                  <p className="rounded-lg border border-[#d8e0eb] bg-[#eff6ff] px-3 py-2 text-sm text-[#1d4ed8]">
                    Configura las variables de Supabase en `apps/gov-dashboard` antes de habilitar
                    el login.
                  </p>
                ) : null}
                <Button
                  type="submit"
                  size="lg"
                  disabled={!authReady}
                  className="mt-2 w-full bg-[#0f766e] text-white shadow-[0_14px_30px_rgba(15,118,110,0.26)] hover:bg-[#0b5f59] disabled:cursor-not-allowed disabled:bg-[#94a3b8]"
                >
                  Ingresar
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Button>
              </form>

              <p className="mt-5 text-sm leading-6 text-[#64748b]">
                El siguiente corte es aplicar permisos por rol ministerial y limitar la vista por
                tenant o jurisdiccion.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
