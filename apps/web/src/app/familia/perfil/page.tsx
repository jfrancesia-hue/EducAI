import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, LockKeyhole, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";

import { Badge, Button } from "@educai/ui";
import { PasswordField } from "../../_components/password-field";
import { fetchFamilyStudents } from "../../../lib/api/family-students";
import { extractRoleFromMetadata } from "../../../lib/supabase/roles";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

type ProfilePageProps = {
  searchParams?: Promise<{
    password?: string;
    profile?: string;
  }>;
};

function metadataValue(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object") {
    return "";
  }

  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

function displayName(userMetadata: unknown, email?: string) {
  return (
    metadataValue(userMetadata, "fullName") ||
    metadataValue(userMetadata, "name") ||
    email ||
    "Cuenta familiar"
  );
}

function passwordMessage(code?: string) {
  switch (code) {
    case "updated":
      return {
        tone: "border-[#18b6a4]/35 bg-[#e7fbf7] text-[#075c50]",
        text: "Contrasena actualizada correctamente.",
      };
    case "short":
      return {
        tone: "border-[#f0c9c9] bg-[#fff4f4] text-[#a33b3b]",
        text: "La nueva contrasena debe tener al menos 8 caracteres.",
      };
    case "mismatch":
      return {
        tone: "border-[#f0c9c9] bg-[#fff4f4] text-[#a33b3b]",
        text: "Las contrasenas no coinciden.",
      };
    case "error":
      return {
        tone: "border-[#f0c9c9] bg-[#fff4f4] text-[#a33b3b]",
        text: "No pudimos actualizar la contrasena. Reintenta en unos minutos.",
      };
    default:
      return null;
  }
}

function profileMessage(code?: string) {
  switch (code) {
    case "updated":
      return {
        tone: "border-[#18b6a4]/35 bg-[#e7fbf7] text-[#075c50]",
        text: "Datos visibles actualizados correctamente.",
      };
    case "short":
      return {
        tone: "border-[#f0c9c9] bg-[#fff4f4] text-[#a33b3b]",
        text: "El nombre visible debe tener al menos 2 caracteres.",
      };
    case "error":
      return {
        tone: "border-[#f0c9c9] bg-[#fff4f4] text-[#a33b3b]",
        text: "No pudimos actualizar tus datos. Reintenta en unos minutos.",
      };
    default:
      return null;
  }
}

