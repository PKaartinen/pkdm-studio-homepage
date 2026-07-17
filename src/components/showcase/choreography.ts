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

import {
  actAt,
  actProgress,
  easeInOutCubic,
  remap,
  smoothstep,
} from "./scroll-store";

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

/** §3b.1 — hero cursor sits lower so its bottom half catches the
 *  grid/caustic refraction on the first frame (applied to the word anchor
 *  in CursorRig as an exact screen-space shift). Founder pre-record note
 *  2026-07-18: +15vh further down and 10vw left of the §3b.1 position. */
export const HERO_DROP_VH = 25;
export const HERO_SHIFT_VW = 5; // vw > 0 = right, < 0 = left (founder 2026-07-18: +15 right of the -10 note)

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

// --- Act 2 — The Work (T-311 + T-331 + T-334 continuous carousel) -------------
// Six panels, right-to-left arc queue. T-334 (founder note, pre-finalise):
// the T-331 stepped hold+glide profile read as too snappy — replaced with a
// CONTINUOUS CAROUSEL. The focus index g is a single LINEAR function of act
// progress (a conveyor: panels track scroll continuously, smooth throughout,
// damped ONLY by the shared store — no discrete steps, no magnetized
// snapping, no piecewise branches). Equal treatment is by construction:
// every panel crosses the focus position at identical velocity and spacing
// (~50svh of scroll per slot across the 390svh act). Hover-lift, edge-light
// swell, and the tag type-on all derive from each panel's PROXIMITY to the
// focus position (continuous falloff in WorkPanels), never from indices.
//
// This also fixes the T-334 duplicate-panel bug: the old profile's interior
// branch glided g → 6 at the last slot (as if a 7th panel existed), then the
// outro branch reset g back to 5 — crossing outro snapped panel 5
// (ecommerce-lander) from x≈−3.4 back to center: the "duplicate ECOMMERCE
// LANDER" ghost. g is now strictly monotone in p, so each of the six panels
// crosses the viewport exactly once across the entire act range.
export const WORK_QUEUE = {
  /** g at act start — panel 0 approaches from the right, off-screen. */
  gStart: -1.4,
  /** g at act end — panel 5 has crossed focus and is exiting left. */
  gEnd: 6.4,
  panelCount: 6,
  spacing: 3.4,
} as const;

const glideEase = (t: number) => {
  const c = t < 0 ? 0 : t > 1 ? 1 : t;
  return c * c * (3 - 2 * c); // smoothstep — heavy, damped, deliberate
};

/** Continuous "focused panel index": panel k crosses focus when g === k.
 *  Strictly monotone (linear conveyor + smooth build-act exit) — the store's
 *  damping is the only smoothing between input and motion. */
export function workFocusIndex(v: number): number {
  const { gStart, gEnd } = WORK_QUEUE;
  const p = actProgress("work", v);
  const bp = actProgress("build", v);
  let g = gStart + (gEnd - gStart) * p;
  // Panels keep exiting left as the build act begins (act hand-off) —
  // C1-continuous (zero-slope smoothstep ends), monotone.
  g += 2.6 * glideEase(remap(bp, 0, 0.18));
  return g;
}

/** Page-progress position where panel k is exactly at focus (recording/QA). */
export function workPanelHoldProgress(k: number): number {
  const { gStart, gEnd } = WORK_QUEUE;
  return actAt("work", (k - gStart) / (gEnd - gStart));
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

// --- Finale — The Click (T-313) ----------------------------------------------
// The skeleton's CTA pill grows into the giant glass button, rim light
// converges, hover state swells, then the CLICK: cursor press-down, button
// depress + spring-back with eased overshoot, cyan ripple ring across the
// floor grid, footer band lights up. ALL of it is a pure function of the
// damped store value — scrubbing the click is reversible by construction.
export const FINALE = {
  /** DOM CTA park point (B2-Q4 — the accepted click seam, ~65vw/76svh). */
  parkVW: 65,
  parkVH: 76,
  /** BuildSkeleton CTA pill world transform (group [1.3,-0.3,0.2] rotX -0.14
   *  scale 0.92 × local (0,-1,0)) — the grow starts EXACTLY here so the
   *  flat-pill → glass-button hand-off is seamless. */
  pillWorld: { x: 1.3, y: -1.2113, z: 0.3283, rotX: -0.14 },
  /** Flat pill dimensions in local units (pre-group-scale). */
  pillW: 1.35,
  pillH: 0.36,
  handoffScale: 0.92,
  /** Giant-button scale multiplier at full growth. */
  growScale: 1.5,
} as const;

export function clickPose(v: number) {
  const p = actProgress("click", v);
  // The pill grows into the giant glass button…
  const grow = easeInOutCubic(remap(p, 0.04, 0.34));
  // …the flat skeleton pill hands off (fades) while the 3D button fades in
  const pillFade = easeInOutCubic(remap(p, 0.06, 0.26));
  // Rim-light convergence onto the button
  const converge = easeInOutCubic(remap(p, 0.18, 0.5));
  // Hover state: glow swell + micro magnetic pull (holds through the beat
  // of stillness and the money shot at p=0.55)
  const hover = easeInOutCubic(remap(p, 0.36, 0.54));

  // THE CLICK — press-down, then spring-back with eased overshoot.
  const down = easeInOutCubic(remap(p, 0.58, 0.655));
  const rel = remap(p, 0.655, 0.86);
  const spring =
    rel <= 0 ? 1 : Math.cos(rel * Math.PI * 2.2) * Math.exp(-rel * 4.2);
  const press = down * spring; // 0→1 (down) → −0.2ish (overshoot) → 0

  // Cyan ripple ring shockwave — radius decelerates outward, amp decays
  const r = remap(p, 0.645, 0.985);
  const rippleR = 24 * (1 - (1 - r) * (1 - r));
  const rippleAmp =
    smoothstep(remap(r, 0, 0.05)) * Math.pow(1 - r, 1.35) * 0.34;

  // Footer band lights up as the ripple reaches it
  const footerGlow = easeInOutCubic(remap(p, 0.78, 0.93));
  // DOM CTA screen-fix envelope (pixel-parked over the 3D button)
  const ctaOpacity = remap(p, 0.22, 0.38);

  return {
    p,
    grow,
    pillFade,
    converge,
    hover,
    press,
    rippleR,
    rippleAmp,
    footerGlow,
    ctaOpacity,
  };
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
  click: actAt("click", 0.55), // giant button + hover swell, cursor centered (money shot)
  press: actAt("click", 0.645), // mid-press — cursor down, button depressed
  ripple: actAt("click", 0.78), // ripple ring rolling across the floor grid
  footer: actAt("click", 0.97), // footer band lit, final frame territory
} as const;
