"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Sparkles } from "lucide-react";

import { Badge, Button } from "@educai/ui";

type EducationLevel = "primaria" | "secundaria" | "terciario" | "universitario";
type LessonIntent =
  | "introducir"
  | "practicar"
  | "profundizar"
  | "integrar"
  | "evaluar"
  | "repasar"
  | "proyecto";

const levelLabels: Record<
  EducationLevel,
  {
    title: string;
    description: string;
    year: string;
    gradeMin: number;
    gradeMax: number;
    defaultGrade: number;
    subject: string;
    subjects: string[];
    levelContext: {
      label: string;
      placeholder: string;
    };
    topicPlaceholder: string;
    goalPlaceholder: string;
    durationDefault: number;
    durationPresets: number[];
  }
> = {
  primaria: {
    title: "Primaria",
    description: "Mas concreto, visual y guiado",
    year: "Grado",
    gradeMin: 1,
    gradeMax: 7,
    defaultGrade: 4,
    subject: "Area / materia",
    subjects: ["Matematica", "Practicas del lenguaje", "Ciencias Naturales", "Ciencias Sociales"],
    levelContext: {
      label: "Eje o proyecto del grado",
      placeholder: "Ej: alfabetizacion, ciencias en el patio, feria escolar...",
    },
    topicPlaceholder: "Ej: fracciones equivalentes, ecosistemas, comprension lectora...",
    goalPlaceholder: "Ej: reconocer fracciones equivalentes usando dibujos y ejemplos cercanos.",
    durationDefault: 40,
    durationPresets: [40, 60, 80],
  },
  secundaria: {
    title: "Secundaria",
    description: "Practica, autonomia y criterios claros",
    year: "Anio",
    gradeMin: 1,
    gradeMax: 6,
    defaultGrade: 2,
    subject: "Materia",
    subjects: ["Matematica", "Lengua", "Biologia", "Fisica", "Quimica", "Historia", "Geografia"],
    levelContext: {
      label: "Orientacion o modalidad",
      placeholder: "Ej: Ciencias Naturales, Economia, Tecnica en informatica...",
    },
    topicPlaceholder: "Ej: proporcionalidad directa, texto argumentativo, fotosintesis...",
    goalPlaceholder:
      "Ej: resolver problemas de proporcionalidad directa y explicar la estrategia usada.",
    durationDefault: 80,
    durationPresets: [40, 80, 120],
  },
  terciario: {
    title: "Terciario",
    description: "Aplicacion profesional y practica",
    year: "Anio",
    gradeMin: 1,
    gradeMax: 5,
    defaultGrade: 1,
    subject: "Asignatura",
    subjects: ["Didactica", "Pedagogia", "Anatomia", "Administracion", "Practica profesional"],
    levelContext: {
      label: "Perfil o trayecto profesional",
      placeholder: "Ej: formacion docente, enfermeria, administracion...",
    },
    topicPlaceholder: "Ej: planificacion de proyectos, anatomia funcional, didactica...",
    goalPlaceholder:
      "Ej: aplicar el concepto en una situacion profesional y justificar decisiones.",
    durationDefault: 90,
    durationPresets: [60, 90, 120],
  },
  universitario: {
    title: "Universitario",
    description: "Rigor disciplinar y fundamentacion",
    year: "Anio",
    gradeMin: 1,
    gradeMax: 8,
    defaultGrade: 1,
    subject: "Materia / catedra",
    subjects: [
      "Analisis matematico",
      "Bases de datos",
      "Derecho administrativo",
      "Anatomia",
      "Metodologia de la investigacion",
    ],
    levelContext: {
      label: "Enfoque o plan de estudios",
      placeholder: "Ej: catedra practica, plan 2024, seminario intensivo...",
    },
    topicPlaceholder: "Ej: derivadas parciales, derecho administrativo, bases de datos...",
    goalPlaceholder:
      "Ej: resolver un problema disciplinar y fundamentar el procedimiento con precision.",
    durationDefault: 120,
    durationPresets: [90, 120, 180],
  },
};

const lessonIntentOptions: Array<{ value: LessonIntent; label: string }> = [
  { value: "introducir", label: "Introducir" },
  { value: "practicar", label: "Practicar" },
  { value: "profundizar", label: "Profundizar" },
  { value: "integrar", label: "Integrar" },
  { value: "evaluar", label: "Evaluar" },
  { value: "repasar", label: "Repasar" },
  { value: "proyecto", label: "Proyecto" },
];

