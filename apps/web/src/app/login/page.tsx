import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, GraduationCap, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

import { Button } from "@educai/ui";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#1f2a24] p-4 text-white sm:p-6">
      <div className="grid min-h-[calc(100vh-32px)] overflow-hidden rounded-lg border border-white/12 bg-[#faf8f0] text-[#14120f] shadow-float lg:grid-cols-[0.9fr_1.1fr]">
        <section className="flex flex-col justify-between bg-[#1f2a24] p-6 text-white sm:p-10">
          <Link
            href="/"
            className="flex items-center gap-3 font-display text-xl font-bold tracking-tight"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#f7d95c] text-[#1f2a24]">
              <GraduationCap className="h-6 w-6" aria-hidden="true" />
            </span>
            EducAI
          </Link>

          <div className="max-w-xl py-16">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#f7d95c]">
              Acceso demo
            </p>
            <h1 className="mt-5 font-display text-5xl font-bold leading-tight tracking-tight">
              Entrá a la app, sin esperar autenticación real.
            </h1>
            <p className="mt-5 text-lg leading-8 text-white/70">
              Esta puerta simula el ingreso para que puedas recorrer la sala pedagógica y validar
              producto mientras cerramos auth, roles y permisos.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/12 bg-white/8 p-4">
              <ShieldCheck className="h-5 w-5 text-[#f7d95c]" aria-hidden="true" />
              <p className="mt-3 text-sm leading-6 text-white/70">
                Modo demo aislado, sin credenciales reales.
              </p>
            </div>
            <div className="rounded-lg border border-white/12 bg-white/8 p-4">
              <LockKeyhole className="h-5 w-5 text-[#f7d95c]" aria-hidden="true" />
              <p className="mt-3 text-sm leading-6 text-white/70">
                Preparado para conectar RBAC y tenants.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="rounded-lg border border-[#ded6c7] bg-white p-6 shadow-whisper">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#4f5f58]">
                Colegio del Valle
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">Ingresar</h2>
              <div className="mt-6 space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-[#5f5647]">Email</span>
                  <span className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-[#ded6c7] bg-[#fbfaf5] px-3 text-[#7b725f]">
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    docente.demo@educai.local
                  </span>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-[#5f5647]">Contraseña</span>
                  <span className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-[#ded6c7] bg-[#fbfaf5] px-3 text-[#7b725f]">
                    <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                    ••••••••••••
                  </span>
                </label>
              </div>

              <Button
                asChild
                size="lg"
                className="mt-6 w-full bg-[#ff7a1a] text-white shadow-[0_14px_30px_rgba(255,122,26,0.28)] hover:bg-[#ea6508]"
              >
                <Link href={"/login/enter" as Route}>
                  Entrar a demo
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>

              <p className="mt-5 text-sm leading-6 text-[#7b725f]">
                Por ahora no valida credenciales reales. Crea una sesion demo local para recorrer la
                experiencia de producto.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
