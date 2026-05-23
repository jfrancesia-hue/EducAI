import Link from "next/link";
import {
  ArrowLeft,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  MapPin,
  Phone,
  Sparkles,
  UserRound,
} from "lucide-react";

import { Badge, Button } from "@educai/ui";
import { PasswordField } from "../_components/password-field";

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
  const isEducAiSelfService =
    product === "EducAI" && ["free", "docente-individual", "docente-pro"].includes(plan);
  const errorMessage =
    params.error === "exists"
      ? "Ya existe una cuenta con ese email. Inicia sesion o usa otro correo."
      : params.error === "terms"
        ? "Para crear la cuenta tenes que aceptar los terminos y la politica de privacidad."
        : params.error === "google"
          ? "No pudimos iniciar el registro con Google. Intenta de nuevo o usa email y contrasena."
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
              : isEducAiSelfService
                ? "Crea tu cuenta docente, deja armado tu espacio pedagogico y entra directo a planificar clases con IA."
                : "Los planes de colegio e institucional se cierran con acompanamiento comercial para configurar docentes, permisos y alcance."}
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
              <input type="hidden" name="producto" value="apoyoai" />
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
                <PasswordField
                  label="Contrasena"
                  placeholder="Minimo 8 caracteres"
                  autoComplete="new-password"
                />
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

              <label className="flex gap-3 rounded-lg border border-[#d5e1dc] bg-[#fbfffd] p-4 text-sm leading-6 text-slate-700">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  value="yes"
                  required
                  className="mt-1 h-4 w-4 shrink-0 accent-[#087968]"
                />
                <span>
                  Acepto los{" "}
                  <Link href="/terminos" className="font-semibold text-[#075f53] underline">
                    Terminos y condiciones
                  </Link>{" "}
                  y la{" "}
                  <Link href="/privacidad" className="font-semibold text-[#075f53] underline">
                    Politica de privacidad
                  </Link>
                  . Declaro que soy adulto responsable y autorizo el uso de los datos cargados para
                  prestar el servicio educativo.
                </span>
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button size="lg" pill className="bg-[#ff7a1a] text-white hover:bg-[#ea6508]">
                  Crear familia ApoyoAI
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                </Button>
                <Button
                  size="lg"
                  pill
                  variant="outline"
                  formAction="/registro/google"
                  formNoValidate
                  className="border-[#d5e1dc] bg-white"
                >
                  Registrarme con Google
                  <span className="font-display text-lg font-bold" aria-hidden="true">
                    G
                  </span>
                </Button>
                <Button asChild size="lg" pill variant="outline" className="border-[#d5e1dc]">
                  <Link href={`/contacto?producto=apoyoai&plan=${plan}`}>
                    Hablar con ventas
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </form>
          ) : isEducAiSelfService ? (
            <form action="/registro/educai" method="post" className="mt-6 grid gap-5">
              <input type="hidden" name="producto" value="educai" />
              <input type="hidden" name="plan" value={plan} />

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">Nombre docente</span>
                  <span className="flex h-12 items-center gap-3 rounded-lg border border-[#d5e1dc] bg-[#fbfffd] px-3">
                    <UserRound className="h-4 w-4 text-[#087968]" aria-hidden="true" />
                    <input
                      name="fullName"
                      required
                      placeholder="Mariana Lopez"
                      className="h-full w-full bg-transparent outline-none"
                    />
                  </span>
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">Rol o cargo</span>
                  <input
                    name="title"
                    placeholder="Docente de primaria"
                    className="h-12 rounded-lg border border-[#d5e1dc] bg-[#fbfffd] px-3 outline-none"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">Email</span>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="docente@colegio.edu.ar"
                    className="h-12 rounded-lg border border-[#d5e1dc] bg-[#fbfffd] px-3 outline-none"
                  />
                </label>
                <PasswordField
                  label="Contrasena"
                  placeholder="Minimo 8 caracteres"
                  autoComplete="new-password"
                />
              </div>

              <div className="rounded-lg border border-[#d5e1dc] bg-[#fbfffd] p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Escuela o espacio de trabajo
                    </span>
                    <span className="flex h-12 items-center gap-3 rounded-lg border border-[#d5e1dc] bg-white px-3">
                      <Building2 className="h-4 w-4 text-[#087968]" aria-hidden="true" />
                      <input
                        name="schoolName"
                        placeholder="Colegio del Valle"
                        className="h-full w-full bg-transparent outline-none"
                      />
                    </span>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-700">Materias</span>
                    <span className="flex h-12 items-center gap-3 rounded-lg border border-[#d5e1dc] bg-white px-3">
                      <BookOpenCheck className="h-4 w-4 text-[#087968]" aria-hidden="true" />
                      <input
                        name="subjects"
                        placeholder="Matematica, Ciencias"
                        className="h-full w-full bg-transparent outline-none"
                      />
                    </span>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-700">Provincia</span>
                    <span className="flex h-12 items-center gap-3 rounded-lg border border-[#d5e1dc] bg-white px-3">
                      <MapPin className="h-4 w-4 text-[#087968]" aria-hidden="true" />
                      <input
                        name="province"
                        placeholder="Catamarca"
                        className="h-full w-full bg-transparent outline-none"
                      />
                    </span>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-700">Ciudad</span>
                    <input
                      name="city"
                      placeholder="San Fernando del Valle"
                      className="h-12 rounded-lg border border-[#d5e1dc] bg-white px-3 outline-none"
                    />
                  </label>
                </div>
              </div>

              <label className="flex gap-3 rounded-lg border border-[#d5e1dc] bg-[#fbfffd] p-4 text-sm leading-6 text-slate-700">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  value="yes"
                  required
                  className="mt-1 h-4 w-4 shrink-0 accent-[#087968]"
                />
                <span>
                  Acepto los{" "}
                  <Link href="/terminos" className="font-semibold text-[#075f53] underline">
                    Terminos y condiciones
                  </Link>{" "}
                  y la{" "}
                  <Link href="/privacidad" className="font-semibold text-[#075f53] underline">
                    Politica de privacidad
                  </Link>
                  . Entiendo que EducAI genera borradores pedagogicos que deben ser revisados antes
                  de usarse con estudiantes.
                </span>
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button size="lg" pill className="bg-[#ff7a1a] text-white hover:bg-[#ea6508]">
                  Crear cuenta docente
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                </Button>
                <Button
                  size="lg"
                  pill
                  variant="outline"
                  formAction="/registro/google"
                  formNoValidate
                  className="border-[#d5e1dc] bg-white"
                >
                  Registrarme con Google
                  <span className="font-display text-lg font-bold" aria-hidden="true">
                    G
                  </span>
                </Button>
                <Button asChild size="lg" pill variant="outline" className="border-[#d5e1dc]">
                  <Link href={`/contacto?producto=educai&plan=${plan}`}>
                    Hablar con ventas
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </form>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button asChild size="lg" pill variant="outline" className="border-[#d5e1dc]">
                <Link href={`/contacto?producto=${params.producto ?? "educai"}&plan=${plan}`}>
                  Hablar con ventas
                  <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" pill className="bg-[#ff7a1a] text-white hover:bg-[#ea6508]">
                <Link href="/login">
                  Ingresar si ya tenes cuenta
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          )}
        </section>
        <p className="mt-5 text-center text-sm font-medium text-slate-600">
          Ya tenes cuenta?{" "}
          <Link href="/login" className="font-bold text-[#075f53] underline">
            Ingresar
          </Link>
        </p>
      </div>
    </main>
  );
}
