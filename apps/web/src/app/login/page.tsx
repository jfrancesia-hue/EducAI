import Link from "next/link";
import { ArrowRight, GraduationCap, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

import { Button } from "@educai/ui";
import { VisualImage } from "../_components/visual-image";

const loginImage =
  "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1400&q=85";

type LoginPageProps = {
  searchParams?: {
    error?: string;
    next?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const nextPath = safeNextPath(searchParams?.next);
  const localLoginUrl = buildAuthUrl("/api/auth/local-login", nextPath);
  const hasCredentialError = searchParams?.error === "credenciales";
  const hasTermsError = searchParams?.error === "terminos";

  return (
    <main className="min-h-screen bg-[#11231f] p-4 text-white sm:p-6">
      <div className="grid min-h-[calc(100vh-32px)] overflow-hidden rounded-lg border border-white/12 bg-[#faf8f0] text-[#14120f] shadow-float lg:grid-cols-[1.03fr_0.97fr]">
        <section className="relative flex min-h-[560px] flex-col justify-between overflow-hidden bg-[#1f2a24] p-6 text-white sm:p-10">
          <VisualImage
            src={loginImage}
            alt="Docente acompanando una actividad en el aula"
            fill
            priority
            sizes="(min-width: 1024px) 52vw, 100vw"
            className="object-cover opacity-38"
            fallbackTitle="Acceso institucional"
          />
          <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(17,35,31,0.98)_0%,rgba(17,35,31,0.83)_54%,rgba(17,35,31,0.36)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(24,182,164,0.22)_0%,transparent_38%),linear-gradient(18deg,transparent_0%,rgba(248,217,92,0.16)_74%,rgba(239,93,168,0.12)_100%)]" />

          <Link
            href="/"
            className="relative z-10 flex items-center gap-3 font-display text-xl font-bold tracking-tight"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#f7d95c] text-[#1f2a24]">
              <GraduationCap className="h-6 w-6" aria-hidden="true" />
            </span>
            EducAI
          </Link>

          <div className="relative z-10 max-w-xl py-16">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#f7d95c]">
              Acceso institucional
            </p>
            <h1 className="mt-5 font-display text-5xl font-bold leading-tight tracking-tight">
              Ingreso seguro, claro y listo para vender a colegios.
            </h1>
            <p className="mt-5 text-lg leading-8 text-white/70">
              Cada escuela entra con su tenant, sus roles y una experiencia cuidada desde el primer
              contacto. Despues del login te llevamos directo a la plataforma.
            </p>
          </div>

          <div className="relative z-10 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/12 bg-white/8 p-4">
              <ShieldCheck className="h-5 w-5 text-[#f7d95c]" aria-hidden="true" />
              <p className="mt-3 text-sm leading-6 text-white/70">
                Acceso basado en JWT, roles y aislamiento por tenant.
              </p>
            </div>
            <div className="rounded-lg border border-white/12 bg-white/8 p-4">
              <LockKeyhole className="h-5 w-5 text-[#f7d95c]" aria-hidden="true" />
              <p className="mt-3 text-sm leading-6 text-white/70">
                Las rutas internas quedan bloqueadas sin sesion.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-lg">
            <div className="rounded-lg border border-[#ded6c7] bg-white p-6 shadow-whisper">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#4f5f58]">
                Panel EducAI
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">
                Entrar a la plataforma
              </h2>
              {hasCredentialError ? (
                <div className="mt-5 rounded-lg border border-[#ef5da8]/35 bg-[#fdeaf4] p-3 text-sm font-medium text-[#b82170]">
                  Usuario o contrasena incorrectos.
                </div>
              ) : null}
              {hasTermsError ? (
                <div className="mt-5 rounded-lg border border-[#f8d95c]/40 bg-[#fff6c9] p-3 text-sm font-medium text-[#876100]">
                  Debes aceptar terminos y privacidad para continuar.
                </div>
              ) : null}

              <form action={localLoginUrl} className="mt-6 space-y-4" method="post">
                <input type="hidden" name="next" value={nextPath} />
                <label className="block">
                  <span className="text-sm font-medium text-[#5f5647]">Email institucional</span>
                  <span className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-[#ded6c7] bg-[#fbfaf5] px-3 text-[#7b725f] focus-within:border-[#18b6a4]">
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    <input
                      className="h-full w-full bg-transparent text-[#14120f] outline-none placeholder:text-[#9a907d]"
                      name="email"
                      placeholder="usuario@institucion.edu"
                      type="email"
                      autoComplete="email"
                      required
                    />
                  </span>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-[#5f5647]">Contrasena</span>
                  <span className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-[#ded6c7] bg-[#fbfaf5] px-3 text-[#7b725f] focus-within:border-[#18b6a4]">
                    <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                    <input
                      className="h-full w-full bg-transparent text-[#14120f] outline-none placeholder:text-[#9a907d]"
                      name="password"
                      placeholder="••••••••••"
                      type="password"
                      autoComplete="current-password"
                      required
                    />
                  </span>
                </label>

                <label className="flex gap-3 rounded-lg border border-[#ded6c7] bg-[#fbfaf5] p-3 text-sm leading-6 text-[#5f5647]">
                  <input
                    required
                    className="mt-1 h-4 w-4 rounded border-[#ded6c7] accent-[#18b6a4]"
                    name="acceptTerms"
                    type="checkbox"
                  />
                  <span>
                    Acepto los{" "}
                    <Link className="font-semibold text-[#087968] underline" href="/terminos">
                      terminos y condiciones
                    </Link>{" "}
                    y la{" "}
                    <Link className="font-semibold text-[#087968] underline" href="/privacidad">
                      politica de privacidad
                    </Link>{" "}
                    de EducAI.
                  </span>
                </label>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-[#ff7a1a] text-white shadow-[0_14px_30px_rgba(255,122,26,0.28)] hover:bg-[#ea6508]"
                >
                  Continuar con acceso seguro
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Button>
              </form>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Button asChild variant="outline" className="border-[#ded6c7] bg-[#fbfaf5]">
                  <Link href="/planes">Ver planes</Link>
                </Button>
                <Button asChild variant="ghost" className="text-[#11231f]">
                  <Link href="/contacto">Solicitar acceso</Link>
                </Button>
              </div>

              <p className="mt-5 text-sm leading-6 text-[#7b725f]">
                Acceso restringido. Si necesitas una invitacion para el piloto, escribinos desde
                <Link className="ml-1 font-semibold text-[#087968] underline" href="/contacto">
                  /contacto
                </Link>
                .
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function safeNextPath(next?: string): string {
  if (!next?.startsWith("/") || next.startsWith("//")) {
    return "/app";
  }
  return next;
}

function buildAuthUrl(authUrl: string, nextPath: string): string {
  if (authUrl.startsWith("/")) {
    const url = new URL(authUrl, "https://educai.local");
    url.searchParams.set("next", nextPath);
    return `${url.pathname}${url.search}`;
  }

  const url = new URL(authUrl);
  url.searchParams.set("next", nextPath);
  return url.toString();
}
