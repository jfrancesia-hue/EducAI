import { GraduationCap, Loader2 } from "lucide-react";

export default function AppLoading() {
  return (
    <main className="min-h-screen bg-[#62dcca] p-3 text-[#14120f] sm:p-5">
      <div className="grid min-h-[calc(100vh-24px)] place-items-center rounded-lg border border-white/45 bg-[#f8fbf7] shadow-float">
        <section className="w-full max-w-md p-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-[#075f53] text-white">
            <GraduationCap className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="mt-5 font-display text-3xl font-bold tracking-tight">Cargando EducAI</h1>
          <p className="mt-3 text-[15px] leading-6 text-[#4f5f58]">
            Preparando tu mesa de trabajo.
          </p>
          <Loader2
            className="mx-auto mt-6 h-7 w-7 animate-spin text-[#ff7a1a]"
            aria-hidden="true"
          />
        </section>
      </div>
    </main>
  );
}
