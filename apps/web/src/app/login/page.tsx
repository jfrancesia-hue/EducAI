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
  google: "No pudimos iniciar sesion con Google. Intenta de nuevo.",
  invalid: "Email o contrasena incorrectos.",
  missing: "Completa email y contrasena para iniciar sesion.",
};

const registeredMessages: Record<string, string> = {
  educai: "Cuenta docente creada. Ya podes ingresar a EducAI.",
  apoyoai: "Cuenta familiar creada. Ya podes ingresar a ApoyoAI.",
};

const passwordMessages: Record<string, string> = {
  updated: "Contrasena actualizada. Ya podes ingresar con la nueva clave.",
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
  const email =
    typeof searchParams?.email === "string"
      ? searchParams.email
      : Array.isArray(searchParams?.email)
        ? searchParams.email[0]
        : "";
  const registered =
    typeof searchParams?.registered === "string"
      ? searchParams.registered
      : Array.isArray(searchParams?.registered)
        ? searchParams.registered[0]
        : undefined;
  const payment =
    typeof searchParams?.payment === "string"
      ? searchParams.payment
      : Array.isArray(searchParams?.payment)
        ? searchParams.payment[0]
        : undefined;
  const password =
    typeof searchParams?.password === "string"
      ? searchParams.password
      : Array.isArray(searchParams?.password)
        ? searchParams.password[0]
        : undefined;
  const errorMessage = errorCode ? (errorMessages[errorCode] ?? null) : null;
  const registeredMessage = registered
    ? payment === "success"
      ? registered === "educai"
        ? "Pago recibido. Vamos a activar tu plan docente y, si no ves cambios, escribinos."
        : "Pago confirmado. Ya podes ingresar."
      : payment === "pending"
        ? registered === "educai"
          ? "Tu pago docente esta pendiente. Cuando se confirme, activamos el plan y te avisamos."
          : "Tu pago esta pendiente. Cuando se confirme, vas a poder usar el plan contratado."
        : (registeredMessages[registered] ?? null)
    : null;
  const passwordMessage = password ? (passwordMessages[password] ?? null) : null;

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
              Entra a EducAI para preparar clases o a ApoyoAI para acompanar el aprendizaje desde
              casa, siempre con el acceso que corresponde a tu rol.
            </p>
          </div>

          <div className="relative z-10 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/55 bg-white/62 p-4 backdrop-blur-xl">
              <ShieldCheck className="h-5 w-5 text-[#075f53]" aria-hidden="true" />
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Acceso protegido para docentes, familias e instituciones.
              </p>
            </div>
            <div className="rounded-lg border border-white/55 bg-white/62 p-4 backdrop-blur-xl">
              <LockKeyhole className="h-5 w-5 text-[#075f53]" aria-hidden="true" />
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Cada usuario entra al panel que le corresponde.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="rounded-lg border border-[#ded6c7] bg-white p-6 shadow-whisper">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#4f5f58]">
                Cuenta EducAI o ApoyoAI
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">Ingresar</h2>
              {registeredMessage || passwordMessage ? (
                <p className="mt-4 rounded-lg border border-[#18b6a4]/35 bg-[#e7fbf7] px-3 py-2 text-sm font-medium text-[#075c50]">
                  {registeredMessage ?? passwordMessage}
                </p>
              ) : null}
              <form action="/login/enter" method="post" className="mt-6 space-y-4">
                {nextPath?.startsWith("/app") || nextPath?.startsWith("/familia") ? (
                  <input type="hidden" name="next" value={nextPath} />
                ) : null}
                <label className="block">
                  <span className="text-sm font-medium text-[#5f5647]">Email</span>
                  <span className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-[#ded6c7] bg-[#fbfaf5] px-3 text-[#7b725f]">
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    <input
                      type="email"
                      name="email"
                      placeholder="tu@email.com"
                      autoComplete="email"
                      defaultValue={email}
                      disabled={!authReady}
                      className="h-full w-full border-0 bg-transparent p-0 text-[#14120f] outline-none placeholder:text-[#9b917f]"
                    />
                  </span>
                </label>
                <PasswordField disabled={!authReady} />
                <div className="flex justify-end">
                  <Link
                    href="/recuperar-password"
                    className="text-sm font-bold text-[#075f53] underline"
                  >
                    Olvide mi contrasena
                  </Link>
                </div>
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
                <Button
                  type="submit"
                  size="lg"
                  formAction="/login/google"
                  formNoValidate
                  disabled={!authReady}
                  variant="outline"
                  className="w-full border-[#d5e1dc] bg-white text-[#14120f] hover:bg-[#f7f8f3] disabled:cursor-not-allowed disabled:bg-[#ebe4d8]"
                >
                  <span className="font-display text-lg font-bold" aria-hidden="true">
                    G
                  </span>
                  Ingresar con Google
                </Button>
              </form>

              <p className="mt-5 text-sm leading-6 text-[#7b725f]">
                Usamos tu cuenta para mostrarte las herramientas y la informacion que corresponden a
                tu rol.
              </p>
              <div className="mt-5 grid gap-3 border-t border-[#ded6c7] pt-5">
                <p className="text-sm font-semibold text-[#4f5f58]">Todavia no tenes cuenta?</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    asChild
                    variant="outline"
                    className="border-[#d5e1dc] bg-[#fbfaf5] text-[#075f53] hover:bg-[#e7fbf7]"
                  >
                    <Link href="/registro?producto=educai&plan=free">Registrarme como docente</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-[#d5e1dc] bg-[#fbfaf5] text-[#075f53] hover:bg-[#e7fbf7]"
                  >
                    <Link href="/registro?producto=apoyoai&plan=free">Crear cuenta familiar</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
