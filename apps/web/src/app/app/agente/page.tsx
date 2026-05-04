import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  GraduationCap,
  MessageCircle,
  Radio,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import { Badge, Button } from "@educai/ui";
import { AgentWorkspace } from "../../_components/agent-workspace";

const agentHeroImage =
  "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1500&q=85";

const agentStats = [
  { label: "Casos activos", value: "12", icon: Brain, tone: "bg-[#18b6a4] text-white" },
  { label: "Entregables", value: "36", icon: CheckCircle2, tone: "bg-[#f8d95c] text-[#11231f]" },
  { label: "Revisiones", value: "2", icon: ShieldCheck, tone: "bg-[#ef5da8] text-white" },
];

const capabilities = ["Planifica", "Produce", "Corrige", "Evalua"];

export default function AgentPage() {
  return (
    <main className="min-h-screen bg-[#eef5f3] p-3 text-[15px] text-[#14120f] [text-rendering:optimizeLegibility] sm:p-5">
      <div className="min-h-[calc(100vh-24px)] overflow-hidden rounded-lg border border-[#d5e1dc] bg-[#f8fbf7] shadow-float">
        <header className="flex flex-col gap-4 border-b border-[#d5e1dc] bg-white/75 px-5 py-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#11231f] text-white"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </Link>
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5b6962]">
                Centro del producto
              </p>
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Agente IA EducAI
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="border-[#d5e1dc] bg-white text-[#11231f]">
              <Link href="/app">Volver al centro</Link>
            </Button>
            <Button asChild className="bg-[#11231f] text-white hover:bg-[#1b342e]">
              <Link href="/">
                <GraduationCap className="h-4 w-4" aria-hidden="true" />
                Presentacion
              </Link>
            </Button>
          </div>
        </header>

        <section className="px-5 pt-5 sm:px-7 sm:pt-7">
          <div className="relative overflow-hidden rounded-lg border border-[#163f36]/20 bg-[#11231f] p-5 text-white shadow-float sm:p-6 lg:p-7">
            <Image
              src={agentHeroImage}
              alt="Equipo docente trabajando con tecnologia educativa"
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-28"
            />
            <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(17,35,31,0.98)_0%,rgba(17,35,31,0.88)_56%,rgba(17,35,31,0.48)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(24,182,164,0.24)_0%,transparent_40%),linear-gradient(18deg,transparent_0%,rgba(124,108,255,0.18)_68%,rgba(248,217,92,0.12)_100%)]" />

            <div className="relative z-10 grid gap-7 lg:grid-cols-[1fr_360px] lg:items-end">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-[#ff7a1a] text-white">Agente docente operativo</Badge>
                  <Badge
                    className="border-[#18b6a4]/40 bg-[#18b6a4]/18 text-white"
                    variant="outline"
                  >
                    Agente revisable
                  </Badge>
                  <Badge className="border-white/20 bg-white/12 text-white" variant="outline">
                    Revision docente
                  </Badge>
                </div>

                <h2 className="mt-6 max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                  El agente que convierte una idea docente en clases, recursos y evaluaciones.
                </h2>
                <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-white/86 sm:text-lg">
                  No es un chatbot. EducAI entiende el objetivo, ordena la clase, produce borradores
                  editables y deja todo listo para que el docente decida.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {capabilities.map((item, index) => (
                    <span
                      key={item}
                      className={[
                        "rounded-full border px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-md",
                        [
                          "border-[#18b6a4]/45 bg-[#18b6a4]/20",
                          "border-[#f8d95c]/45 bg-[#f8d95c]/18",
                          "border-[#ef5da8]/45 bg-[#ef5da8]/18",
                          "border-[#7c6cff]/45 bg-[#7c6cff]/20",
                        ][index],
                      ].join(" ")}
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button className="min-h-14 bg-[#ff7a1a] px-8 text-base font-bold text-white shadow-[0_18px_42px_rgba(255,122,26,0.38)] hover:bg-[#ea6508]">
                    Ejecutar Agente IA
                    <Sparkles className="h-5 w-5" aria-hidden="true" />
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-white/20 bg-white/10 text-white hover:bg-white/16 hover:text-white"
                  >
                    <Link href="/app/protocolo">
                      Ver protocolo
                      <Zap className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-white/16 bg-white/12 p-4 shadow-float backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] uppercase tracking-[0.12em] text-white/68">
                      Estado en vivo
                    </p>
                    <p className="mt-1 font-display text-2xl font-bold">Produciendo</p>
                  </div>
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#18b6a4] text-white">
                    <Radio className="h-5 w-5" aria-hidden="true" />
                  </span>
                </div>

                <div className="mt-5 grid gap-3">
                  {agentStats.map((stat) => (
                    <div
                      key={stat.label}
                      className="flex items-center justify-between rounded-lg bg-white/12 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={[
                            "flex h-9 w-9 items-center justify-center rounded-lg",
                            stat.tone,
                          ].join(" ")}
                        >
                          <stat.icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="text-[15px] text-white/82">{stat.label}</span>
                      </div>
                      <span className="font-display text-2xl font-bold">{stat.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-lg bg-[#f8d95c] p-4 text-[#11231f]">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    <p className="font-semibold">Salida lista para editar</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#35423b]">
                    Recurso pedagogico listo para editar antes de usar en clase.
                  </p>
                </div>
                <Button className="mt-4 min-h-12 w-full bg-[#ff7a1a] text-white shadow-[0_14px_30px_rgba(255,122,26,0.32)] hover:bg-[#ea6508]">
                  Ejecutar guia ahora
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="p-5 sm:p-7">
          <AgentWorkspace />
        </section>
      </div>
    </main>
  );
}
