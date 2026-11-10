"use client";

import { useEffect, useState } from "react";

type LenisLike = { scrollTo: (y: number) => void };

/** Studio local time (Tallinn, EET/EEST) — updates every 30 s. */
export function LocalTime() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const fmt = () =>
      new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Tallinn",
      }).format(new Date());
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 30_000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="font-mono tabular-nums" suppressHydrationWarning>
      {time ?? "--:--"}
    </span>
  );
}

/** Smooth back-to-top (Lenis when present). */
export function BackToTop() {
  return (
    <button
      type="button"
      onClick={() => {
        const lenis = (window as unknown as { __pkdmLenis?: LenisLike }).__pkdmLenis;
        if (lenis) lenis.scrollTo(0);
        else window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className="group inline-flex items-center gap-2 text-xs text-haze/70 transition-colors hover:text-white"
    >
      Back to top
      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 transition-colors group-hover:border-accent/50">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5" fill="none" aria-hidden="true">
          <path d="M12 19V5M6 11l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  );
}
