import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, MessageCircle, Phone, UserRound } from "lucide-react";

import { Badge, Button } from "@educai/ui";
import { extractRoleFromMetadata } from "../../lib/supabase/roles";
import { createSupabaseServerClient } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";

type StudentResponse = {
  data: Array<{
    id: string;
    firstName: string;
    lastName: string;
    grade: number;
    profile?: {
      whatsappPhone?: string | null;
      whatsappContacts?: Array<{
        id: string;
        role: "STUDENT" | "PARENT" | "GUARDIAN";
        phone: string;
        displayName?: string | null;
      }>;
    } | null;
  }>;
};

type StudentFetchResult = {
  students: StudentResponse["data"];
  error: "missing_api_url" | "request_failed" | null;
};

async function fetchStudents(accessToken: string): Promise<StudentFetchResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return { students: [], error: "missing_api_url" };
  }

  try {
    const response = await fetch(`${apiUrl.replace(/\/$/u, "")}/students`, {
      headers: { authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!response.ok) {
      return { students: [], error: "request_failed" };
    }

    const payload = (await response.json()) as StudentResponse;
    return { students: payload.data ?? [], error: null };
  } catch {
    return { students: [], error: "request_failed" };
  }
}

export default async function FamilyHomePage() {
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

  const { students, error } = await fetchStudents(session.access_token);

  return (
    <main className="min-h-screen bg-[#eef5f3] p-4 text-[#14120f] sm:p-6">
      <div className="mx-auto grid max-w-6xl gap-5">
        <header className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
          <Badge className="bg-[#d8f7ee] text-[#075c50]">ApoyoAI familia</Badge>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-4xl font-bold tracking-tight">Panel familiar</h1>
              <p className="mt-2 max-w-2xl text-[15px] leading-7 text-[#4f5f58]">
                Aca ves los alumnos vinculados y los telefonos que el tutor reconoce por WhatsApp.
              </p>
            </div>
            <Button asChild className="bg-[#11231f] text-white hover:bg-[#1b342e]">
              <Link href="/login/salir">Salir</Link>
            </Button>
          </div>
        </header>

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
                        {contact.role === "PARENT" ? "Adulto" : "Alumno"}
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
              <h2 className="mt-4 font-display text-2xl font-bold">Todavia no hay alumnos</h2>
              <p className="mt-2 max-w-2xl text-[15px] leading-7 text-[#4f5f58]">
                Crea el primer alumno desde el registro ApoyoAI o pedinos ayuda para vincularlo.
              </p>
              <Button asChild className="mt-5 bg-[#ff7a1a] text-white hover:bg-[#ea6508]">
                <Link href="/apoyoai/precios">Ir a planes ApoyoAI</Link>
              </Button>
            </article>
          )}
        </section>
      </div>
    </main>
  );
}
