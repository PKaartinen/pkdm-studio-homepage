"use client";

// ---------------------------------------------------------------------------
// T-308 — Master glide choreography (spec §3) + T-330 revision (spec §3b).
// ALL timeline keyframes for the cursor / camera / floor-world live HERE as
// pure functions of the damped scroll value (scroll-store — the single
// damping source). Pure functions of one damped input ⇒ scrubbing is
// perfectly reversible up/down by construction (no accumulated state).
//
// §3b.6 GLOBAL RULE — no straight segment-to-segment cursor travel: the
// cursor path is a C1-continuous monotone-limited Hermite spline (a
// Catmull-Rom generalization) through 2D waypoints, with per-act viewport
// offsets blended by the same spline. Holds stay EXACT (zero tangent at
// plateaus), approaches decelerate in along curved traces — a human hand
// moving a mouse, never a robot. Rotation is owned by CursorRig and stays
// clamped ≤15° everywhere.
//
// Money-shot holds: every act's key moment holds ≥40% of its act range at
// fixed scroll positions (see MONEY_SHOTS — used for recording + QA).
// ---------------------------------------------------------------------------

import { actAt, actProgress, easeInOutCubic, remap } from "./scroll-store";

type Key = { at: number; v: number };

/** Piecewise keyframe track: eased between keys, flat plateaus by repetition.
 *  (Camera + act-content tracks; the CURSOR uses the spline below — §3b.6.) */
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

// --- §3b.6 — smoothed spline track (monotone-limited Hermite) ---------------
// C1 continuous through waypoints; tangents zero at plateaus and reversals
// (holds stay exact, no overshoot), finite-difference through-tangents
// everywhere else (corners round instead of hitting L-shaped joints).
function limitTangent(dA: number, dB: number): number {
  if (dA * dB <= 0) return 0; // plateau/reversal — hold exactly, no overshoot
  const m = (dA + dB) / 2;
  const lim = 3 * Math.min(Math.abs(dA), Math.abs(dB)); // Fritsch–Carlson
  return Math.sign(m) * Math.min(Math.abs(m), lim);
}

export function splineTrack(keys: Key[], t: number): number {
  const n = keys.length;
  if (t <= keys[0].at) return keys[0].v;
  if (t >= keys[n - 1].at) return keys[n - 1].v;
  let i = 1;
  while (t > keys[i].at) i++;
  const a = keys[i - 1];
  const b = keys[i];
  const h = b.at - a.at;
  const d = (b.v - a.v) / h;
  const dPrev = i >= 2 ? (a.v - keys[i - 2].v) / (a.at - keys[i - 2].at) : d;
  const dNext =
    i < n - 1 ? (keys[i + 1].v - b.v) / (keys[i + 1].at - b.at) : d;
  const m0 = limitTangent(dPrev, d);
  const m1 = limitTangent(d, dNext);
  const u = (t - a.at) / h;
  const u2 = u * u;
  const u3 = u2 * u;
  return (
    (2 * u3 - 3 * u2 + 1) * a.v +
    (u3 - 2 * u2 + u) * h * m0 +
    (-2 * u3 + 3 * u2) * b.v +
    (u3 - u2) * h * m1
  );
}

// --- Cursor world-position waypoints (z = 0 plane) ---------------------------
// ONE shared 2D waypoint list — x(t) and y(t) are splined together, so the
// trace between waypoints is a rounded curve, never a straight segment.
// Hero (start) is anchored to the measured "convert." rect (CursorRig);
// these waypoints take over as the hero act scrolls away (heroBlend).
// §3b positional notes 2 & 5 are applied as per-act VIEWPORT offsets below
// (exact vh/vw shifts, converted through the camera in CursorRig).
type Waypoint = { at: number; x: number; y: number };

const CURSOR_PATH: Waypoint[] = [
  { at: actAt("focus", 0.0), x: 0, y: 0.55 }, // settle over the type plane
  { at: actAt("focus", 0.85), x: 0, y: 0.55 }, // HOLD — the focus money shot
  { at: actAt("focus", 0.96), x: 0.22, y: 0.72 }, // bowed rise into the work act
  { at: actAt("work", 0.06), x: 0, y: 0.95 },
  { at: actAt("work", 0.92), x: 0, y: 0.95 }, // HOLD — panels glide beneath
  { at: actAt("build", 0.18), x: 0.7, y: 1.02 }, // follow the line draw…
  { at: actAt("build", 0.42), x: 1.7, y: 1.12 }, // …arcing right, drifting up
  { at: actAt("build", 0.62), x: 2.05, y: 0.82 }, // rounds the far corner, sinking
  { at: actAt("build", 0.85), x: 1.5, y: 0.5 }, // curves back left while descending
  { at: actAt("click", 0.12), x: 1.22, y: 0.18 }, // sweeping approach to the pill
  { at: actAt("click", 0.32), x: 1.3, y: 0.0 }, // settle centered above the pill
  { at: actAt("click", 1.0), x: 1.3, y: 0.0 }, // HOLD — the click seam
];

