import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle, CheckCircle2, MessageCircle, Phone, UserPlus, UserRound } from "lucide-react";

import { Badge, Button } from "@educai/ui";
import { fetchFamilyStudents } from "../../lib/api/family-students";
import { extractRoleFromMetadata } from "../../lib/supabase/roles";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import { FamilyTutorChat } from "./_components/family-tutor-chat";

export const dynamic = "force-dynamic";

type FamilyHomePageProps = {
  searchParams?: Promise<{
    student?: string;
  }>;
};

const FAMILY_PLAN_LIMITS: Record<string, number> = {
  free: 1,
  basico: 1,
  plus: 1,
  familiar: 3,
  intensivo: 3,
};

function metadataValue(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object") {
    return "";
  }

  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

function studentMessage(code?: string) {
  switch (code) {
    case "created":
      return {
        tone: "border-[#18b6a4]/35 bg-[#e7fbf7] text-[#075c50]",
        text: "Hijo agregado correctamente.",
      };
    case "limit":
      return {
        tone: "border-[#eadca8] bg-[#fff8dd] text-[#7a5c00]",
        text: "Tu plan actual no permite agregar mas hijos desde el panel.",
      };
    case "invalid":
      return {
        tone: "border-[#f0c9c9] bg-[#fff4f4] text-[#a33b3b]",
        text: "Revisa nombre, apellido y grado antes de guardar.",
      };
    case "api":
    case "error":
      return {
        tone: "border-[#f0c9c9] bg-[#fff4f4] text-[#a33b3b]",
        text: "No pudimos guardar el hijo. Reintenta en unos minutos.",
      };
    default:
      return null;
  }
}

