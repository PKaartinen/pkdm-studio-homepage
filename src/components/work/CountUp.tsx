"use client";

import { useEffect, useRef } from "react";

/**
 * Stat value that counts up once when it scrolls into view. The canonical
 * string is what's server-rendered (crawlers / no-JS / reduced motion see the
 * exact value); only the leading numeric run animates — "680+", "2,000+",
 * "~18 KB", "< 2.5 s", "30-day" all keep their prefix/suffix untouched.
 * Tabular numerals + a min-width keep the layout from jittering.
 */
const NUM = /^([^\d]*)(\d[\d,]*(?:\.\d+)?)(.*)$/;

export default function CountUp({
  value,
  className = "",
  duration = 1400,
}: {
  value: string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    const m = NUM.exec(value);
    if (!el || !m) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const [, prefix, raw, suffix] = m;
    const target = parseFloat(raw.replace(/,/g, ""));
    const decimals = raw.includes(".") ? raw.split(".")[1].length : 0;
    const useComma = raw.includes(",");
    if (!isFinite(target) || target === 0) return;

    const fmt = (n: number) => {
      const fixed = n.toFixed(decimals);
      return useComma
        ? Number(fixed).toLocaleString("en-US", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })
        : fixed;
    };

    let raf = 0;
    let started = false;
    el.textContent = `${prefix}${fmt(0)}${suffix}`;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started) return;
        started = true;
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / duration);
          const e = 1 - Math.pow(1 - p, 3);
          el.textContent = `${prefix}${fmt(target * e)}${suffix}`;
          if (p < 1) raf = requestAnimationFrame(tick);
          else el.textContent = value;
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      if (el) el.textContent = value;
    };
  }, [value, duration]);

  return (
    <span
      ref={ref}
      className={className}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {value}
    </span>
  );
}
