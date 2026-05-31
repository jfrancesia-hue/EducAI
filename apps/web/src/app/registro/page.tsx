import Link from "next/link";
import {
  BookOpenCheck,
  Building2,
  Crown,
  GraduationCap,
  Landmark,
  MapPin,
  Phone,
  Rocket,
  School,
  Sparkles,
  UserRound,
  UsersRound,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge, Button } from "@educai/ui";
import { apoyoAiPublicPlans, educaiPublicPlans, type PublicPricingPlan } from "../../lib/pricing";
import { PasswordField } from "../_components/password-field";
import { BackButton } from "../_components/back-button";

type RegisterPageProps = {
  searchParams?: Promise<{
    producto?: string;
    plan?: string;
    error?: string;
  }>;
};

type ProductId = "educai" | "apoyoai";

const educaiSelfServicePlans = educaiPublicPlans.filter((plan) =>
  ["free", "docente-individual", "docente-pro"].includes(plan.id),
);

function registerHref(product: ProductId, plan = "free") {
  return {
    pathname: "/registro",
    query: { producto: product, plan },
  };
}

function pricingHref(product: ProductId) {
  return product === "apoyoai" ? "/precios#apoyoai" : "/precios";
}

function normalizeProduct(value?: string): ProductId {
  return value === "apoyoai" ? "apoyoai" : "educai";
}

function normalizePlan(plans: PublicPricingPlan[], value?: string) {
  return plans.some((plan) => plan.id === value) ? (value ?? "free") : "free";
}

function planHighlights(plan: PublicPricingPlan) {
  return plan.includes.slice(0, 3);
}

const registerPlanIcons: Record<string, LucideIcon> = {
  free: Sparkles,
  "docente-individual": GraduationCap,
  "docente-pro": Crown,
  colegio: School,
  institucional: Landmark,
  basico: Rocket,
  plus: Zap,
  familiar: UsersRound,
  intensivo: Building2,
};

const registerPlanTones: Record<string, string> = {
  free: "border-[#18b6a4]/20 bg-[#e7fbf7] text-[#087968]",
  "docente-individual": "border-[#7c6cff]/22 bg-[#efedff] text-[#4f3ee2]",
  "docente-pro": "border-[#ff7a1a]/25 bg-[#fff3e9] text-[#c24f00]",
  colegio: "border-[#f8d95c]/40 bg-[#fff6c9] text-[#876100]",
  institucional: "border-[#ef5da8]/24 bg-[#fdeaf4] text-[#b82170]",
  basico: "border-[#18b6a4]/20 bg-[#e7fbf7] text-[#087968]",
  plus: "border-[#ff7a1a]/25 bg-[#fff3e9] text-[#c24f00]",
  familiar: "border-[#7c6cff]/22 bg-[#efedff] text-[#4f3ee2]",
  intensivo: "border-[#ef5da8]/24 bg-[#fdeaf4] text-[#b82170]",
};

