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
  /** Screen rect + font size of the transparent DOM "convert." twin. */
  wordRect: null as { left: number; top: number; width: number; height: number; fontSize: number } | null,
  /** 3D-tracked anchors projected to screen px (written by the Scene). */
  annotations: {
    founderLed: { x: 0, y: 0, visible: false, opacity: 0 } as AnnotationAnchor,
    reply: { x: 0, y: 0, visible: false, opacity: 0 } as AnnotationAnchor,
  },
};
