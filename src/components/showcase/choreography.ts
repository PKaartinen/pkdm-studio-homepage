"use client";

// ---------------------------------------------------------------------------
// T-308 — Master glide choreography (spec §3). ALL timeline keyframes for the
// cursor / camera / floor-world live HERE as pure functions of the damped
// scroll value (scroll-store — the single damping source). Pure functions of
// one damped input ⇒ scrubbing is perfectly reversible up/down by
// construction (no accumulated state, no pops).
//
// Spatial metaphor (spec §2a): the floor-world moves past the cursor —
// the cursor's own XY drifts stay subtle. Glide rule: rotation is owned by
// CursorRig and stays clamped ≤15° everywhere.
//
// Money-shot holds: every act's key moment holds ≥40% of its act range at
// fixed scroll positions (see MONEY_SHOTS — used for recording + QA).
// ---------------------------------------------------------------------------

import { actProgress, easeInOutCubic, remap } from "./scroll-store";

type Key = { at: number; v: number };

/** Piecewise keyframe track: eased between keys, flat plateaus by repetition. */
export function track(keys: Key[], t: number): number {
  if (t <= keys[0].at) return keys[0].v;
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i].at) {
      const a = keys[i - 1];
      const b = keys[i];
      const u = (t - a.at) / (b.at - a.at);
      return a.v + (b.v - a.v) * easeInOutCubic(u);
    }
  }
  return keys[keys.length - 1].v;
}

// --- Cursor world-position keyframes (z = 0 plane) --------------------------
// Hero (0–0.12) is anchored to the measured "convert." rect (CursorRig);
// these tracks take over as the hero act scrolls away (heroBlend).
const CURSOR_X: Key[] = [
  { at: 0.12, v: 0 },      // focus — centered above the type plane
  { at: 0.34, v: 0 },
  { at: 0.58, v: 0 },      // work — panels pass beneath, cursor steady
  { at: 0.61, v: -0.6 },   // build — subtle drift following the line draw
  { at: 0.68, v: 0.6 },
  { at: 0.73, v: 0 },      // settle centered; HOLD through the click seam
  { at: 1.0, v: 0 },
];
const CURSOR_Y: Key[] = [
  { at: 0.12, v: 0.55 },   // focus — hovering above the type plane
  { at: 0.3, v: 0.55 },
  { at: 0.36, v: 0.95 },   // work — high, panels glide beneath
  { at: 0.56, v: 0.95 },
  { at: 0.62, v: 1.05 },   // build — above the drawing skeleton
  { at: 0.74, v: 1.05 },
  { at: 0.84, v: 0.0 },    // click — descend toward the CTA pill, then HOLD
  { at: 1.0, v: 0.0 },
];

export function cursorTarget(v: number): { x: number; y: number } {
  return { x: track(CURSOR_X, v), y: track(CURSOR_Y, v) };
}

/** 0 = hero word-anchor, 1 = choreography track (blend over hero scroll-away). */
export function heroBlend(v: number): number {
  return easeInOutCubic(remap(v, 0.09, 0.17));
}

// --- Camera keyframes (subtle dolly only — hero pose is Checkpoint-A locked)
const CAM_Y: Key[] = [
  { at: 0.0, v: 0.9 },
  { at: 0.13, v: 0.9 },
  { at: 0.2, v: 1.08 },   // focus — a touch higher, onto the type plane
  { at: 0.3, v: 1.08 },
  { at: 0.38, v: 0.92 },
  { at: 0.56, v: 0.92 },
  { at: 0.64, v: 1.02 },  // build — slightly above the skeleton
  { at: 0.76, v: 1.02 },
  { at: 0.86, v: 0.95 },
  { at: 1.0, v: 0.95 },
];
const CAM_Z: Key[] = [
  { at: 0.0, v: 7.2 },
  { at: 0.14, v: 7.2 },
  { at: 0.22, v: 7.0 },
  { at: 0.3, v: 7.0 },
  { at: 0.38, v: 7.5 },   // work — wider for the panel queue
  { at: 0.56, v: 7.5 },
  { at: 0.64, v: 7.15 },
  { at: 0.76, v: 7.15 },
  { at: 0.86, v: 7.25 },
  { at: 1.0, v: 7.25 },
];

export function cameraTarget(v: number): { y: number; z: number } {
  return { y: track(CAM_Y, v), z: track(CAM_Z, v) };
}

