"use client";

// ---------------------------------------------------------------------------
// DOM ↔ 3D sync — module-level mutable state written/read once per frame.
// The transmission buffer NEVER sees the DOM: the overlapped word is drawn
// in-canvas (SDF) and pixel-mirrored to the DOM twin measured here.
// Annotation anchors flow the other way: 3D world → screen px for the DOM
// annotation layer (labels stay real DOM text).
// ---------------------------------------------------------------------------

export type AnnotationAnchor = {
  x: number;
  y: number;
  visible: boolean;
  opacity: number;
};

export const syncState = {
  /** Idle hover-bob phase (−1..1), written by CursorRig; Stage syncs the
   * caustic pool pulse to it so light and motion breathe together. */
  bob: 0,
  /** Cursor world position on the z=0 plane (written by CursorRig every
   * frame) — read by FocusPlane so the focus wake follows the §3b-moved
   * cursor exactly. */
  cursorWorld: { x: 0, y: 0 },
  /** Cursor projected screen position in px (QA path-trace evidence). */
  cursorScreen: { x: 0, y: 0 },
  /** Screen rect + font size of the transparent DOM "convert." twin. */
  wordRect: null as { left: number; top: number; width: number; height: number; fontSize: number } | null,
  /** 3D-tracked anchors projected to screen px (written by the Scene). */
  annotations: {
    founderLed: { x: 0, y: 0, visible: false, opacity: 0 } as AnnotationAnchor,
    reply: { x: 0, y: 0, visible: false, opacity: 0 } as AnnotationAnchor,
    /** Act 1 — pinned to the focus type plane (`UNDER 5 SECONDS`). */
    focus: { x: 0, y: 0, visible: false, opacity: 0 } as AnnotationAnchor,
    /** Act 3 — pinned to the finished skeleton (`A 24/7 SALES REP`). */
    build: { x: 0, y: 0, visible: false, opacity: 0 } as AnnotationAnchor,
  },
  /** Act 2 — per-panel mono tags (screen px + typed-on character count). */
  panelTags: [] as {
    x: number;
    y: number;
    opacity: number;
    chars: number;
  }[],
  /** Act 2 — per-panel screen-space bounding rects for the clickable link
   * overlays (§3b.3: panels open their internal /projects/[slug] pages).
   * `active` gates pointer events + tab order to visible panels only. */
  panelHits: [] as {
    x: number;
    y: number;
    w: number;
    h: number;
    active: boolean;
  }[],
  /** Finale — The Click (T-313/T-314). Written by FinaleButton each frame. */
  finale: {
    /** Projected screen center of the 3D glass button (px) — the DOM CTA
     * pixel-parks on this every frame (resolves B2-Q4). */
    button: { x: 0, y: 0, opacity: 0, visible: false },
    /** Button world position (ripple center + cursor press target). */
    buttonWorld: { x: 1.3, y: -1.2113, z: 0.3283 },
    /** T-314 — real-cursor sync: last interactive press timestamp (ms,
     * performance.now() clock; 0 = never) + engagement 0..1. */
    pressAt: 0,
    engaged: 0,
    /** Interactive press envelope (computed once per frame in FinaleButton,
     * read by CursorRig + Stage so all three stay in sync). */
    interactivePress: 0,
    /** Interactive ripple (time-based, event-driven — separate from the
     * scrubbed ripple so scrub reversibility is untouched). */
    ripple2: { r: 0, amp: 0 },
  },
};