function PlanChooser({
  plans,
  selectedPlanId,
}: {
  plans: PublicPricingPlan[];
  selectedPlanId: string;
}) {
  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-bold text-slate-800">Elegir plan</legend>
      <div className="grid gap-3 md:grid-cols-3">
        {plans.map((plan) => {
          const isFree = plan.id === "free";
          const PlanIcon = registerPlanIcons[plan.id] ?? Sparkles;
          const iconTone = registerPlanTones[plan.id] ?? registerPlanTones.free;
          return (
            <label key={plan.id} className="cursor-pointer">
              <input
                type="radio"
                name="plan"
                value={plan.id}
                defaultChecked={plan.id === selectedPlanId}
                className="peer sr-only"
              />
              <span className="group block h-full overflow-hidden rounded-[1.25rem] border border-[#d5e1dc] bg-[#fbfffd] p-4 shadow-whisper transition duration-300 hover:-translate-y-1 hover:border-[#18b6a4]/35 hover:bg-white peer-checked:border-[#18b6a4] peer-checked:bg-[#d8f7ee] peer-checked:ring-2 peer-checked:ring-[#18b6a4]/25">
                <span className="flex items-start gap-3">
                  <span
                    className={[
                      "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-whisper",
                      iconTone,
                    ].join(" ")}
                  >
                    <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-white bg-current opacity-35" />
                    <PlanIcon className="relative h-6 w-6 stroke-[2.4]" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-display text-lg font-bold">{plan.name}</span>
                    <span className="mt-1 block text-sm font-semibold text-slate-700">
                      {plan.price}
                    </span>
                  </span>
                  <span className="ml-auto">
                    {plan.featured ? (
                      <Badge className="bg-[#ff7a1a] text-white">Recomendado</Badge>
                    ) : isFree ? (
                      <Badge className="bg-white text-[#075f53]">Sin tarjeta</Badge>
                    ) : null}
                  </span>
                </span>
                <span className="mt-3 block text-sm leading-6 text-slate-600">
                  {plan.description}
                </span>
                <span className="mt-4 grid gap-2">
                  {planHighlights(plan).map((item) => (
                    <span key={item} className="flex gap-2 text-sm font-semibold text-slate-700">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#18b6a4]" />
                      <span>{item}</span>
                    </span>
                  ))}
                </span>
              </span>
            </label>
          );
        })}
      </div>
      <p className="rounded-2xl border border-[#b9e6dd] bg-[#e7fbf7] px-4 py-3 text-sm font-semibold leading-6 text-[#075f53]">
        Free crea la cuenta sin tarjeta. Si elegís un plan pago, guardamos tus datos y después te
        llevamos a Mercado Pago para completar la contratación.
      </p>
    </fieldset>
  );
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = (await searchParams) ?? {};
  const product = normalizeProduct(params.producto);
  const isApoyoAi = product === "apoyoai";
  const plans = isApoyoAi ? apoyoAiPublicPlans : educaiSelfServicePlans;
  const plan = normalizePlan(plans, params.plan);
  const selectedPlan = plans.find((item) => item.id === plan) ?? plans[0];
  const errorMessage =
    params.error === "exists"
      ? "Ya existe una cuenta con ese email. Iniciá sesión o usá otro correo."
      : params.error === "terms"
        ? "Para crear la cuenta tenés que aceptar los términos y la política de privacidad."
        : params.error === "google"
          ? "No pudimos iniciar el registro con Google. Intentá de nuevo o usá email y contraseña."
          : params.error === "payment"
            ? "No pudimos iniciar el pago. Probá otra vez o escribinos para ayudarte."
            : params.error
              ? "No pudimos completar el registro. Revisá los datos e intentá de nuevo."
              : null;

  return (
    <main className="min-h-screen bg-[#f7f8f3] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center gap-3">
          <BackButton fallbackHref="/" label="Volver" showIcon />
          <Button
            asChild
            variant="outline"
            pill
            className="border-[#d5e1dc] bg-white text-slate-900"
          >
            <Link href={pricingHref(product)}>Ver planes</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            pill
            className="border-[#d5e1dc] bg-white text-slate-900"
          >
            <Link href="/login">Ingresar</Link>
          </Button>
        </div>

        <section className="mt-8 rounded-lg border border-[#d5e1dc] bg-white p-6 shadow-whisper sm:p-8">
          <div className="grid gap-3 rounded-lg bg-[#f7f8f3] p-2 sm:grid-cols-2">
            <Button
              asChild
              pill
              variant={isApoyoAi ? "outline" : "default"}
              className={
                isApoyoAi
                  ? "border-[#d5e1dc] bg-white text-slate-900"
                  : "bg-[#18b6a4] text-white hover:bg-[#119b8c]"
              }
            >
              <Link href={registerHref("educai")}>
                <GraduationCap className="h-4 w-4" aria-hidden="true" />
                EducAI docentes
              </Link>
            </Button>
            <Button
              asChild
              pill
              variant={isApoyoAi ? "default" : "outline"}
              className={
                isApoyoAi
                  ? "bg-[#18b6a4] text-white hover:bg-[#119b8c]"
                  : "border-[#d5e1dc] bg-white text-slate-900"
              }
            >
              <Link href={registerHref("apoyoai")}>
                <UsersRound className="h-4 w-4" aria-hidden="true" />
                ApoyoAI familias
              </Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px] lg:items-start">
            <div>
              <Badge className="bg-[#d8f7ee] text-[#075c50]">Registro</Badge>
              <h1 className="mt-5 font-display text-4xl font-bold tracking-tight">
                {isApoyoAi ? "Crear cuenta familiar" : "Crear cuenta docente"}
              </h1>
              <p className="mt-3 max-w-2xl text-[15px] font-medium leading-7 text-slate-600">
                {isApoyoAi
                  ? "Cargá el adulto responsable y el primer estudiante para dejar ApoyoAI listo desde el primer ingreso."
                  : "Cargá tu perfil docente y tu espacio de trabajo para entrar directo a planificar clases con IA."}
              </p>
            </div>

            <div className="rounded-lg border border-[#d5e1dc] bg-[#fbfffd] p-4">
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">
                Selección actual
              </p>
              <p className="mt-3 font-display text-2xl font-bold">
                {isApoyoAi ? "ApoyoAI" : "EducAI"}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-700">
                {selectedPlan?.name} - {selectedPlan?.price}
              </p>
            </div>
          </div>

          {errorMessage ? (
            <p className="mt-5 rounded-lg border border-[#f0c9c9] bg-[#fff4f4] px-4 py-3 text-sm font-semibold text-[#a33b3b]">
              {errorMessage}
            </p>
          ) : null}

          {isApoyoAi ? (
            <form action="/registro/apoyoai" method="post" className="mt-6 grid gap-6">
              <input type="hidden" name="producto" value="apoyoai" />
              <PlanChooser plans={plans} selectedPlanId={plan} />

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">Nombre del adulto</span>
                  <span className="flex h-12 items-center gap-3 rounded-lg border border-[#d5e1dc] bg-[#fbfffd] px-3">
                    <UserRound className="h-4 w-4 text-[#087968]" aria-hidden="true" />
                    <input
                      name="parentFullName"
                      required
                      placeholder="Nombre y apellido"
                      className="h-full w-full bg-transparent font-medium outline-none"
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
                      placeholder="+5491100000000"
                      className="h-full w-full bg-transparent font-medium outline-none"
                    />
                  </span>
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">Email</span>
                  <input
                    type="email"
                    name="parentEmail"
                    required
                    placeholder="adulto@email.com"
                    className="h-12 rounded-lg border border-[#d5e1dc] bg-[#fbfffd] px-3 font-medium outline-none"
                  />
                </label>
                <PasswordField
                  label="Contraseña"
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                />
              </div>

              <div className="rounded-lg border border-[#d5e1dc] bg-[#fbfffd] p-4">
                <div className="grid gap-4 md:grid-cols-[1fr_1fr_150px]">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Nombre del estudiante
                    </span>
                    <input
                      name="studentFirstName"
                      required
                      placeholder="Nombre"
                      className="h-12 rounded-lg border border-[#d5e1dc] bg-white px-3 font-medium outline-none"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-700">Apellido</span>
                    <input
                      name="studentLastName"
                      required
                      placeholder="Apellido"
                      className="h-12 rounded-lg border border-[#d5e1dc] bg-white px-3 font-medium outline-none"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-700">Grado o año</span>
                    <select
                      name="studentGrade"
                      required
                      defaultValue=""
                      className="h-12 rounded-lg border border-[#d5e1dc] bg-white px-3 font-medium outline-none"
                    >
                      <option value="" disabled>
                        Elegir
                      </option>
                      {Array.from({ length: 12 }, (_, index) => index + 1).map((grade) => (
                        <option key={grade} value={grade}>
                          {grade}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="mt-4 grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">
                    WhatsApp del estudiante, si usa uno distinto
                  </span>
                  <input
                    name="studentWhatsappPhone"
                    placeholder="+5491100000001"
                    className="h-12 rounded-lg border border-[#d5e1dc] bg-white px-3 font-medium outline-none"
                  />
                </label>
              </div>

              <label className="flex gap-3 rounded-lg border border-[#d5e1dc] bg-[#fbfffd] p-4 text-sm font-medium leading-6 text-slate-700">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  value="yes"
                  required
                  className="mt-1 h-4 w-4 shrink-0 accent-[#087968]"
                />
                <span>
                  Acepto los{" "}
                  <Link href="/terminos" className="font-bold text-[#075f53] underline">
                    Términos y condiciones
                  </Link>{" "}
                  y la{" "}
                  <Link href="/privacidad" className="font-bold text-[#075f53] underline">
                    Política de privacidad
                  </Link>
                  . Declaro que soy adulto responsable y autorizo el uso de los datos cargados para
                  prestar el servicio educativo.
                </span>
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button size="lg" pill className="bg-[#ff7a1a] text-white hover:bg-[#ea6508]">
                  Crear cuenta y continuar
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
              </div>
            </form>
          ) : (
            <form action="/registro/educai" method="post" className="mt-6 grid gap-6">
              <input type="hidden" name="producto" value="educai" />
              <PlanChooser plans={plans} selectedPlanId={plan} />

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">Nombre docente</span>
                  <span className="flex h-12 items-center gap-3 rounded-lg border border-[#d5e1dc] bg-[#fbfffd] px-3">
                    <UserRound className="h-4 w-4 text-[#087968]" aria-hidden="true" />
                    <input
                      name="fullName"
                      required
                      placeholder="Nombre y apellido"
                      className="h-full w-full bg-transparent font-medium outline-none"
                    />
                  </span>
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">Rol o cargo</span>
                  <input
                    name="title"
                    placeholder="Docente de primaria"
                    className="h-12 rounded-lg border border-[#d5e1dc] bg-[#fbfffd] px-3 font-medium outline-none"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">Email</span>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="docente@colegio.edu.ar"
                    className="h-12 rounded-lg border border-[#d5e1dc] bg-[#fbfffd] px-3 font-medium outline-none"
                  />
                </label>
                <PasswordField
                  label="Contraseña"
                  placeholder="Mínimo 8 caracteres"
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
                        className="h-full w-full bg-transparent font-medium outline-none"
                      />
                    </span>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-700">Materias</span>
                    <span className="flex h-12 items-center gap-3 rounded-lg border border-[#d5e1dc] bg-white px-3">
                      <BookOpenCheck className="h-4 w-4 text-[#087968]" aria-hidden="true" />
                      <input
                        name="subjects"
                        placeholder="Matemática, Ciencias"
                        className="h-full w-full bg-transparent font-medium outline-none"
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
                        className="h-full w-full bg-transparent font-medium outline-none"
                      />
                    </span>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-700">Ciudad</span>
                    <input
                      name="city"
                      placeholder="San Fernando del Valle"
                      className="h-12 rounded-lg border border-[#d5e1dc] bg-white px-3 font-medium outline-none"
                    />
                  </label>
                </div>
              </div>

              <label className="flex gap-3 rounded-lg border border-[#d5e1dc] bg-[#fbfffd] p-4 text-sm font-medium leading-6 text-slate-700">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  value="yes"
                  required
                  className="mt-1 h-4 w-4 shrink-0 accent-[#087968]"
                />
                <span>
                  Acepto los{" "}
                  <Link href="/terminos" className="font-bold text-[#075f53] underline">
                    Términos y condiciones
                  </Link>{" "}
                  y la{" "}
                  <Link href="/privacidad" className="font-bold text-[#075f53] underline">
                    Política de privacidad
                  </Link>
                  . Entiendo que EducAI genera borradores pedagógicos que deben ser revisados antes
                  de usarse con estudiantes.
                </span>
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button size="lg" pill className="bg-[#ff7a1a] text-white hover:bg-[#ea6508]">
                  Crear cuenta y continuar
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
              </div>
            </form>
          )}
        </section>
        <p className="mt-5 text-center text-sm font-medium text-slate-600">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-bold text-[#075f53] underline">
            Ingresar
          </Link>
        </p>
      </div>
    </main>
  );
}
