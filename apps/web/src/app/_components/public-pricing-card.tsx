import Link from "next/link";
import { CheckCircle2, MinusCircle } from "lucide-react";

import { Badge, Button } from "@educai/ui";
import type { PublicPricingPlan } from "../../lib/pricing";

export function PublicPricingCard({
  plan,
  ctaOverrideHref,
  ctaOverrideLabel,
}: {
  plan: PublicPricingPlan;
  ctaOverrideHref?: PublicPricingPlan["ctaHref"];
  ctaOverrideLabel?: string;
}) {
  return (
    <article
      className={[
        "relative flex min-h-[560px] flex-col rounded-lg border bg-white p-5 shadow-whisper",
        plan.featured ? "border-[#ff7a1a] ring-2 ring-[#ff7a1a]/20" : "border-[#d5e1dc]",
      ].join(" ")}
    >
      {plan.featured ? (
        <Badge className="absolute right-4 top-4 bg-[#ff7a1a] text-white">Recomendado</Badge>
      ) : null}

      <p className="max-w-[72%] text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
        {plan.audience}
      </p>
      <h3 className="mt-3 font-display text-2xl font-bold tracking-tight">{plan.name}</h3>
      <p className="mt-4 font-display text-3xl font-bold">{plan.price}</p>
      <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">{plan.description}</p>

      <div className="mt-5 grid gap-2">
        {plan.includes.map((item) => (
          <div key={item} className="flex gap-2 text-sm leading-5 text-slate-700">
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
          "mt-auto w-full",
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