export default async function FamilyProfilePage({ searchParams }: ProfilePageProps) {
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

  const { students } = await fetchFamilyStudents(session.access_token);
  const parentContact = students
    .flatMap((student) => student.profile?.whatsappContacts ?? [])
    .find((contact) => contact.role === "PARENT");
  const message = passwordMessage(params.password);
  const visibleName = displayName(session.user.user_metadata, session.user.email);
  const profileStatus = profileMessage(params.profile);

  return (
    <main className="min-h-screen bg-[#62dcca] p-4 text-[#14120f] sm:p-6">
      <div className="mx-auto grid max-w-6xl gap-5">
        <header className="rounded-lg border border-white/45 bg-white p-5 shadow-float">
          <Badge className="bg-[#d8f7ee] text-[#075c50]">ApoyoAI familia</Badge>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-4xl font-bold tracking-tight">Mi perfil</h1>
              <p className="mt-2 max-w-2xl text-[15px] font-medium leading-7 text-[#4f5f58]">
                Datos de acceso, seguridad y configuracion familiar visible.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild className="bg-[#18b6a4] text-white hover:bg-[#119b8c]">
                <Link href="/familia">Panel familiar</Link>
              </Button>
              <Button asChild className="bg-[#11231f] text-white hover:bg-[#1b342e]">
                <Link href="/login/salir">Salir</Link>
              </Button>
            </div>
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[1fr_0.78fr]">
          <section className="grid content-start gap-5">
            <article className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
              <Badge className="bg-[#d8f7ee] text-[#075c50]">Cuenta familiar</Badge>
              <div className="mt-5 flex gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#075f53] text-white">
                  <UserRound className="h-7 w-7" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-display text-3xl font-bold tracking-tight">{visibleName}</h2>
                  <p className="mt-2 flex items-center gap-2 text-[15px] font-medium leading-6 text-[#4f5f58]">
                    <Mail className="h-4 w-4 text-[#087968]" aria-hidden="true" />
                    {session.user.email}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-[15px] font-medium leading-6 text-[#4f5f58]">
                    <Phone className="h-4 w-4 text-[#087968]" aria-hidden="true" />
                    {parentContact?.phone ?? "WhatsApp familiar pendiente"}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {[
                  ["Producto", "ApoyoAI"],
                  ["Rol", "Adulto responsable"],
                  ["Hijos vinculados", String(students.length)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-[#e3ebe7] bg-[#fbfffd] p-4">
                    <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#5b6962]">
                      {label}
                    </p>
                    <p className="mt-2 font-display text-xl font-bold">{value}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
              <Badge className="bg-[#d8f7ee] text-[#075c50]">Perfil visible</Badge>
              <h2 className="mt-4 font-display text-2xl font-bold">Editar adulto responsable</h2>
              <p className="mt-2 max-w-2xl text-[15px] font-medium leading-6 text-[#4f5f58]">
                Cambia el nombre visible de la cuenta familiar. Plan, pagos, hijos vinculados y
                permisos se mantienen protegidos.
              </p>

              {profileStatus ? (
                <p
                  className={`mt-5 rounded-lg border px-4 py-3 text-sm font-semibold ${profileStatus.tone}`}
                >
                  {profileStatus.text}
                </p>
              ) : null}

              <form
                action="/cuenta/perfil"
                method="post"
                className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]"
              >
                <input type="hidden" name="next" value="/familia/perfil" />
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">Nombre visible</span>
                  <input
                    name="displayName"
                    defaultValue={visibleName}
                    required
                    minLength={2}
                    className="h-12 rounded-lg border border-[#d5e1dc] bg-[#fbfffd] px-3 font-medium outline-none focus:border-[#18b6a4] focus:ring-2 focus:ring-[#18b6a4]/20"
                  />
                </label>
                <Button className="self-end bg-[#18b6a4] text-white hover:bg-[#119b8c]">
                  Guardar cambios
                </Button>
              </form>
            </article>

            <article className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge className="bg-[#d8f7ee] text-[#075c50]">Seguridad</Badge>
                  <h2 className="mt-4 font-display text-2xl font-bold">Cambiar contrasena</h2>
                  <p className="mt-2 max-w-2xl text-[15px] font-medium leading-6 text-[#4f5f58]">
                    Cambia solo la contrasena de acceso familiar. No modifica plan, hijos ni
                    permisos.
                  </p>
                </div>
                <LockKeyhole className="h-6 w-6 text-[#087968]" aria-hidden="true" />
              </div>

              {message ? (
                <p
                  className={`mt-5 rounded-lg border px-4 py-3 text-sm font-semibold ${message.tone}`}
                >
                  {message.text}
                </p>
              ) : null}

              <form
                action="/cuenta/password"
                method="post"
                className="mt-5 grid gap-4 md:grid-cols-2"
              >
                <input type="hidden" name="next" value="/familia/perfil" />
                <PasswordField
                  name="password"
                  label="Nueva contrasena"
                  placeholder="Minimo 8 caracteres"
                  autoComplete="new-password"
                />
                <PasswordField
                  name="confirmPassword"
                  label="Confirmar contrasena"
                  placeholder="Repeti la contrasena"
                  autoComplete="new-password"
                />
                <Button className="bg-[#18b6a4] text-white hover:bg-[#119b8c] md:col-span-2">
                  Actualizar contrasena
                </Button>
              </form>
            </article>
          </section>

          <aside className="grid content-start gap-5">
            <article className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
              <ShieldCheck className="h-6 w-6 text-[#087968]" aria-hidden="true" />
              <h2 className="mt-4 font-display text-2xl font-bold">Editable ahora</h2>
              <div className="mt-4 grid gap-3 text-sm font-semibold leading-6 text-[#33423c]">
                {["Nombre visible", "Contrasena de acceso", "Hijos desde el panel"].map((item) => (
                  <p key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#18b6a4]" />
                    {item}
                  </p>
                ))}
              </div>
            </article>

            <article className="rounded-lg border border-[#d5e1dc] bg-[#fbfffd] p-5 shadow-whisper">
              <h2 className="font-display text-2xl font-bold">No editable desde perfil</h2>
              <p className="mt-2 text-[15px] font-medium leading-6 text-[#4f5f58]">
                Plan activo, estado de pago, producto, familia interna y permisos se modifican con
                flujos controlados para evitar errores de acceso.
              </p>
              <Button asChild variant="outline" className="mt-5 border-[#d5e1dc] bg-white">
                <Link href="/precios#apoyoai">Ver planes familiares</Link>
              </Button>
            </article>
          </aside>
        </div>
      </div>
    </main>
  );
}
