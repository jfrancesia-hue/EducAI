import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Crown,
  GraduationCap,
  Landmark,
  MinusCircle,
  Rocket,
  School,
  Sparkles,
  UsersRound,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge, Button } from "@educai/ui";
import type { PublicPricingPlan } from "../../lib/pricing";

const planIconMap: Record<string, LucideIcon> = {
  free: Sparkles,
  "docente-individual": GraduationCap,
  "docente-pro": Crown,
  colegio: School,
  institucional: Landmark,
  basico: Rocket,
  plus: Zap,
  familiar: UsersRound,
  intensivo: Building2,
};

const planIconToneMap: Record<string, string> = {
  free: "border-[#18b6a4]/20 bg-[#e7fbf7] text-[#087968]",
  "docente-individual": "border-[#7c6cff]/22 bg-[#efedff] text-[#4f3ee2]",
  "docente-pro": "border-[#ff7a1a]/25 bg-[#fff3e9] text-[#c24f00]",
  colegio: "border-[#f8d95c]/40 bg-[#fff6c9] text-[#876100]",
  institucional: "border-[#ef5da8]/24 bg-[#fdeaf4] text-[#b82170]",
  basico: "border-[#18b6a4]/20 bg-[#e7fbf7] text-[#087968]",
  plus: "border-[#ff7a1a]/25 bg-[#fff3e9] text-[#c24f00]",
  familiar: "border-[#7c6cff]/22 bg-[#efedff] text-[#4f3ee2]",
  intensivo: "border-[#ef5da8]/24 bg-[#fdeaf4] text-[#b82170]",
};

export function PublicPricingCard({
  plan,
  ctaOverrideHref,
  ctaOverrideLabel,
}: {
  plan: PublicPricingPlan;
  ctaOverrideHref?: PublicPricingPlan["ctaHref"];
  ctaOverrideLabel?: string;
}) {
  const PlanIcon = planIconMap[plan.id] ?? Sparkles;
  const iconTone = planIconToneMap[plan.id] ?? "border-[#18b6a4]/20 bg-[#e7fbf7] text-[#087968]";
  const quickHighlights = plan.includes.slice(0, 3);

  return (
    <article
      className={[
        "group relative flex min-h-[560px] flex-col overflow-hidden rounded-[1.35rem] border bg-white p-5 shadow-whisper transition duration-300 hover:-translate-y-1 hover:shadow-float",
        plan.featured
          ? "border-[#ff7a1a] ring-2 ring-[#ff7a1a]/20"
          : "border-[#d5e1dc] hover:border-[#18b6a4]/45",
      ].join(" ")}
    >
      <div
        className={[
          "pointer-events-none absolute inset-x-0 top-0 h-28 opacity-80 transition duration-300 group-hover:opacity-100",
          plan.featured
            ? "bg-[radial-gradient(circle_at_25%_0%,rgba(255,122,26,0.18),transparent_48%),radial-gradient(circle_at_85%_10%,rgba(248,217,92,0.20),transparent_42%)]"
            : "bg-[radial-gradient(circle_at_25%_0%,rgba(24,182,164,0.16),transparent_48%),radial-gradient(circle_at_85%_10%,rgba(124,108,255,0.11),transparent_42%)]",
        ].join(" ")}
      />

      {plan.featured ? (
        <Badge className="absolute right-4 top-4 bg-[#ff7a1a] text-white">Recomendado</Badge>
      ) : null}

      <div className="relative flex items-start gap-4 pr-24">
        <span
          className={[
            "relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border shadow-whisper transition duration-300 group-hover:scale-105 group-hover:shadow-float",
            iconTone,
          ].join(" ")}
        >
          <span className="absolute -right-1 -top-1 h-5 w-5 rounded-full border-2 border-white bg-current opacity-35" />
          <PlanIcon className="relative h-8 w-8 stroke-[2.4]" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
            {plan.audience}
          </p>
          <h3 className="mt-2 font-display text-2xl font-bold tracking-tight">{plan.name}</h3>
        </div>
      </div>

      <p className="mt-4 font-display text-3xl font-bold">{plan.price}</p>
      <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">{plan.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {quickHighlights.map((item) => (
          <span
            key={item}
            className={[
              "rounded-full border px-3 py-1 text-xs font-bold leading-5",
              plan.featured
                ? "border-[#ff7a1a]/20 bg-[#fff3e9] text-[#9a4300]"
                : "border-[#18b6a4]/18 bg-[#e7fbf7] text-[#075f53]",
            ].join(" ")}
          >
            {item}
          </span>
        ))}
      </div>

      <div className="mt-5 h-px bg-gradient-to-r from-transparent via-[#d5e1dc] to-transparent" />

      <div className="mt-5 grid gap-2">
        {plan.includes.map((item) => (
          <div
            key={item}
            className="flex gap-2 rounded-xl px-1 py-0.5 text-sm leading-5 text-slate-700"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#18b6a4]" aria-hidden="true" />
            <span>{item}</span>
          </div>
        ))}
      </div>

      {plan.excludes?.length ? (
        <div className="mt-5 grid gap-2 rounded-lg bg-[#f7f8f3] p-4">
          {plan.excludes.map((item) => (
            <div key={item} className="flex gap-2 text-sm leading-5 text-slate-600">
              <MinusCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      ) : null}

      {plan.note ? <p className="mt-4 text-sm font-semibold text-[#075c50]">{plan.note}</p> : null}

      <Button
        asChild
        size="lg"
        pill
        className={[
          "mt-auto w-full shadow-whisper transition duration-300 group-hover:shadow-float",
          plan.featured
            ? "bg-[#ff7a1a] text-white hover:bg-[#ea6508]"
            : "bg-[#18b6a4] text-white hover:bg-[#119b8c]",
        ].join(" ")}
      >
        <Link href={ctaOverrideHref ?? plan.ctaHref}>{ctaOverrideLabel ?? plan.ctaLabel}</Link>
      </Button>
    </article>
  );
}
