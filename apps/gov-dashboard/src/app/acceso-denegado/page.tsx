import Link from "next/link";
import { LockKeyhole } from "lucide-react";

export default function GovAccessDeniedPage() {
  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-16 text-[#0f172a]">
      <div className="mx-auto max-w-2xl rounded-lg border border-[#d8e0eb] bg-white p-8 shadow-whisper">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#102033] text-white">
          <LockKeyhole className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight">Acceso denegado</h1>
        <p className="mt-4 text-[15px] leading-7 text-[#475569]">
          Tu sesión es valida, pero el rol actual no tiene permiso para entrar al panel ministerial.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login/salir"
            className="rounded-lg bg-[#102033] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1b2d44]"
          >
            Cerrar sesión
          </Link>
        </div>
      </div>
    </main>
  );
}
