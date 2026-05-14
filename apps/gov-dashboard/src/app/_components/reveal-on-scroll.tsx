"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type RevealTag = "div" | "section" | "article" | "li" | "header";

interface RevealOnScrollProps {
  children: ReactNode;
  delay?: number;
  as?: RevealTag;
  className?: string;
  once?: boolean;
}

export function RevealOnScroll({
  children,
  delay = 0,
  as = "div",
  className = "",
  once = true,
}: RevealOnScrollProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("in-view");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add("in-view");
            if (once) {
              observer.unobserve(el);
            }
          } else if (!once) {
            el.classList.remove("in-view");
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -50px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  const Tag = as;
  const style: CSSProperties | undefined =
    delay > 0 ? { transitionDelay: `${delay}ms` } : undefined;
  const setRef = (node: HTMLElement | null) => {
    ref.current = node;
  };

  return (
    <Tag ref={setRef} className={`reveal ${className}`} style={style}>
      {children}
    </Tag>
  );
}
