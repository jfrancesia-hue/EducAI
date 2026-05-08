import Link from "next/link";
import { redirect } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { getServerSession } from "../../lib/server-session";
import { ConsentForm } from "./consent-form";

export const dynamic = "force-dynamic";

interface ConsentPageProps {
  searchParams?: {
    student?: string;
    next?: string;
  };
}

export default async function ConsentPage({ searchParams }: ConsentPageProps) {
  const session = await getServerSession();
  if (!session) {
    redirect("/login?next=/consent");
  }

  const studentId = searchParams?.student?.trim();
  const next = safeNext(searchParams?.next);

  if (!studentId) {
    return (
      <main className="min-h-screen bg-[#11231f] p-4 text-white sm:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-32px)] max-w-2xl flex-col justify-center gap-6 rounded-lg border border-white/12 bg-[#faf8f0] p-8 text-[#14120f] shadow-float">
          <Link
            href="/"
            className="flex items-center gap-3 font-display text-xl font-bold tracking-tight"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#f7d95c] text-[#1f2a24]">
              <GraduationCap className="h-6 w-6" aria-hidden="true" />
            </span>
            EducAI
          </Link>
          <h1 className="font-display text-3xl font-bold">Falta seleccionar al alumno</h1>
          <p className="text-[#5f5647]">
            Para registrar el consentimiento parental necesitamos saber a que alumno se refiere.
            Ingresa desde tu panel y eleg&iacute; al alumno.
          </p>
          <Link
            href="/app"
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#11231f] px-4 py-2 text-sm font-semibold text-white"
          >
            Volver al panel
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#11231f] p-4 text-white sm:p-6">
      <div className="mx-auto max-w-3xl rounded-lg border border-white/12 bg-[#faf8f0] p-6 text-[#14120f] shadow-float sm:p-10">
        <Link
          href="/"
          className="flex items-center gap-3 font-display text-xl font-bold tracking-tight"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#f7d95c] text-[#1f2a24]">
            <GraduationCap className="h-6 w-6" aria-hidden="true" />
          </span>
          EducAI
        </Link>

        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.08em] text-[#4f5f58]">
          Paso obligatorio
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">
          Consentimiento parental
        </h1>
        <p className="mt-3 text-base leading-7 text-[#5f5647]">
          EducAI procesa datos de menores con apoyo pedagogico de IA. Para activar la plataforma
          para tu hijo/a necesitamos tu firma como tutor legal. Sin este paso, el agente no responde
          mensajes ni se procesan sesiones de aprendizaje.
        </p>

        <div className="mt-8">
          <ConsentForm studentId={studentId} next={next} />
        </div>
      </div>
    </main>
  );
}

function safeNext(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/app";
  }
  return value;
}
