import Link from "next/link";
import Image from "next/image";
import { ArrowRight, GraduationCap, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

import { Button } from "@educai/ui";
import { PasswordField } from "../_components/password-field";
import { hasSupabaseEnv } from "../../lib/supabase/env";

const loginHeroImage =
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1400&q=85";

const errorMessages: Record<string, string> = {
  config: "El acceso no esta disponible en este momento. Reintenta en unos minutos.",
  invalid: "Email o contrasena incorrectos.",
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
  const nextPath =
    typeof searchParams?.next === "string"
      ? searchParams.next
      : Array.isArray(searchParams?.next)
        ? searchParams.next[0]
        : "";
  const errorMessage = errorCode ? (errorMessages[errorCode] ?? null) : null;

  return (
    <main className="min-h-screen bg-[#62dcca] p-4 text-slate-950 sm:p-6">
      <div className="grid min-h-[calc(100vh-32px)] overflow-hidden rounded-lg border border-white/45 bg-[#faf8f0] text-[#14120f] shadow-float lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative flex flex-col justify-between overflow-hidden bg-[#62dcca] p-6 text-slate-950 sm:p-10">
          <Image
            src={loginHeroImage}
            alt="Docente acompanando a estudiantes felices en el aula"
            fill
            priority
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[#62dcca]/72" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(98,220,202,0.94)_0%,rgba(98,220,202,0.78)_48%,rgba(98,220,202,0.46)_100%)]" />
          <Link
            href="/"
            className="relative z-10 flex items-center gap-3 font-display text-xl font-bold tracking-tight"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-[#075f53]">
              <GraduationCap className="h-6 w-6" aria-hidden="true" />
            </span>
            EducAI
          </Link>

          <div className="relative z-10 max-w-xl py-16">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#075f53]">
              Acceso seguro
            </p>
            <h1 className="mt-5 font-display text-5xl font-bold leading-tight tracking-tight">
              Entra a tu espacio de trabajo.
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-700">
              Planifica clases, revisa estudiantes y organiza recursos pedagogicos desde un entorno
              privado para tu institucion.
            </p>
          </div>

          <div className="relative z-10 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/55 bg-white/62 p-4 backdrop-blur-xl">
              <ShieldCheck className="h-5 w-5 text-[#075f53]" aria-hidden="true" />
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Acceso protegido para equipos docentes.
              </p>
            </div>
            <div className="rounded-lg border border-white/55 bg-white/62 p-4 backdrop-blur-xl">
              <LockKeyhole className="h-5 w-5 text-[#075f53]" aria-hidden="true" />
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Cada usuario ingresa al espacio que le corresponde.
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
                {nextPath?.startsWith("/app") ? (
                  <input type="hidden" name="next" value={nextPath} />
                ) : null}
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
                <PasswordField disabled={!authReady} />
                {errorMessage ? (
                  <p className="rounded-lg border border-[#f0c9c9] bg-[#fff4f4] px-3 py-2 text-sm text-[#a33b3b]">
                    {errorMessage}
                  </p>
                ) : null}
                {!authReady ? (
                  <p className="rounded-lg border border-[#eadca8] bg-[#fff8dd] px-3 py-2 text-sm text-[#7a5c00]">
                    El acceso esta temporalmente fuera de servicio.
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
                Usamos tu cuenta institucional para mostrarte las herramientas y la informacion que
                corresponden a tu rol.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