// --- Act 1 — Focus (T-309) ---------------------------------------------------
// The floor-world glides the type plane right-to-left under the cursor.
// Resolve completes by p=0.5 and HOLDS 0.5–0.85 (≥40% of the act range).
export function focusPlanePose(v: number) {
  const p = actProgress("focus", v);
  const x = track(
    [
      { at: 0, v: 3.6 },
      { at: 0.3, v: 0 },   // plane arrives under the cursor
      { at: 0.85, v: 0 },  // HOLD — the resolved money shot
      { at: 1, v: -4.4 },  // exits left as the work act approaches
    ],
    p
  );
  const opacity =
    remap(p, 0.0, 0.08) * (1 - easeInOutCubic(remap(p, 0.88, 1)));
  // Wake capsule radius — grows until the phrase is fully crisp, then holds.
  const radius = 0.3 + 1.9 * easeInOutCubic(remap(p, 0.08, 0.5));
  return { p, x, opacity, radius };
}

// --- Act 2 — The Work (T-311) ------------------------------------------------
// Six panels, right-to-left arc queue. Equal hover holds by construction:
// each panel k holds centered under the cursor for HOLD_FRACTION of its slot
// (58% ≥ 40% — founder rule: EQUAL treatment, all six).
export const WORK_QUEUE = {
  intro: 0.06,
  outro: 0.94,
  holdFraction: 0.58,
  panelCount: 6,
  spacing: 3.4,
} as const;

/** Continuous "focused panel index": panel k sits centered while g ≈ k. */
export function workFocusIndex(v: number): number {
  const { intro, outro, holdFraction, panelCount } = WORK_QUEUE;
  const p = actProgress("work", v);
  const bp = actProgress("build", v);
  let g: number;
  if (p <= intro) {
    g = -1.5 + 1.5 * easeInOutCubic(p / intro);
  } else if (p >= outro) {
    g = panelCount - 1 + 1.6 * easeInOutCubic(remap(p, outro, 1));
  } else {
    const span = (outro - intro) / panelCount;
    const u = (p - intro) / span;
    const k = Math.min(panelCount - 1, Math.floor(u));
    const f = u - k;
    g =
      k +
      (f <= holdFraction
        ? 0
        : easeInOutCubic((f - holdFraction) / (1 - holdFraction)));
  }
  // Panels keep exiting left as the build act begins (act hand-off).
  g += 2.6 * easeInOutCubic(remap(bp, 0, 0.18));
  return g;
}

/** Page-progress position of panel k's hover-hold center (recording/QA). */
export function workPanelHoldProgress(k: number): number {
  const { intro, outro, holdFraction, panelCount } = WORK_QUEUE;
  const span = (outro - intro) / panelCount;
  const p = intro + span * (k + holdFraction / 2);
  return 0.32 + (0.58 - 0.32) * p;
}

// --- Act 3 — The Build (T-312) -----------------------------------------------
// Line draw scrubs 0.06→0.55, glass fill 0.55→0.78, then HOLD 0.78–1.0
// (≥40% incl. the finale seam: the CTA pill stays visible and stable
// through the whole click act for the Phase-3 hand-off).
export function buildPose(v: number) {
  const p = actProgress("build", v);
  const cp = actProgress("click", v);
  const appear = remap(p, 0.0, 0.06);
  const draw = easeInOutCubic(remap(p, 0.06, 0.55));
  const fill = easeInOutCubic(remap(p, 0.55, 0.78));
  // Finale seam: nav/hero strokes dim while the pill stays full-bright.
  const dim = 0.75 * easeInOutCubic(remap(cp, 0.08, 0.32));
  return { p, cp, appear, draw, fill, dim };
}

/** Stats scrub envelope — settles by build p=0.62, holds (pausing holds it). */
export function statsProgress(v: number): number {
  return easeInOutCubic(remap(actProgress("build", v), 0.12, 0.62));
}

// --- Annotation visibility envelopes ----------------------------------------
export function focusAnnotationOpacity(v: number): number {
  const p = actProgress("focus", v);
  return remap(p, 0.32, 0.44) * (1 - remap(p, 0.85, 0.95));
}

export function buildAnnotationOpacity(v: number): number {
  const p = actProgress("build", v);
  const cp = actProgress("click", v);
  return remap(p, 0.6, 0.72) * (1 - remap(cp, 0.1, 0.3));
}

/** Scroll hint fades as soon as the story starts moving. */
export function scrollHintOpacity(v: number): number {
  return 1 - remap(v, 0.01, 0.06);
}

// --- Money shots (fixed scroll positions, mid-hold — repeatable) -------------
export const MONEY_SHOTS = {
  hero: 0.05,
  focus: 0.12 + 0.2 * 0.65, // 0.25 — "why you?" fully resolved, held
  work: workPanelHoldProgress(2), // a mid-queue panel hover-lift, held
  build: 0.58 + 0.2 * 0.85, // 0.75 — skeleton drawn + glass filled, held
  click: 0.9, // pill stable, cursor centered above (Phase-3 seam)
} as const;
