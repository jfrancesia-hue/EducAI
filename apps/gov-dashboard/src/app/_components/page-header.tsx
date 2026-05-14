import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}

export function PageHeader({ eyebrow, title, subtitle, action }: PageHeaderProps) {
  return (
    <header className="mb-8 border-b border-slate-200 pb-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="mb-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {title}
          </h1>
          {subtitle ? <p className="mt-3 text-sm leading-6 text-slate-600">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