export default async function FamilyHomePage({ searchParams }: FamilyHomePageProps) {
  const params = (await searchParams) ?? {};
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const role =
    extractRoleFromMetadata(session.user.app_metadata) ??
    extractRoleFromMetadata(session.user.user_metadata);

  if (role !== "PARENT") {
    redirect("/app");
  }

  const { students, error } = await fetchFamilyStudents(session.access_token);
  const plan = metadataValue(session.user.app_metadata, "plan") || "free";
  const maxChildren = FAMILY_PLAN_LIMITS[plan] ?? 1;
  const canAddStudent = !error && students.length < maxChildren;
  const message = studentMessage(params.student);

  return (
    <main className="min-h-screen bg-[#eef5f3] p-4 text-[#14120f] sm:p-6">
      <div className="mx-auto grid max-w-6xl gap-5">
        <header className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
          <Badge className="bg-[#d8f7ee] text-[#075c50]">ApoyoAI familia</Badge>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-4xl font-bold tracking-tight">Panel familiar</h1>
              <p className="mt-2 max-w-2xl text-[15px] leading-7 text-[#4f5f58]">
                Aca ves los hijos vinculados y los telefonos que el tutor reconoce por WhatsApp.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild className="bg-[#18b6a4] text-white hover:bg-[#119b8c]">
                <Link href="/familia/perfil">Mi perfil</Link>
              </Button>
              <Button asChild className="bg-[#11231f] text-white hover:bg-[#1b342e]">
                <Link href="/login/salir">Salir</Link>
              </Button>
            </div>
          </div>
        </header>

        {message ? (
          <p className={`rounded-lg border px-4 py-3 text-sm font-semibold ${message.tone}`}>
            {message.text}
          </p>
        ) : null}

        {!error ? (
          <section className="grid gap-4 lg:grid-cols-[0.82fr_1.18fr]">
            <article className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
              <Badge className="bg-[#d8f7ee] text-[#075c50]">Plan familiar</Badge>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#5b6962]">
                    Plan actual
                  </p>
                  <p className="mt-2 font-display text-3xl font-bold capitalize">{plan}</p>
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#5b6962]">
                    Hijos vinculados
                  </p>
                  <p className="mt-2 font-display text-3xl font-bold">
                    {students.length}/{maxChildren}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm font-medium leading-6 text-[#4f5f58]">
                Free, Basico y Plus incluyen 1 hijo. Familiar e Intensivo permiten hasta 3 hijos.
              </p>
            </article>

            <article className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge className="bg-[#d8f7ee] text-[#075c50]">Hijos</Badge>
                  <h2 className="mt-4 font-display text-2xl font-bold">Agregar hijo</h2>
                  <p className="mt-2 text-[15px] font-medium leading-6 text-[#4f5f58]">
                    {canAddStudent
                      ? "Carga otro perfil para que ApoyoAI pueda separarlo por grado y telefono."
                      : "Para sumar mas hijos, cambia a un plan Familiar o Intensivo."}
                  </p>
                </div>
                {canAddStudent ? (
                  <UserPlus className="h-6 w-6 text-[#087968]" aria-hidden="true" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-[#876100]" aria-hidden="true" />
                )}
              </div>

              {canAddStudent ? (
                <form
                  action="/familia/hijos/crear"
                  method="post"
                  className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_120px]"
                >
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-700">Nombre</span>
                    <input
                      name="firstName"
                      required
                      className="h-11 rounded-lg border border-[#d5e1dc] bg-[#fbfffd] px-3 font-medium outline-none focus:border-[#18b6a4] focus:ring-2 focus:ring-[#18b6a4]/20"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-700">Apellido</span>
                    <input
                      name="lastName"
                      required
                      className="h-11 rounded-lg border border-[#d5e1dc] bg-[#fbfffd] px-3 font-medium outline-none focus:border-[#18b6a4] focus:ring-2 focus:ring-[#18b6a4]/20"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-700">Grado</span>
                    <select
                      name="grade"
                      required
                      defaultValue=""
                      className="h-11 rounded-lg border border-[#d5e1dc] bg-[#fbfffd] px-3 font-medium outline-none focus:border-[#18b6a4] focus:ring-2 focus:ring-[#18b6a4]/20"
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
                  <label className="grid gap-2 md:col-span-2">
                    <span className="text-sm font-semibold text-slate-700">
                      WhatsApp del hijo, si usa uno propio
                    </span>
                    <input
                      name="studentWhatsappPhone"
                      placeholder="+5493834000001"
                      className="h-11 rounded-lg border border-[#d5e1dc] bg-[#fbfffd] px-3 font-medium outline-none focus:border-[#18b6a4] focus:ring-2 focus:ring-[#18b6a4]/20"
                    />
                  </label>
                  <Button className="self-end bg-[#18b6a4] text-white hover:bg-[#119b8c]">
                    Guardar
                  </Button>
                </form>
              ) : (
                <Button asChild variant="outline" className="mt-5 border-[#d5e1dc] bg-white">
                  <Link href="/precios#apoyoai">Ver planes familiares</Link>
                </Button>
              )}
            </article>
          </section>
        ) : null}

        {!error && students.length ? <FamilyTutorChat students={students} /> : null}

        <section className="grid gap-4 md:grid-cols-2">
          {error ? (
            <article className="rounded-lg border border-[#f0c9c9] bg-white p-5 shadow-whisper md:col-span-2">
              <MessageCircle className="h-7 w-7 text-[#c74d4d]" aria-hidden="true" />
              <h2 className="mt-4 font-display text-2xl font-bold">No pudimos cargar la cuenta</h2>
              <p className="mt-2 max-w-2xl text-[15px] leading-7 text-[#4f5f58]">
                {error === "missing_api_url"
                  ? "No pudimos cargar la informacion familiar en este momento."
                  : "El servicio no respondio como esperabamos. Reintenta en unos minutos o contacta soporte."}
              </p>
            </article>
          ) : students.length ? (
            students.map((student) => (
              <article
                key={student.id}
                className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#11231f] text-white">
                      <UserRound className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <div>
                      <h2 className="font-display text-2xl font-bold">
                        {student.firstName} {student.lastName}
                      </h2>
                      <p className="mt-1 text-[15px] text-[#4f5f58]">Grado {student.grade}</p>
                    </div>
                  </div>
                  <CheckCircle2 className="h-6 w-6 text-[#18b6a4]" aria-hidden="true" />
                </div>

                <div className="mt-5 grid gap-2">
                  {(student.profile?.whatsappContacts ?? []).map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between gap-3 rounded-lg bg-[#eef5f3] px-3 py-2"
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-[#33423c]">
                        <Phone className="h-4 w-4 text-[#087968]" aria-hidden="true" />
                        {contact.role === "PARENT" ? "Adulto" : "Hijo"}
                      </span>
                      <span className="text-sm text-[#4f5f58]">{contact.phone}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))
          ) : (
            <article className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper md:col-span-2">
              <MessageCircle className="h-7 w-7 text-[#ff7a1a]" aria-hidden="true" />
              <h2 className="mt-4 font-display text-2xl font-bold">Todavia no hay hijos</h2>
              <p className="mt-2 max-w-2xl text-[15px] leading-7 text-[#4f5f58]">
                Crea el primer perfil desde este panel o desde el registro ApoyoAI.
              </p>
              <Button asChild className="mt-5 bg-[#ff7a1a] text-white hover:bg-[#ea6508]">
                <Link href="/precios#apoyoai">Ir a planes ApoyoAI</Link>
              </Button>
            </article>
          )}
        </section>
      </div>
    </main>
  );
}
