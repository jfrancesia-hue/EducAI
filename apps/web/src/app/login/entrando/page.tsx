import { GraduationCap, Loader2 } from "lucide-react";

import { ContinueToApp } from "./continue-to-app";

function safeNext(value?: string | string[]) {
  const next = Array.isArray(value) ? value[0] : value;
  if (!next?.startsWith("/") || next.startsWith("//")) {
    return "/app";
  }

  if (next.startsWith("/app") || next.startsWith("/familia")) {
    return next;
  }

  return "/app";
}

export default function LoginTransitionPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const nextPath = safeNext(searchParams?.next);

  return (
    <main className="grid min-h-screen place-items-center bg-[#62dcca] p-4 text-[#14120f]">
      <section className="w-full max-w-md rounded-lg border border-white/50 bg-white p-6 text-center shadow-float">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-[#075f53] text-white">
          <GraduationCap className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-bold tracking-tight">
          Preparando tu espacio
        </h1>
        <p className="mt-3 text-[15px] leading-6 text-[#4f5f58]">
          Estamos cargando tu panel y tus herramientas.
        </p>
        <Loader2 className="mx-auto mt-6 h-7 w-7 animate-spin text-[#ff7a1a]" aria-hidden="true" />
        <ContinueToApp nextPath={nextPath} />
      </section>
    </main>
  );
}
