"use client";

// ---------------------------------------------------------------------------
// Shared step-tour engine — a scripted auto-scroll that visits an ordered list
// of scroll STOPS, easing into each one and holding a beat before moving on,
// the way a real person reads a page (arrive → pause → move on). Used by both
// the 3D homepage tour (?tour=2) and the old-homepage-preview tour (?tour=2)
// so a before/after recording lines up.
//
// Timing is budgeted, not per-step: the whole take fits `totalSeconds` (shared
// tour-timing → both homepages finish together despite different stop counts).
// Transition time is proportional to scroll distance (≈constant travel speed,
// so a long stretch like the projects scroller isn't rushed), and every stop
// gets an equal pause. Input is locked for the length of the take; inert under
// reduced motion (the callers gate on that before calling in).
// ---------------------------------------------------------------------------

export type LenisLike = {
  stop: () => void;
  start: () => void;
  scrollTo: (
    target: number,
    opts?: { immediate?: boolean; force?: boolean }
  ) => void;
};

export type StepTourConfig = {
  /** Ordered progress stops in [0,1]; the take visits them top→bottom. */
  stops: number[];
  /** Whole-take budget in seconds (shared with the other homepage's tour). */
  totalSeconds: number;
  /** Fraction of the budget spent paused at stops (clamped 0–0.8). Default 0.34.
   *  Pass 0 for a single continuous glide (used for the ?tour=1 linear take). */
  pauseFraction?: number;
  /** Settle beat before the first move, ms. Default 600. */
  settleMs?: number;
  /** Lenis instance to drive/lock; falls back to window.scrollTo when absent. */
  lenis?: LenisLike | null;
  /** Current max scroll (scrollHeight − innerHeight), recomputed each frame. */
  getMax: () => number;
  /** Fires true when the scripted take starts, false when it ends/cancels. */
  onActiveChange?: (active: boolean) => void;
};

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Smootherstep — zero velocity AND acceleration at both ends, so the view
 *  eases cleanly to a dead stop at each section instead of jerking. */
const easeInOut = (x: number) => {
  const t = clamp01(x);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

type Phase = {
  kind: "move" | "hold";
  from: number;
  to: number;
  start: number;
  end: number;
};

/**
 * Run a step tour. Returns a cancel function that stops the take and restores
 * input immediately (call it from the caller's effect cleanup).
 */
export function runStepTour(cfg: StepTourConfig): () => void {
  const {
    totalSeconds,
    pauseFraction = 0.34,
    settleMs = 600,
    lenis = null,
    getMax,
    onActiveChange,
  } = cfg;

  // --- normalize stops: clamp, sort, dedupe, guarantee a leading 0 --------
  const sorted = cfg.stops.map(clamp01).sort((a, b) => a - b);
  const stops: number[] = [];
  for (const s of sorted) {
    if (stops.length === 0 || s - stops[stops.length - 1] > 1e-4) stops.push(s);
  }
  if (stops.length === 0) stops.push(0, 1);
  if (stops[0] > 1e-4) stops.unshift(0);

  // --- budget: equal pause per arrival, transitions ∝ distance ------------
  const arrivals = Math.max(1, stops.length - 1);
  const pauseTotal = Math.min(0.8, Math.max(0, pauseFraction)) * totalSeconds;
  const pausePer = pauseTotal / arrivals;
  const moveTotal = Math.max(0, totalSeconds - pauseTotal);
  const span = stops[stops.length - 1] - stops[0] || 1;

  const phases: Phase[] = [];
  let t = 0;
  for (let i = 1; i < stops.length; i++) {
    const dist = stops[i] - stops[i - 1];
    const moveDur = moveTotal * (dist / span);
    phases.push({
      kind: "move",
      from: stops[i - 1],
      to: stops[i],
      start: t,
      end: t + moveDur,
    });
    t += moveDur;
    phases.push({
      kind: "hold",
      from: stops[i],
      to: stops[i],
      start: t,
      end: t + pausePer,
    });
    t += pausePer;
  }
  const runSeconds = t;

  let raf = 0;
  let settleTimer = 0;
  let cancelled = false;
  let locked = false;

  // --- input lock (wheel/touch via Lenis stop + key/wheel blockers) -------
  const block = (e: Event) => e.preventDefault();
  const blockKeys = (e: KeyboardEvent) => {
    const keys = [
      " ",
      "ArrowDown",
      "ArrowUp",
      "PageDown",
      "PageUp",
      "Home",
      "End",
    ];
    if (keys.includes(e.key)) e.preventDefault();
  };
  const lock = () => {
    if (locked) return;
    locked = true;
    lenis?.stop();
    window.addEventListener("wheel", block, { passive: false });
    window.addEventListener("touchmove", block, { passive: false });
    window.addEventListener("keydown", blockKeys);
  };
  const unlock = () => {
    if (!locked) return;
    locked = false;
    window.removeEventListener("wheel", block);
    window.removeEventListener("touchmove", block);
    window.removeEventListener("keydown", blockKeys);
    lenis?.start();
  };

  const applyP = (p: number) => {
    const y = clamp01(p) * getMax();
    // Drive THROUGH Lenis (immediate+force works while stopped and pins native
    // scroll — that's the input lock). Native fallback when Lenis is absent.
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
  };

  const run = () => {
    if (cancelled) return;
    onActiveChange?.(true);
    lock();
    const t0 = performance.now();
    // Shared instrumentation flag with the linear tour (shot-list timing).
    (window as unknown as { __tourT0?: number }).__tourT0 = t0;
    let idx = 0;
    const tick = (now: number) => {
      if (cancelled) return;
      const ts = (now - t0) / 1000;
      while (idx < phases.length - 1 && ts > phases[idx].end) idx++;
      const ph = phases[idx];
      let p: number;
      if (ts >= runSeconds) {
        p = stops[stops.length - 1];
      } else if (ph.kind === "move") {
        const u = (ts - ph.start) / Math.max(1e-6, ph.end - ph.start);
        p = ph.from + (ph.to - ph.from) * easeInOut(u);
      } else {
        p = ph.from; // holding at a stop
      }
      applyP(p);
      if (ts < runSeconds) {
        raf = requestAnimationFrame(tick);
      } else {
        onActiveChange?.(false);
        unlock();
      }
    };
    raf = requestAnimationFrame(tick);
  };

  applyP(stops[0]); // reset to the first stop, then settle before rolling
  settleTimer = window.setTimeout(run, settleMs);

  return () => {
    cancelled = true;
    clearTimeout(settleTimer);
    cancelAnimationFrame(raf);
    onActiveChange?.(false);
    unlock();
  };
}
