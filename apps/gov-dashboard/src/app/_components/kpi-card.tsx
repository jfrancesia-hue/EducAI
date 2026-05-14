import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@educai/ui";

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  caption?: string;
  status?: "live" | "placeholder";
  children?: ReactNode;
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  caption,
  status = "live",
  children,
}: KpiCardProps) {
  const placeholder = status === "placeholder";

  return (
    <article
      className="gov-card rounded-xl border border-slate-200 bg-white p-5 shadow-whisper"
      aria-label={placeholder ? `${label}: dato pendiente, proximo corte` : label}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {status === "live" ? (
              <span className="gov-kpi-dot bg-teal-600" aria-hidden="true" />
            ) : null}
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
            {placeholder ? (
              <Badge variant="outline" className="border-slate-200 text-[10px] text-slate-500">
                Proximo corte
              </Badge>
            ) : null}
          </div>
          <div className="mt-3 flex items-end gap-1.5">
            <div
              className={[
                "font-display text-3xl font-bold tabular-nums leading-none",
                placeholder ? "text-slate-400" : "text-slate-900",
              ].join(" ")}
            >
              {value}
            </div>
            {caption ? <span className="text-sm leading-5 text-slate-500">{caption}</span> : null}
          </div>
        </div>
        <span
          className={[
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            placeholder ? "bg-slate-100 text-slate-400" : "bg-teal-50 text-teal-700",
          ].join(" ")}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </article>
  );
}
