"use client";

import Image, { type ImageProps } from "next/image";
import { ImageIcon } from "lucide-react";
import { useState } from "react";

import { cn } from "@educai/ui";

type VisualImageProps = ImageProps & {
  fallbackTitle?: string;
  fallbackTone?: string;
};

export function VisualImage({
  alt,
  className,
  fallbackTitle = "Imagen educativa",
  fallbackTone = "from-[#17362f] via-[#1f4f58] to-[#7c6cff]",
  onError,
  ...props
}: VisualImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-br",
          fallbackTone,
        )}
        role="img"
        aria-label={alt}
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.10)_1px,transparent_1px)] bg-[size:42px_42px] opacity-30" />
        <div className="relative mx-6 max-w-xs rounded-lg border border-white/18 bg-white/12 p-5 text-center text-white shadow-float backdrop-blur-xl">
          <ImageIcon className="mx-auto h-7 w-7 text-[#f8d95c]" aria-hidden="true" />
          <p className="mt-3 font-display text-lg font-semibold tracking-tight">{fallbackTitle}</p>
          <p className="mt-1 text-sm leading-5 text-white/72">
            La imagen real no cargo, pero la experiencia conserva contexto visual.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Image
      alt={alt}
      className={className}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
      {...props}
    />
  );
}
