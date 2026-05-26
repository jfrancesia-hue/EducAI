"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type BackButtonProps = {
  fallbackHref: string;
  label: string;
  showIcon?: boolean;
};

export function BackButton({ fallbackHref, label, showIcon = false }: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
          return;
        }

        window.location.assign(fallbackHref);
      }}
      className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d5e1dc] bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-whisper transition hover:bg-[#f7f8f3]"
    >
      {showIcon ? <ArrowLeft className="h-4 w-4" aria-hidden="true" /> : null}
      {label}
    </button>
  );
}
