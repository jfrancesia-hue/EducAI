import Link from "next/link";
import { ArrowRight, GraduationCap, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

import { Button } from "@educai/ui";
import { hasSupabaseEnv } from "../../lib/supabase/env";

const errorMessages: Record<string, string> = {
  config: "Falta configurar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en web.",
  invalid: "Las credenciales no son validas o el usuario no existe en Supabase Auth.",
  missing: "Completa email y contrasena para iniciar sesion.",
};

export default function LoginPage({
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
    <main className="min-h-screen bg-[#1f2a24] p-4 text-white sm:p-6">
      <div className="grid min-h-[calc(100vh-32px)] overflow-hidden rounded-lg border border-white/12 bg-[#faf8f0] text-[#14120f] shadow-float lg:grid-cols-[0.9fr_1.1fr]">
        <section className="flex flex-col justify-between bg-[#1f2a24] p-6 text-white sm:p-10">
          <Link
            href="/"
            className="flex items-center gap-3 font-display text-xl font-bold tracking-tight"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#f7d95c] text-[#1f2a24]">
              <GraduationCap className="h-6 w-6" aria-hidden="true" />
            </span>
            EducAI
          </Link>

          <div className="max-w-xl py-16">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#f7d95c]">
              Acceso seguro
            </p>
            <h1 className="mt-5 font-display text-5xl font-bold leading-tight tracking-tight">
              Entra con tu cuenta real de EducAI.
            </h1>
            <p className="mt-5 text-lg leading-8 text-white/70">
              Este acceso ya no usa una cookie demo. La sesion vive en Supabase Auth y es la base
              para cerrar permisos, roles y aislamiento real por tenant.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/12 bg-white/8 p-4">
              <ShieldCheck className="h-5 w-5 text-[#f7d95c]" aria-hidden="true" />
              <p className="mt-3 text-sm leading-6 text-white/70">
                Sesion real respaldada por Supabase Auth.
              </p>
            </div>
            <div className="rounded-lg border border-white/12 bg-white/8 p-4">
              <LockKeyhole className="h-5 w-5 text-[#f7d95c]" aria-hidden="true" />
              <p className="mt-3 text-sm leading-6 text-white/70">
                Primer paso para conectar RBAC y contexto de tenant.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="rounded-lg border border-[#ded6c7] bg-white p-6 shadow-whisper">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#4f5f58]">
                Cuenta institucional
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">Ingresar</h2>
              <form action="/login/enter" method="post" className="mt-6 space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-[#5f5647]">Email</span>
                  <span className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-[#ded6c7] bg-[#fbfaf5] px-3 text-[#7b725f]">
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    <input
                      type="email"
                      name="email"
                      placeholder="docente@colegio.edu.ar"
                      autoComplete="email"
                      disabled={!authReady}
                      className="h-full w-full border-0 bg-transparent p-0 text-[#14120f] outline-none placeholder:text-[#9b917f]"
                    />
                  </span>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-[#5f5647]">Contrasena</span>
                  <span className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-[#ded6c7] bg-[#fbfaf5] px-3 text-[#7b725f]">
                    <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                    <input
                      type="password"
                      name="password"
                      placeholder="Tu contrasena"
                      autoComplete="current-password"
                      disabled={!authReady}
                      className="h-full w-full border-0 bg-transparent p-0 text-[#14120f] outline-none placeholder:text-[#9b917f]"
                    />
                  </span>
                </label>
                {errorMessage ? (
                  <p className="rounded-lg border border-[#f0c9c9] bg-[#fff4f4] px-3 py-2 text-sm text-[#a33b3b]">
                    {errorMessage}
                  </p>
                ) : null}
                {!authReady ? (
                  <p className="rounded-lg border border-[#eadca8] bg-[#fff8dd] px-3 py-2 text-sm text-[#7a5c00]">
                    Configura las variables de Supabase en `apps/web` antes de habilitar login.
                  </p>
                ) : null}

                <Button
                  type="submit"
                  size="lg"
                  disabled={!authReady}
                  className="mt-2 w-full bg-[#ff7a1a] text-white shadow-[0_14px_30px_rgba(255,122,26,0.28)] hover:bg-[#ea6508] disabled:cursor-not-allowed disabled:bg-[#d6b7a0]"
                >
                  Entrar
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Button>
              </form>

              <p className="mt-5 text-sm leading-6 text-[#7b725f]">
                La cuenta se valida contra Supabase Auth. El siguiente corte es mapear rol y tenant
                desde la sesion para cerrar permisos reales.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
