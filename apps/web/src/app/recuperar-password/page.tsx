import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

import { Button } from "@educai/ui";

type RecoverPasswordPageProps = {
  searchParams?: Promise<{
    status?: string;
  }>;
};

function statusMessage(status?: string) {
  switch (status) {
    case "sent":
      return {
        tone: "border-[#18b6a4]/35 bg-[#e7fbf7] text-[#075c50]",
        text: "Te enviamos un enlace para restablecer la contrasena. Revisa tu correo.",
      };
    case "missing":
      return {
        tone: "border-[#f0c9c9] bg-[#fff4f4] text-[#a33b3b]",
        text: "Ingresa tu email para continuar.",
      };
    case "error":
      return {
        tone: "border-[#f0c9c9] bg-[#fff4f4] text-[#a33b3b]",
        text: "No pudimos enviar el correo. Reintenta en unos minutos.",
      };
    default:
      return null;
  }
}

export default async function RecoverPasswordPage({ searchParams }: RecoverPasswordPageProps) {
  const params = (await searchParams) ?? {};
  const message = statusMessage(params.status);

  return (
    <main className="min-h-screen bg-[#62dcca] p-4 text-[#14120f] sm:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-32px)] max-w-xl items-center">
        <section className="w-full rounded-lg border border-white/45 bg-white p-6 shadow-float sm:p-8">
          <Button asChild variant="outline" className="border-[#d5e1dc] bg-white">
            <Link href="/login">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Volver al ingreso
            </Link>
          </Button>

          <h1 className="mt-8 font-display text-4xl font-bold tracking-tight">
            Recuperar contrasena
          </h1>
          <p className="mt-3 text-[15px] font-medium leading-7 text-[#4f5f58]">
            Ingresa el email de tu cuenta y te enviamos un enlace seguro para crear una contrasena
            nueva.
          </p>

          {message ? (
            <p className={`mt-5 rounded-lg border px-4 py-3 text-sm font-semibold ${message.tone}`}>
              {message.text}
            </p>
          ) : null}

          <form action="/recuperar-password/enviar" method="post" className="mt-6 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[#5f5647]">Email</span>
              <span className="flex h-12 items-center gap-3 rounded-lg border border-[#d5e1dc] bg-[#fbfffd] px-3">
                <Mail className="h-4 w-4 text-[#087968]" aria-hidden="true" />
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  placeholder="tu@email.com"
                  className="h-full w-full bg-transparent font-medium outline-none"
                />
              </span>
            </label>
            <Button className="bg-[#18b6a4] text-white hover:bg-[#119b8c]">Enviar enlace</Button>
          </form>
        </section>
      </div>
    </main>
  );
}
