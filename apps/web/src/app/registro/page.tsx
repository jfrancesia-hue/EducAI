import Link from "next/link";
import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";

import { Badge, Button } from "@educai/ui";

type RegisterPageProps = {
  searchParams?: Promise<{
    producto?: string;
    plan?: string;
  }>;
};

const labels: Record<string, string> = {
  educai: "EducAI",
  apoyoai: "ApoyoAI",
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = (await searchParams) ?? {};
  const product = labels[params.producto ?? ""] ?? "EducAI";
  const plan = params.plan ?? "free";

  return (
    <main className="min-h-screen bg-[#f7f8f3] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Button asChild variant="outline" pill className="border-[#d5e1dc] bg-white text-slate-900">
          <Link href={product === "ApoyoAI" ? "/apoyoai/precios" : "/precios"}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver a planes
          </Link>
        </Button>

        <section className="mt-8 rounded-lg border border-[#d5e1dc] bg-white p-6 shadow-whisper sm:p-8">
          <Badge className="bg-[#d8f7ee] text-[#075c50]">Registro</Badge>
          <h1 className="mt-5 font-display text-4xl font-bold tracking-tight">
            Crear cuenta para {product}
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-slate-600">
            Dejamos el plan preseleccionado en la URL para conectar el alta y Mercado Pago cuando
            activemos suscripciones.
          </p>

          <div className="mt-6 grid gap-3 rounded-lg bg-[#f7f8f3] p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-600">Producto</span>
              <span className="font-display text-xl font-bold">{product}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-[#d5e1dc] pt-3">
              <span className="text-sm font-semibold text-slate-600">Plan</span>
              <span className="font-display text-xl font-bold">{plan}</span>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button asChild size="lg" pill className="bg-[#ff7a1a] text-white hover:bg-[#ea6508]">
              <Link href="/login">
                Continuar con acceso
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" pill variant="outline" className="border-[#d5e1dc]">
              <Link href={`/contacto?producto=${params.producto ?? "educai"}&plan=${plan}`}>
                Hablar con ventas
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