const CURSOR_X: Key[] = CURSOR_PATH.map((w) => ({ at: w.at, v: w.x }));
const CURSOR_Y: Key[] = CURSOR_PATH.map((w) => ({ at: w.at, v: w.y }));

export function cursorTarget(v: number): { x: number; y: number } {
  return { x: splineTrack(CURSOR_X, v), y: splineTrack(CURSOR_Y, v) };
}

// --- §3b notes 2 & 5 — per-act cursor offsets in VIEWPORT units --------------
// Act 1: +30vh down / +20vw right. Act 2: +45vh down / +15vw right
// (independent adjustments). Converted to world units through the live
// camera in CursorRig (exact at any viewport), splined so the offset
// transitions are part of the same smooth, curved travel.
// Sign convention: vw > 0 = right, vh > 0 = down.
const OFFSET_VW: Key[] = [
  { at: actAt("hero", 0.8), v: 0 },
  { at: actAt("focus", 0.3), v: 20 },
  { at: actAt("focus", 0.85), v: 20 },
  { at: actAt("work", 0.1), v: 15 },
  { at: actAt("work", 0.9), v: 15 },
  { at: actAt("build", 0.35), v: 0 }, // Act 3 base position is §3b-untouched
  { at: 1, v: 0 },
];
const OFFSET_VH: Key[] = [
  { at: actAt("hero", 0.8), v: 0 },
  { at: actAt("focus", 0.3), v: 30 },
  { at: actAt("focus", 0.85), v: 30 },
  { at: actAt("work", 0.1), v: 45 },
  { at: actAt("work", 0.9), v: 45 },
  { at: actAt("build", 0.35), v: 0 },
  { at: 1, v: 0 },
];

export function cursorViewportOffset(v: number): { vw: number; vh: number } {
  return { vw: splineTrack(OFFSET_VW, v), vh: splineTrack(OFFSET_VH, v) };
}

/** §3b.1 — hero cursor sits ~10vh lower so its bottom half catches the
 *  grid/caustic refraction on the first frame (applied to the word anchor
 *  in CursorRig as an exact screen-space shift). */
export const HERO_DROP_VH = 10;

/** 0 = hero word-anchor, 1 = choreography track (blend over hero scroll-away).
 *  §3b.6: the blend starts EARLY — the cursor lets go of the headline as soon
 *  as scrolling starts, so it never rides the word straight up off-screen;
 *  the spline carries it down to the focus position in one rounded dive. */
export function heroBlend(v: number): number {
  return easeInOutCubic(remap(v, actAt("hero", 0.35), actAt("focus", 0.1)));
}

// --- Camera keyframes (subtle dolly only — hero pose is Checkpoint-A locked)
const CAM_Y: Key[] = [
  { at: 0.0, v: 0.9 },
  { at: actAt("focus", 0.05), v: 0.9 },
  { at: actAt("focus", 0.4), v: 1.08 }, // focus — a touch higher, onto the plane
  { at: actAt("focus", 0.9), v: 1.08 },
  { at: actAt("work", 0.23), v: 0.92 },
  { at: actAt("work", 0.92), v: 0.92 },
  { at: actAt("build", 0.3), v: 1.02 }, // build — slightly above the skeleton
  { at: actAt("build", 0.9), v: 1.02 },
  { at: actAt("click", 0.36), v: 0.95 },
  { at: 1.0, v: 0.95 },
];
const CAM_Z: Key[] = [
  { at: 0.0, v: 7.2 },
  { at: actAt("focus", 0.1), v: 7.2 },
  { at: actAt("focus", 0.5), v: 7.0 },
  { at: actAt("focus", 0.9), v: 7.0 },
  { at: actAt("work", 0.23), v: 7.5 }, // work — wider for the panel queue
  { at: actAt("work", 0.92), v: 7.5 },
  { at: actAt("build", 0.3), v: 7.15 },
  { at: actAt("build", 0.9), v: 7.15 },
  { at: actAt("click", 0.36), v: 7.25 },
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
      { at: 0.3, v: 0 }, // plane arrives under the cursor
      { at: 0.85, v: 0 }, // HOLD — the resolved money shot
      { at: 1, v: -4.4 }, // exits left as the work act approaches
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
// each panel k holds centered under the cursor for HOLD_FRACTION of its slot.
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
    g = -1.5 + 1.5 * easeInOutCubic(remap(p, 0, intro));
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
  return actAt("work", intro + span * (k + holdFraction / 2));
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
  hero: actAt("hero", 0.42),
  focus: actAt("focus", 0.65), // "why you?" fully resolved, held
  work: workPanelHoldProgress(2), // a mid-queue panel hover-lift, held
  build: actAt("build", 0.85), // skeleton drawn + glass filled, held
  click: actAt("click", 0.55), // pill stable, cursor centered above (Phase-3 seam)
} as const;
