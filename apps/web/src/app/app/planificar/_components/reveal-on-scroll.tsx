"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Anima la entrada de su contenido cuando el viewport lo alcanza. Usa
 * `IntersectionObserver` con `rootMargin` generoso para que el efecto
 * dispare un poquito antes de que la sección sea visible — más natural.
 *
 * `prefers-reduced-motion` desactiva la animación: el contenido se muestra
 * directamente sin transición.
 *
 * Sin scripts ni dependencias: si JS falla o el browser no soporta IO, el
 * contenido queda visible (estado inicial `revealed=true`).
 */
export function RevealOnScroll({
  children,
  className,
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  // SSR-friendly: en server-side rendering arrancamos visibles para que el
  // contenido no quede oculto si JS nunca corre. En cliente cambiamos a
  // false en el primer effect si la API está disponible.
  const [revealed, setRevealed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("IntersectionObserver" in window)) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    setRevealed(false);

    const target = ref.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            window.setTimeout(() => setRevealed(true), delayMs);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: "0px 0px -80px 0px", threshold: 0.05 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [delayMs]);

  return (
    <div
      ref={ref}
      className={[
        "transition duration-500 ease-out motion-reduce:transition-none",
        revealed ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
