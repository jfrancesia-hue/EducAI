"use client";

import Image from "next/image";
import type { PointerEvent } from "react";
import { useRef } from "react";
import { BookOpenCheck, Brain, LineChart, ShieldCheck } from "lucide-react";

const classroomImage =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1500&q=85";
const labImage =
  "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=85";
const learningImage =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85";

const signals = [
  { label: "Atencion", value: "88%", icon: Brain },
  { label: "Progreso", value: "+14%", icon: LineChart },
  { label: "Privacidad", value: "Activa", icon: ShieldCheck },
];

const signalRows = ["Objetivo claro", "Practica generada", "Rubrica lista"];

export function ImmersiveShowcase() {
  const stageRef = useRef<HTMLDivElement>(null);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    stageRef.current?.style.setProperty("--rx", `${-y * 4}deg`);
    stageRef.current?.style.setProperty("--ry", `${x * 5}deg`);
  }

  function resetTilt() {
    stageRef.current?.style.setProperty("--rx", "0deg");
    stageRef.current?.style.setProperty("--ry", "0deg");
  }

  return (
    <section className="relative overflow-hidden bg-[#111827] px-4 py-24 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:56px_56px]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
        <div className="relative z-10">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#f8d95c]">
            Aula aumentada
          </p>
          <h2 className="mt-5 max-w-2xl font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Que la plataforma se sienta como una ventana al aprendizaje real.
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-white/72">
            Fotos reales, senales pedagogicas y una capa visual que muestra como EducAI ayuda a
            planificar, producir recursos y seguir el aprendizaje sin invadir la experiencia de
            aula.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {signals.map((signal) => (
              <div
                key={signal.label}
                className="flex items-center justify-between rounded-lg border border-white/12 bg-white/10 p-4 backdrop-blur-xl"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-950">
                    <signal.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-sm text-white/72">{signal.label}</span>
                </div>
                <span className="font-display text-xl font-semibold">{signal.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          ref={stageRef}
          className="immersive-stage relative z-10 [--rx:0deg] [--ry:0deg]"
          onPointerMove={handlePointerMove}
          onPointerLeave={resetTilt}
        >
          <div className="immersive-stack mx-auto max-w-3xl overflow-hidden rounded-lg border border-white/15 bg-white/10 p-3 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-4">
            <div className="grid gap-4">
              <div className="relative min-h-[360px] overflow-hidden rounded-lg border border-white/10 bg-slate-900 sm:min-h-[430px]">
                <Image
                  src={classroomImage}
                  alt="Estudiantes trabajando juntos en una clase"
                  fill
                  sizes="(min-width: 1024px) 56vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08)_0%,rgba(15,23,42,0.78)_100%)]" />
                <div className="educai-scanline pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-cyan-200/24 to-transparent" />
                <div className="absolute inset-x-4 bottom-4 rounded-lg border border-white/12 bg-slate-950/88 p-4 text-white shadow-float backdrop-blur-xl sm:inset-x-5 sm:bottom-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.08em] text-white/82">Curso 7A</p>
                      <p className="mt-1 font-display text-xl font-semibold leading-tight sm:text-2xl">
                        Ritmo de aprendizaje estable
                      </p>
                    </div>
                    <span className="w-fit rounded-full bg-emerald-400/18 px-3 py-1 text-sm font-semibold text-emerald-100">
                      En vivo
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[0.9fr_1fr]">
                <div className="overflow-hidden rounded-lg border border-white/15 bg-white shadow-float">
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={labImage}
                      alt="Material de ciencias para aprendizaje experimental"
                      fill
                      sizes="(min-width: 768px) 320px, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4 text-slate-950">
                    <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-600">
                      Ciencias
                    </p>
                    <p className="mt-2 text-sm font-medium leading-5">
                      Recurso visual listo para la proxima clase.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="overflow-hidden rounded-lg border border-white/15 bg-[#f8d95c] text-slate-950 shadow-float">
                    <div className="grid sm:grid-cols-[0.95fr_1.05fr] md:grid-cols-1 xl:grid-cols-[0.9fr_1.1fr]">
                      <div className="relative min-h-[150px]">
                        <Image
                          src={learningImage}
                          alt="Estudiante aprendiendo con computadora"
                          fill
                          sizes="(min-width: 768px) 280px, 100vw"
                          className="object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em]">
                          <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
                          EducAI
                        </p>
                        <p className="mt-2 font-display text-xl font-bold leading-tight">
                          El agente preparo una consigna y una rubrica breve.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-cyan-200/20 bg-slate-950/90 p-4 text-cyan-50 shadow-float">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm uppercase tracking-[0.08em] text-cyan-100/82">
                        Senales utiles
                      </span>
                      <span className="h-2 w-2 rounded-full bg-cyan-200" />
                    </div>
                    <div className="mt-4 space-y-3">
                      {signalRows.map((item, index) => (
                        <div key={item} className="flex items-center gap-3">
                          <span className="h-1.5 w-12 shrink-0 overflow-hidden rounded-full bg-white/14">
                            <span
                              className="block h-full rounded-full bg-cyan-200"
                              style={{ width: `${76 + index * 8}%` }}
                            />
                          </span>
                          <span className="text-sm text-white/80">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
