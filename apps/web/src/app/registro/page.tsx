import Link from "next/link";
import { ArrowLeft, CheckCircle2, Phone, Sparkles, UserRound } from "lucide-react";

import { Badge, Button } from "@educai/ui";

type RegisterPageProps = {
  searchParams?: Promise<{
    producto?: string;
    plan?: string;
    error?: string;
  }>;
};

const labels: Record<string, string> = {
  educai: "EducAI",
  apoyoai: "ApoyoAI",
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = (await searchParams) ?? {};
  const product = labels[params.producto ?? ""] ?? "EducAI";
  const plan = params.plan ?? "free";
  const isApoyoAi = product === "ApoyoAI";
  const errorMessage =
    params.error === "exists"
      ? "Ya existe una cuenta con ese email. Inicia sesion o usa otro correo."
      : params.error
        ? "No pudimos completar el registro. Revisa los datos e intenta de nuevo."
        : null;

  return (
    <main className="min-h-screen bg-[#f7f8f3] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Button asChild variant="outline" pill className="border-[#d5e1dc] bg-white text-slate-900">
          <Link href={product === "ApoyoAI" ? "/apoyoai/precios" : "/precios"}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver a planes
          </Link>
        </Button>

        <section className="mt-8 rounded-lg border border-[#d5e1dc] bg-white p-6 shadow-whisper sm:p-8">
          <Badge className="bg-[#d8f7ee] text-[#075c50]">Registro</Badge>
          <h1 className="mt-5 font-display text-4xl font-bold tracking-tight">
            Crear cuenta para {product}
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-slate-600">
            {isApoyoAi
              ? "Crea la cuenta familiar, carga el primer alumno y deja vinculado WhatsApp para que el tutor pueda reconocer al adulto o al hijo."
              : "Dejamos el plan preseleccionado en la URL para conectar el alta docente e institucional."}
          </p>

          <div className="mt-6 grid gap-3 rounded-lg bg-[#f7f8f3] p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-600">Producto</span>
              <span className="font-display text-xl font-bold">{product}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-[#d5e1dc] pt-3">
              <span className="text-sm font-semibold text-slate-600">Plan</span>
              <span className="font-display text-xl font-bold">{plan}</span>
            </div>
          </div>

          {errorMessage ? (
            <p className="mt-5 rounded-lg border border-[#f0c9c9] bg-[#fff4f4] px-4 py-3 text-sm text-[#a33b3b]">
              {errorMessage}
            </p>
          ) : null}

          {isApoyoAi ? (
            <form action="/registro/apoyoai" method="post" className="mt-6 grid gap-5">
              <input type="hidden" name="plan" value={plan} />

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">Nombre del adulto</span>
                  <span className="flex h-12 items-center gap-3 rounded-lg border border-[#d5e1dc] bg-[#fbfffd] px-3">
                    <UserRound className="h-4 w-4 text-[#087968]" aria-hidden="true" />
                    <input
                      name="parentFullName"
                      required
                      placeholder="Jorge Francesia"
                      className="h-full w-full bg-transparent outline-none"
                    />
                  </span>
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">WhatsApp del adulto</span>
                  <span className="flex h-12 items-center gap-3 rounded-lg border border-[#d5e1dc] bg-[#fbfffd] px-3">
                    <Phone className="h-4 w-4 text-[#087968]" aria-hidden="true" />
                    <input
                      name="parentWhatsappPhone"
                      required
                      placeholder="+5493834000000"
                      className="h-full w-full bg-transparent outline-none"
                    />
                  </span>
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">Email</span>
                  <input
                    type="email"
                    name="parentEmail"
                    required
                    placeholder="familia@email.com"
                    className="h-12 rounded-lg border border-[#d5e1dc] bg-[#fbfffd] px-3 outline-none"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">Contrasena</span>
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={8}
                    placeholder="Minimo 8 caracteres"
                    className="h-12 rounded-lg border border-[#d5e1dc] bg-[#fbfffd] px-3 outline-none"
                  />
                </label>
              </div>

              <div className="rounded-lg border border-[#d5e1dc] bg-[#fbfffd] p-4">
                <div className="grid gap-4 md:grid-cols-[1fr_1fr_120px]">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-700">Nombre del alumno</span>
                    <input
                      name="studentFirstName"
                      required
                      placeholder="Mateo"
                      className="h-12 rounded-lg border border-[#d5e1dc] bg-white px-3 outline-none"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-700">Apellido</span>
                    <input
                      name="studentLastName"
                      required
                      placeholder="Francesia"
                      className="h-12 rounded-lg border border-[#d5e1dc] bg-white px-3 outline-none"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-700">Grado</span>
                    <input
                      type="number"
                      name="studentGrade"
                      required
                      min={1}
                      max={12}
                      placeholder="6"
                      className="h-12 rounded-lg border border-[#d5e1dc] bg-white px-3 outline-none"
                    />
                  </label>
                </div>
                <label className="mt-4 grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">
                    WhatsApp del alumno, si usa uno distinto
                  </span>
                  <input
                    name="studentWhatsappPhone"
                    placeholder="+5493834000001"
                    className="h-12 rounded-lg border border-[#d5e1dc] bg-white px-3 outline-none"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button size="lg" pill className="bg-[#ff7a1a] text-white hover:bg-[#ea6508]">
                  Crear familia ApoyoAI
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                </Button>
                <Button asChild size="lg" pill variant="outline" className="border-[#d5e1dc]">
                  <Link href={`/contacto?producto=apoyoai&plan=${plan}`}>
                    Hablar con ventas
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </form>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button asChild size="lg" pill className="bg-[#ff7a1a] text-white hover:bg-[#ea6508]">
                <Link href="/login">
                  Continuar con acceso
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" pill variant="outline" className="border-[#d5e1dc]">
                <Link href={`/contacto?producto=${params.producto ?? "educai"}&plan=${plan}`}>
                  Hablar con ventas
                  <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
