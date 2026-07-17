"use client";

// ---------------------------------------------------------------------------
// Shared scroll-progress store — THE single place where scroll damping lives
// (v6 canon). Lenis (root SmoothScroll.tsx) animates window.scrollY; this
// store normalizes it to 0–1, applies one critically-damped smoothing pass,
// and exposes per-act progress helpers consumed by BOTH the R3F scene and
// framer-motion DOM — keeping them in lockstep and perfectly reversible.
// ---------------------------------------------------------------------------

/** Act order + per-act scrub distances in svh of scrollable page (spec §3 +
 * §3b.3 — the work act got a Ciao-style LONG per-panel scrub distance, so
 * ranges are derived from these distances instead of hand-tuned fractions.
 * Section heights in ShowcaseExperience.tsx must stay in lockstep. */
const ACT_ORDER = ["hero", "focus", "work", "build", "click"] as const;
export type ActName = (typeof ACT_ORDER)[number];

export const ACT_SCRUB_SVH: Record<ActName, number> = {
  hero: 90,
  focus: 150,
  work: 195,
  build: 150,
  click: 165,
};

/** Act ranges as fractions of total scroll — derived, cumulative. */
export const ACTS = (() => {
  const total = ACT_ORDER.reduce((s, a) => s + ACT_SCRUB_SVH[a], 0);
  let acc = 0;
  const out = {} as Record<ActName, readonly [number, number]>;
  for (const a of ACT_ORDER) {
    out[a] = [acc / total, (acc + ACT_SCRUB_SVH[a]) / total] as const;
    acc += ACT_SCRUB_SVH[a];
  }
  return out;
})();

/** Global progress value at act-local progress p (0–1 inside the act). */
export function actAt(act: ActName, p: number): number {
  const [a, b] = ACTS[act];
  return a + (b - a) * p;
}

type Listener = (value: number) => void;

const state = {
  /** Raw normalized scroll target (already Lenis-smoothed at the DOM level). */
  target: 0,
  /** Damped value — the ONLY number the 3D scene and DOM animations read. */
  value: 0,
  /** Damping time-constant in seconds. Small: adds glide without lag/pops. */
  tau: 0.09,
  reducedMotion: false,
};

const listeners = new Set<Listener>();
let rafId = 0;
let running = false;
let lastT = 0;
let refs = 0;

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Normalized damped page progress 0–1. */
export function progress() {
  return state.value;
}

/** Progress 0–1 through a named act (clamped). Reversible by construction. */
export function actProgress(act: ActName, v = state.value) {
  const [a, b] = ACTS[act];
  return clamp01((v - a) / (b - a));
}

/** Smooth easing helpers (shared so DOM + 3D use identical curves). */
export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const smoothstep = (t: number) => t * t * (3 - 2 * t);
export const remap = (t: number, a: number, b: number) =>
  clamp01((t - a) / (b - a));

export function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function readTarget() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  state.target = max > 0 ? clamp01(window.scrollY / max) : 0;
}

function tick(t: number) {
  if (!running) return;
  const dt = Math.min((t - lastT) / 1000, 0.1);
  lastT = t;
  readTarget();
  if (state.reducedMotion) {
    state.value = state.target;
  } else {
    // Exponential (framerate-independent) critical damping toward target.
    const k = 1 - Math.exp(-dt / state.tau);
    state.value += (state.target - state.value) * k;
    // Snap when imperceptibly close so rest state is exact (reversibility).
    if (Math.abs(state.target - state.value) < 1e-5) state.value = state.target;
  }
  listeners.forEach((fn) => fn(state.value));
  rafId = requestAnimationFrame(tick);
}

/** Ref-counted start. Call from the experience shell; returns stop(). */
export function startScrollStore() {
  refs++;
  if (!running) {
    running = true;
    state.reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    readTarget();
    state.value = state.target;
    lastT = performance.now();
    rafId = requestAnimationFrame(tick);
  }
  return () => {
    refs--;
    if (refs <= 0) {
      refs = 0;
      running = false;
      cancelAnimationFrame(rafId);
    }
  };
}
