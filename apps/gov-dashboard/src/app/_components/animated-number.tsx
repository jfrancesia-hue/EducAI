"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

interface AnimatedNumberProps {
  value: number | string;
  duration?: number;
  suffix?: string;
  decimals?: number;
  className?: string;
  style?: CSSProperties;
}

function shouldSkipAnimation(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function AnimatedNumber(props: AnimatedNumberProps) {
  const { value, suffix = "", decimals = 0, className, style } = props;
  const isString = typeof value === "string";
  const [reducedMotion] = useState<boolean>(() => shouldSkipAnimation());

  if (isString || reducedMotion) {
    const text = isString ? value : value.toFixed(decimals);
    return (
      <span className={className} style={style}>
        {text}
        {suffix}
      </span>
    );
  }

  return <AnimatedCounter {...props} />;
}

function AnimatedCounter({
  value,
  duration = 1400,
  suffix = "",
  decimals = 0,
  className = "",
  style,
}: AnimatedNumberProps) {
  const numericValue = value as number;
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState<string>("0");

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setDisplay(numericValue.toFixed(decimals));
      return;
    }

    let raf = 0;
    let startTime: number | null = null;
    let started = false;

    const observer = new IntersectionObserver(
      (entries) => {
        if (started) {
          return;
        }

        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          started = true;
          const animate = (timestamp: number) => {
            if (startTime === null) {
              startTime = timestamp;
            }

            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = numericValue * eased;

            setDisplay(current.toFixed(decimals));
            if (progress < 1) {
              raf = requestAnimationFrame(animate);
            } else {
              setDisplay(numericValue.toFixed(decimals));
            }
          };

          raf = requestAnimationFrame(animate);
          observer.disconnect();
        });
      },
      { threshold: 0.4 },
    );

    observer.observe(el);

    return () => {
      if (raf) {
        cancelAnimationFrame(raf);
      }
      observer.disconnect();
    };
  }, [numericValue, duration, decimals]);

  return (
    <span ref={ref} className={className} style={style}>
      {display}
      {suffix}
    </span>
  );
}
