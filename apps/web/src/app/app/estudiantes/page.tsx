import { Activity, CheckCircle2, MessageCircle, Search, UsersRound } from "lucide-react";

import { Badge, Button } from "@educai/ui";
import { AppShell } from "../_components/app-shell";

const students = [
  {
    name: "Luna F.",
    course: "7A",
    focus: "Proporcionalidad",
    progress: 68,
    status: "Requiere refuerzo",
    tone: "bg-[#fdeaf4] text-[#b82170]",
  },
  {
    name: "Mateo R.",
    course: "7A",
    focus: "Problemas escritos",
    progress: 82,
    status: "Avanzando",
    tone: "bg-[#e7fbf7] text-[#087968]",
  },
  {
    name: "Ailen C.",
    course: "6B",
    focus: "Lectura de consignas",
    progress: 91,
    status: "Buen ritmo",
    tone: "bg-[#efedff] text-[#4f3ee2]",
  },
  {
    name: "Tomas P.",
    course: "5C",
    focus: "Fracciones",
    progress: 74,
    status: "Practica sugerida",
    tone: "bg-[#fff8d7] text-[#876100]",
  },
];

const groups = [
  ["7A", "26 estudiantes", "3 temas a reforzar"],
  ["6B", "22 estudiantes", "1 actividad pendiente"],
  ["5C", "24 estudiantes", "2 tickets por revisar"],
];

export default function StudentsModulePage() {
  return (
    <AppShell title="Modulo de estudiantes">
      <div className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="grid content-start gap-5">
          <div className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Badge className="bg-[#e7fbf7] text-[#087968]">Seguimiento de aula</Badge>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">
                  Estudiantes y progreso
                </h2>
                <p className="mt-2 max-w-2xl text-[15px] leading-6 text-[#4f5f58]">
                  Vista para saber quien necesita practica, que tema esta trabajando y que evidencia
                  conviene mirar.
                </p>
              </div>
              <Button className="bg-[#f8d95c] font-bold text-[#11231f] hover:bg-[#efc93a]">
                <Search className="h-4 w-4" aria-hidden="true" />
                Buscar estudiante
              </Button>
            </div>
          </div>

          <div className="grid gap-3">
            {students.map((student) => (
              <article
                key={student.name}
                className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#11231f] font-display text-lg font-bold text-white">
                      {student.name.slice(0, 1)}
                    </span>
                    <div>
                      <h3 className="font-display text-2xl font-bold tracking-tight">
                        {student.name}
                      </h3>
                      <p className="mt-1 text-[15px] leading-6 text-[#4f5f58]">
                        {student.course} - foco actual: {student.focus}
                      </p>
                    </div>
                  </div>
                  <span
                    className={[
                      "w-fit rounded-full px-3 py-1 text-sm font-semibold",
                      student.tone,
                    ].join(" ")}
                  >
                    {student.status}
                  </span>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="h-3 overflow-hidden rounded-full bg-[#e4eee9]">
                    <div
                      className="h-full rounded-full bg-[#18b6a4]"
                      style={{ width: `${student.progress}%` }}
                    />
                  </div>
                  <p className="font-display text-2xl font-bold">{student.progress}%</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="grid content-start gap-5">
          <div className="rounded-lg border border-[#d5e1dc] bg-[#11231f] p-5 text-white shadow-whisper">
            <div className="flex items-center gap-3">
              <UsersRound className="h-6 w-6 text-[#f8d95c]" aria-hidden="true" />
              <h2 className="font-display text-2xl font-bold tracking-tight">Cursos activos</h2>
            </div>
            <div className="mt-5 grid gap-3">
              {groups.map(([course, count, note]) => (
                <div key={course} className="rounded-lg bg-white/10 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-2xl font-bold">{course}</p>
                    <p className="text-sm text-white/70">{count}</p>
                  </div>
                  <p className="mt-2 text-[15px] leading-6 text-white/76">{note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#d5e1dc] bg-white p-5 shadow-whisper">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-[#087968]" aria-hidden="true" />
              <h2 className="font-display text-2xl font-bold tracking-tight">Senales utiles</h2>
            </div>
            <div className="mt-5 grid gap-3">
              {[
                "Practica recomendada para 7A",
                "Feedback pendiente en 6B",
                "Ticket de salida listo para 5C",
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-lg bg-[#eef5f3] p-4">
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-[#18b6a4]"
                    aria-hidden="true"
                  />
                  <p className="text-[15px] leading-6 text-[#4f5f58]">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <Button className="min-h-12 bg-[#ff7a1a] font-bold text-white shadow-[0_14px_30px_rgba(255,122,26,0.28)] hover:bg-[#ea6508]">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Pedir sugerencia al agente
          </Button>
        </aside>
      </div>
    </AppShell>
  );
}
