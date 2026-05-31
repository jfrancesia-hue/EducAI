import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CheckCircle2,
  GraduationCap,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Badge, Button } from "@educai/ui";
import { PasswordField } from "../../_components/password-field";
import { getEducaiAppAuth } from "../../../lib/supabase/app-auth";
import { AppShell } from "../_components/app-shell";
import { previewProfile } from "../_components/preview-data";

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
    metadataValue(userMetadata, "preferred_username") ||
    email ||
    "Cuenta EducAI"
  );
}

function passwordMessage(code?: string) {
  switch (code) {
    case "updated":
      return {
        tone: "border-[#18b6a4]/35 bg-[#e7fbf7] text-[#075c50]",
        text: "Contraseña actualizada correctamente.",
      };
    case "short":
      return {
        tone: "border-[#f0c9c9] bg-[#fff4f4] text-[#a33b3b]",
        text: "La nueva contraseña debe tener al menos 8 caracteres.",
      };
    case "mismatch":
      return {
        tone: "border-[#f0c9c9] bg-[#fff4f4] text-[#a33b3b]",
        text: "Las contraseñas no coinciden.",
      };
    case "error":
      return {
        tone: "border-[#f0c9c9] bg-[#fff4f4] text-[#a33b3b]",
        text: "No pudimos actualizar la contraseña. Reintenta en unos minutos.",
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

export default async function EducAiProfilePage({ searchParams }: ProfilePageProps) {
  const params = (await searchParams) ?? {};
  let plan = previewProfile.plan;
  let role = previewProfile.role;
  let schoolLinked = previewProfile.schoolLinked;
  let teacherLinked = previewProfile.teacherLinked;
  let visibleName = previewProfile.visibleName;
  let email = previewProfile.email;

  if (process.env.NODE_ENV !== "development") {
    const { user } = await getEducaiAppAuth();

    if (!user) {
      redirect("/login");
    }

    const appMetadata = user.app_metadata as Record<string, unknown>;
    plan = metadataValue(appMetadata, "plan") || "free";
    role = metadataValue(appMetadata, "role") || "TEACHER";
    schoolLinked = Boolean(metadataValue(appMetadata, "schoolId"));
    teacherLinked = Boolean(metadataValue(appMetadata, "teacherId"));
    visibleName = displayName(user.user_metadata, user.email);
    email = user.email ?? previewProfile.email;
  }

  const message = passwordMessage(params.password);
  const profileStatus = profileMessage(params.profile);

  return (
    <AppShell title="Mi perfil" eyebrow="Cuenta EducAI">
      <div className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[1fr_0.78fr]">
        <section className="grid content-start gap-5">
          <article className="relative overflow-hidden rounded-[24px] border border-[#d5e1dc] bg-white p-5 shadow-whisper">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#5bb7e5]/12 blur-2xl" />
            <Badge className="bg-[#d8f7ee] text-[#075c50]">Datos de cuenta</Badge>
            <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#075f53,#18b6a4)] text-white shadow-whisper">
                  <UserRound className="h-7 w-7" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-display text-3xl font-bold tracking-tight">{visibleName}</h2>
                  <p className="mt-2 flex items-center gap-2 text-[15px] font-medium leading-6 text-[#4f5f58]">
                    <Mail className="h-4 w-4 text-[#087968]" aria-hidden="true" />
                    {email}
                  </p>
                </div>
              </div>
              <Badge className="w-fit bg-[#fff8d7] text-[#876100]">{role}</Badge>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                ["Producto", "EducAI"],
                ["Plan actual", plan],
                ["Perfil docente", teacherLinked ? "Vinculado" : "Pendiente"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-[#e3ebe7] bg-[#fbfffd] p-4">
                  <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#5b6962]">
                    {label}
                  </p>
                  <p className="mt-2 font-display text-xl font-bold">{value}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[24px] border border-[#d5e1dc] bg-white p-5 shadow-whisper">
            <Badge className="bg-[#d8f7ee] text-[#075c50]">Perfil visible</Badge>
            <h2 className="mt-4 font-display text-2xl font-bold">Editar datos de cuenta</h2>
            <p className="mt-2 max-w-2xl text-[15px] font-medium leading-6 text-[#4f5f58]">
              Este nombre aparece dentro de EducAI. El email, rol, plan e institución se cambian por
              flujos controlados.
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
              <input type="hidden" name="next" value="/app/perfil" />
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">Nombre visible</span>
                <input
                  name="displayName"
                  defaultValue={visibleName}
                  required
                  minLength={2}
                  className="h-12 rounded-2xl border border-[#d5e1dc] bg-[#fbfffd] px-3 font-medium outline-none focus:border-[#18b6a4] focus:ring-2 focus:ring-[#18b6a4]/20"
                />
              </label>
              <Button className="self-end rounded-full bg-[#18b6a4] text-white hover:bg-[#119b8c]">
                Guardar cambios
              </Button>
            </form>
          </article>

          <article className="rounded-[24px] border border-[#d5e1dc] bg-white p-5 shadow-whisper">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge className="bg-[#d8f7ee] text-[#075c50]">Seguridad</Badge>
                <h2 className="mt-4 font-display text-2xl font-bold">Cambiar contraseña</h2>
                <p className="mt-2 max-w-2xl text-[15px] font-medium leading-6 text-[#4f5f58]">
                  Esta acción solo cambia la contraseña de acceso. No modifica rol, permisos,
                  institución ni plan.
                </p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e7fbf7] text-[#087968]">
                <LockKeyhole className="h-5 w-5" aria-hidden="true" />
              </span>
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
              <input type="hidden" name="next" value="/app/perfil" />
              <PasswordField
                name="password"
                label="Nueva contraseña"
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
              />
              <PasswordField
                name="confirmPassword"
                label="Confirmar contraseña"
                placeholder="Repetí la contraseña"
                autoComplete="new-password"
              />
              <Button className="rounded-full bg-[#18b6a4] text-white hover:bg-[#119b8c] md:col-span-2">
                Actualizar contraseña
              </Button>
            </form>
          </article>
        </section>

        <aside className="grid content-start gap-5">
          <article className="rounded-[24px] border border-[#d5e1dc] bg-white p-5 shadow-whisper">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e7fbf7] text-[#087968]">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-display text-2xl font-bold">Editable ahora</h2>
            <div className="mt-4 grid gap-3 text-sm font-semibold leading-6 text-[#33423c]">
              {["Nombre visible", "Contraseña de acceso"].map((item) => (
                <p key={item} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#18b6a4]" />
                  {item}
                </p>
              ))}
            </div>
          </article>

          <article className="rounded-[24px] border border-[#d5e1dc] bg-[#fbfffd] p-5 shadow-whisper">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff8d7] text-[#876100]">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-display text-2xl font-bold">No editable desde perfil</h2>
            <p className="mt-2 text-[15px] font-medium leading-6 text-[#4f5f58]">
              Rol, permisos, producto, institución vinculada y plan activo se cambian con flujos
              controlados para proteger el acceso y el aislamiento de datos.
            </p>
            <div className="mt-4 rounded-2xl bg-[#eef5f3] p-4 text-sm font-semibold leading-6 text-[#33423c]">
              {schoolLinked ? "Institución vinculada correctamente." : "Institución pendiente."}
            </div>
          </article>

          <Button
            asChild
            variant="outline"
            className="rounded-full border-[#d5e1dc] bg-white shadow-whisper hover:bg-[#e7fbf7]"
          >
            <Link href="/precios">Ver planes disponibles</Link>
          </Button>
        </aside>
      </div>
    </AppShell>
  );
}
