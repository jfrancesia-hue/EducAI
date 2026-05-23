import Link from "next/link";
import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";

import { Button } from "@educai/ui";
import { PasswordField } from "../../_components/password-field";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

type ResetPasswordPageProps = {
  searchParams?: Promise<{
    password?: string;
  }>;
};

function passwordMessage(code?: string) {
  switch (code) {
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

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login?error=invalid");
  }

  const params = (await searchParams) ?? {};
  const message = passwordMessage(params.password);

  return (
    <main className="min-h-screen bg-[#62dcca] p-4 text-[#14120f] sm:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-32px)] max-w-xl items-center">
        <section className="w-full rounded-lg border border-white/45 bg-white p-6 shadow-float sm:p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#075f53] text-white">
            <LockKeyhole className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mt-6 font-display text-4xl font-bold tracking-tight">
            Crear nueva contrasena
          </h1>
          <p className="mt-3 text-[15px] font-medium leading-7 text-[#4f5f58]">
            Elegi una contrasena nueva para volver a ingresar con seguridad.
          </p>

          {message ? (
            <p className={`mt-5 rounded-lg border px-4 py-3 text-sm font-semibold ${message.tone}`}>
              {message.text}
            </p>
          ) : null}

          <form action="/cuenta/restablecer/guardar" method="post" className="mt-6 grid gap-4">
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
            <Button className="bg-[#18b6a4] text-white hover:bg-[#119b8c]">
              Guardar contrasena
            </Button>
          </form>

          <Link
            href="/login"
            className="mt-5 block text-center text-sm font-bold text-[#075f53] underline"
          >
            Volver al ingreso
          </Link>
        </section>
      </div>
    </main>
  );
}
