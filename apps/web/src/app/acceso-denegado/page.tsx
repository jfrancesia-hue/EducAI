import Link from "next/link";
import { LockKeyhole } from "lucide-react";

import { Button } from "@educai/ui";

export default function AccessDeniedPage() {
  return (
    <main className="min-h-screen bg-[#eef5f3] px-4 py-16 text-[#14120f]">
      <div className="mx-auto max-w-2xl rounded-lg border border-[#d5e1dc] bg-white p-8 shadow-whisper">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#11231f] text-white">
          <LockKeyhole className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight">Acceso denegado</h1>
        <p className="mt-4 text-[15px] leading-7 text-[#4f5f58]">
          Tu sesion es valida, pero el rol actual no tiene permiso para entrar a esta superficie de
          trabajo docente.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild className="bg-[#11231f] text-white hover:bg-[#1b342e]">
            <Link href="/">Volver al inicio</Link>
          </Button>
          <Button asChild variant="outline" className="border-[#d5e1dc] bg-white text-[#11231f]">
            <Link href="/login/salir">Cerrar sesion</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
