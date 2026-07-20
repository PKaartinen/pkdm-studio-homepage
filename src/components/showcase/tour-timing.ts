// ---------------------------------------------------------------------------
// Shared tour timing — the single source of truth for how long a ?tour=1 take
// runs. Both the 3D homepage tour (TourController.tsx) and the old-homepage
// preview tour (OldHomeTour.tsx) import this so a side-by-side before/after
// recording lines up: same default duration, same &tourSec override, so the
// two tours start and finish together regardless of differing page heights.
// ---------------------------------------------------------------------------

/** Per-act seconds for the scripted 3D take — also defines the total budget. */
export const ACT_SECONDS = {
  hero: 5,
  focus: 6.5,
  work: 14,
  build: 6.5,
  click: 10,
} as const;

/** Default take duration in seconds (sum of ACT_SECONDS → 42). */
export const TOTAL_S = Object.values(ACT_SECONDS).reduce((a, b) => a + b, 0);

/**
 * Resolve the take duration from a `tourSec` query value: the finite override
 * clamped to 20–120s, else the default TOTAL_S. Kept identical across both
 * tours so `?tour=1` (and `?tour=1&tourSec=NN`) yields the same wall-clock
 * length on either homepage.
 */
export function resolveTourSeconds(tourSecParam: string | null): number {
  const sec = parseFloat(tourSecParam ?? "");
  return Number.isFinite(sec) ? Math.min(120, Math.max(20, sec)) : TOTAL_S;
}
