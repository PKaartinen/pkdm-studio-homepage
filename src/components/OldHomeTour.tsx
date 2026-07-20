"use client";

import { useEffect } from "react";
import { resolveTourSeconds } from "@/components/showcase/tour-timing";
import { runStepTour, type LenisLike } from "@/components/showcase/tour-steps";

// ---------------------------------------------------------------------------
// ?tour=… for the retired homepage (/old-homepage-preview) — the before/after
// counterpart to the 3D homepage tour (showcase/TourController.tsx), sharing
// the same duration (tour-timing → default 42s, &tourSec=NN) and the same
// step engine (tour-steps) so the two takes line up:
//
//   ?tour=1  — one continuous ease-in/out glide top→bottom.
//   ?tour=2  — section-by-section (also `steps`/`sections`): eases to each
//              page section and PAUSES, the way a person reads a site. Tall
//              sections get intermediate viewport-sized stops (the middle
//              ground for long scrollers), so nothing is skimmed in one blur.
//
// Inert under reduced motion. Input is locked for the length of the take.
// ---------------------------------------------------------------------------

/** ?tour values that select the section-by-section step take. */
const STEP_VALUES = new Set(["2", "steps", "sections"]);

/**
 * Progress stops from the live DOM: the top of each top-level section (nudged
 * up to clear the fixed header), plus intermediate stops through any section
 * taller than the viewport so long content pauses on the way down. Computed at
 * run time (after fonts/images settle) so offsets are final.
 */
function sectionStops(): number[] {
  const main = document.getElementById("main");
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (!main || max <= 0) return [0, 1];

  const vh = window.innerHeight;
  const NAV = 84; // clear the fixed <header> so section headings aren't hidden
  const ys = new Set<number>([0]);

  for (const el of Array.from(main.children) as HTMLElement[]) {
    const top = el.getBoundingClientRect().top + window.scrollY;
    const height = el.offsetHeight;
    const sectionTop = Math.max(0, top - NAV);
    ys.add(sectionTop);

    // Middle ground: a section taller than ~1.3 viewports gets extra stops
    // roughly one screen apart so it reads in beats, not one long sweep.
    if (height > vh * 1.3) {
      const step = vh * 0.82;
      for (let y = sectionTop + step; y < top + height - vh * 0.5; y += step)
        ys.add(y);
    }
  }
  ys.add(max);

  return Array.from(ys, (y) => Math.min(1, Math.max(0, y / max))).sort(
    (a, b) => a - b
  );
}

export default function OldHomeTour() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tourParam = params.get("tour");
    const stepped = STEP_VALUES.has(tourParam ?? "");
    if (tourParam !== "1" && !stepped) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const total = resolveTourSeconds(params.get("tourSec"));
    const lenis =
      (window as unknown as { __pkdmLenis?: LenisLike }).__pkdmLenis ?? null;

    let cancelled = false;
    let settle = 0;
    let cancelTour: (() => void) | null = null;

    const start = () => {
      if (cancelled) return;
      window.scrollTo(0, 0);
      // Let layout settle (fonts/images) so section offsets are final.
      settle = window.setTimeout(() => {
        if (cancelled) return;
        cancelTour = runStepTour({
          stops: stepped ? sectionStops() : [0, 1],
          totalSeconds: total,
          pauseFraction: stepped ? 0.34 : 0, // 0 → one continuous glide
          settleMs: 0, // already settled above
          lenis,
          getMax: () =>
            document.documentElement.scrollHeight - window.innerHeight,
        });
      }, 400);
    };

    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });

    return () => {
      cancelled = true;
      clearTimeout(settle);
      cancelTour?.();
      window.removeEventListener("load", start);
    };
  }, []);

  return null;
}