export function LessonPlanForm() {
  const [educationLevel, setEducationLevel] = useState<EducationLevel>("secundaria");
  const [lessonIntent, setLessonIntent] = useState<LessonIntent>("introducir");
  const [grade, setGrade] = useState(levelLabels.secundaria.defaultGrade);
  const [duration, setDuration] = useState(levelLabels.secundaria.durationDefault);
  const labels = levelLabels[educationLevel];
  const isUniversity = educationLevel === "universitario";
  const subjectListId = useMemo(() => `subjects-${educationLevel}`, [educationLevel]);

  function changeLevel(nextLevel: EducationLevel) {
    const nextLabels = levelLabels[nextLevel];
    setEducationLevel(nextLevel);
    setGrade(nextLabels.defaultGrade);
    setDuration(nextLabels.durationDefault);
  }

  return (
    <form
      action="/app/planificar/generar"
      method="post"
      className="rounded-lg border border-[#d5e1dc] bg-white shadow-whisper"
    >
      <input type="hidden" name="educationLevel" value={educationLevel} />
      <input type="hidden" name="lessonIntent" value={lessonIntent} />

      <div className="border-b border-[#e3ebe7] p-5">
        <Badge className="bg-[#e7fbf7] text-[#087968]">Nuevo borrador</Badge>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">
          Datos minimos de la clase
        </h2>
        <p className="mt-2 max-w-2xl text-[15px] font-medium leading-6 text-[#4f5f58]">
          Completa lo esencial. El formulario se adapta al nivel educativo y deja el contexto fino
          como opcional.
        </p>
      </div>

      <div className="grid gap-5 p-5">
        <fieldset className="grid gap-2">
          <legend className="text-sm font-semibold text-[#33423c]">Nivel educativo</legend>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {(Object.keys(levelLabels) as EducationLevel[]).map((level) => {
              const option = levelLabels[level];
              const selected = educationLevel === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => changeLevel(level)}
                  aria-pressed={selected}
                  className={`min-h-[84px] rounded-lg border px-4 py-3 text-left transition ${
                    selected
                      ? "border-[#18b6a4] bg-[#e7fbf7] text-[#075c50] shadow-[0_10px_24px_rgba(24,182,164,0.16)]"
                      : "border-[#d5e1dc] bg-white text-[#33423c] hover:border-[#18b6a4]/70"
                  }`}
                >
                  <span className="block font-bold">{option.title}</span>
                  <span className="mt-1 block text-[13px] font-medium leading-5">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-4 md:grid-cols-[0.45fr_1fr]">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[#33423c]">{labels.year}</span>
            <input
              name="grade"
              type="number"
              min={labels.gradeMin}
              max={labels.gradeMax}
              value={grade}
              onChange={(event) => setGrade(Number(event.target.value))}
              required
              className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[#33423c]">{labels.subject}</span>
            <input
              name="subject"
              defaultValue="Matematica"
              list={subjectListId}
              required
              className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
            />
            <datalist id={subjectListId}>
              {labels.subjects.map((subject) => (
                <option key={subject} value={subject} />
              ))}
            </datalist>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {isUniversity ? (
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[#33423c]">Carrera</span>
              <input
                name="careerName"
                placeholder="Ej: Ingenieria en sistemas, Abogacia, Medicina..."
                required
                className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
              />
            </label>
          ) : (
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[#33423c]">
                {labels.levelContext.label}
              </span>
              <input
                name="levelContext"
                placeholder={labels.levelContext.placeholder}
                className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
              />
            </label>
          )}
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[#33423c]">Tema</span>
            <input
              name="topic"
              defaultValue="Proporcionalidad directa"
              placeholder={labels.topicPlaceholder}
              required
              className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
            />
          </label>
        </div>

        <fieldset className="grid gap-2">
          <legend className="text-sm font-semibold text-[#33423c]">Intencion de la clase</legend>
          <div className="flex flex-wrap gap-2">
            {lessonIntentOptions.map((option) => {
              const selected = lessonIntent === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setLessonIntent(option.value)}
                  aria-pressed={selected}
                  className={`h-10 rounded-lg border px-3 text-sm font-bold transition ${
                    selected
                      ? "border-[#18b6a4] bg-[#18b6a4] text-white"
                      : "border-[#d5e1dc] bg-white text-[#33423c] hover:border-[#18b6a4]/70"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-[#33423c]">Objetivo de aprendizaje</span>
          <textarea
            name="learningGoal"
            rows={3}
            placeholder={labels.goalPlaceholder}
            className="resize-none rounded-lg border border-[#cbd9d4] bg-white px-3 py-2 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[#33423c]">Cantidad de clases</span>
            <input
              name="sessionCount"
              type="number"
              min="1"
              max="10"
              defaultValue="1"
              required
              className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
            />
          </label>
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-[#33423c]" htmlFor="totalDurationMinutes">
              Duracion total en minutos
            </label>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                id="totalDurationMinutes"
                name="totalDurationMinutes"
                type="number"
                min="10"
                max="600"
                value={duration}
                onChange={(event) => setDuration(Number(event.target.value))}
                required
                className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
              />
              <div className="flex gap-2">
                {labels.durationPresets.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => setDuration(minutes)}
                    className="h-12 rounded-lg border border-[#d5e1dc] bg-[#fbfffd] px-3 text-sm font-bold text-[#33423c] hover:border-[#18b6a4]"
                  >
                    {minutes}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <details className="rounded-lg border border-[#d5e1dc] bg-[#fbfffd]">
          <summary className="cursor-pointer px-4 py-3 font-semibold text-[#11231f]">
            Contexto opcional para mejorar la precision
          </summary>
          <div className="grid gap-4 border-t border-[#e3ebe7] p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[#33423c]">
                  Curso, division o comision
                </span>
                <input
                  name="courseLabel"
                  placeholder="Ej: 7A, 2do B, comision noche..."
                  className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
                />
              </label>
              {isUniversity ? (
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[#33423c]">
                    {labels.levelContext.label}
                  </span>
                  <input
                    name="levelContext"
                    placeholder={labels.levelContext.placeholder}
                    className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
                  />
                </label>
              ) : (
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[#33423c]">Institucion</span>
                  <input
                    name="institutionName"
                    placeholder="Nombre de escuela, instituto o universidad..."
                    className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
                  />
                </label>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {isUniversity ? (
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[#33423c]">Institucion</span>
                  <input
                    name="institutionName"
                    placeholder="Nombre de universidad o facultad..."
                    className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
                  />
                </label>
              ) : null}
              <label className="grid gap-2">
                <span className="flex items-center gap-2 text-sm font-semibold text-[#33423c]">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  Fecha tentativa
                </span>
                <input
                  name="plannedDate"
                  type="date"
                  className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[#33423c]">Contexto del grupo</span>
                <textarea
                  name="groupProfile"
                  rows={3}
                  placeholder="Ej: grupo heterogeneo, consignas breves, ritmo medio."
                  className="resize-none rounded-lg border border-[#cbd9d4] bg-white px-3 py-2 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[#33423c]">Saberes previos</span>
                <textarea
                  name="priorKnowledge"
                  rows={3}
                  placeholder="Ej: ya trabajaron fracciones equivalentes y tablas simples."
                  className="resize-none rounded-lg border border-[#cbd9d4] bg-white px-3 py-2 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[#33423c]">Recursos disponibles</span>
                <input
                  name="availableResources"
                  placeholder="Pizarron, fotocopias, proyector..."
                  className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[#33423c]">Que queres evaluar</span>
                <input
                  name="assessmentFocus"
                  placeholder="Procedimiento, argumentacion, trabajo grupal..."
                  className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[#33423c]">Marco curricular</span>
                <input
                  name="curriculumContext"
                  placeholder="NAP, diseno provincial, programa de catedra..."
                  className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-[#33423c]">Apoyos o adaptaciones</span>
                <input
                  name="inclusionNeeds"
                  placeholder="Apoyo visual, consignas cortas, extension..."
                  className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
                />
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-[#33423c]">Formato de salida</span>
              <input
                name="outputFormat"
                placeholder="Secuencia editable, guia para imprimir, rubrica breve..."
                className="h-12 rounded-lg border border-[#cbd9d4] bg-white px-3 text-[15px] font-medium outline-none focus:border-[#18b6a4]"
              />
            </label>
          </div>
        </details>

        <div className="flex flex-col gap-3 border-t border-[#e3ebe7] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[15px] font-medium leading-6 text-[#4f5f58]">
            Se guarda como planificacion del tenant autenticado.
          </p>
          <Button
            type="submit"
            className="min-h-12 bg-[#ff7a1a] px-6 font-bold text-white shadow-[0_14px_30px_rgba(255,122,26,0.32)] hover:bg-[#ea6508]"
          >
            <Sparkles className="h-5 w-5" aria-hidden="true" />
            Crear clase
          </Button>
        </div>
      </div>
    </form>
  );
}
