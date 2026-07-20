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
 * Progress stops from the live DOM. Anchored to the top of each top-level
 * section (nudged up to clear the fixed header), then cleaned up so the take
 * reads evenly: stops closer than ~half a screen are merged (no darting to a
 * thin strip like the marquee), and any gap longer than ~1.2 screens is broken
 * into evenly spaced intermediate stops (the middle ground for long sections
 * like the projects grid). Computed at run time so offsets are final.
 */
function sectionStops(): number[] {
  const main = document.getElementById("main");
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (!main || max <= 0) return [0, 1];

  const vh = window.innerHeight;
  const NAV = 84; // clear the fixed <header> so section headings aren't hidden
  const MIN_GAP = vh * 0.55; // merge stops closer than ~half a screen
  const MAX_GAP = vh * 1.2; // break transitions longer than ~1.2 screens

  const raw = [0];
  for (const el of Array.from(main.children) as HTMLElement[]) {
    raw.push(Math.max(0, el.getBoundingClientRect().top + window.scrollY - NAV));
  }
  raw.push(max);
  raw.sort((a, b) => a - b);

  // Merge stops that sit too close together.
  const merged: number[] = [];
  for (const y of raw) {
    if (merged.length === 0 || y - merged[merged.length - 1] >= MIN_GAP)
      merged.push(y);
  }
  // Guarantee the bottom is the final stop and isn't crowded by the one before.
  if (merged[merged.length - 1] !== max) {
    while (merged.length && max - merged[merged.length - 1] < MIN_GAP)
      merged.pop();
    merged.push(max);
  }

  // Break long transitions into evenly spaced intermediate stops.
  const out: number[] = [];
  for (let i = 0; i < merged.length; i++) {
    out.push(merged[i]);
    if (i === merged.length - 1) break;
    const a = merged[i];
    const b = merged[i + 1];
    const inserts = Math.max(0, Math.ceil((b - a) / MAX_GAP) - 1);
    for (let k = 1; k <= inserts; k++) out.push(a + ((b - a) * k) / (inserts + 1));
  }

  return out.map((y) => Math.min(1, Math.max(0, y / max)));
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
