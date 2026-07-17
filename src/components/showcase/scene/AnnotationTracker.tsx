"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import type { Group } from "three";
import { actProgress, clamp01 } from "../scroll-store";
import { syncState } from "../sync-store";

const tip = new Vector3();
const tail = new Vector3();

// Local-space anchor points on the cursor (geometry is centered, height 2.3):
// apex (top-left tip) and tail (bottom). Offsets tuned to the silhouette.
const TIP_LOCAL = new Vector3(0.78, 0.42, 0.2);
const TAIL_LOCAL = new Vector3(0.3, -1.02, 0.2);

/**
 * Projects cursor-pinned annotation anchors to screen px each frame.
 * The DOM annotation layer consumes syncState (labels = real DOM text).
 * Annotations fade out as the hero act scrolls away.
 */
export default function AnnotationTracker({
  cursorRef,
}: {
  cursorRef: React.RefObject<Group | null>;
}) {
  const { camera, size } = useThree();

  useFrame(() => {
    const g = cursorRef.current;
    const a = syncState.annotations;
    if (!g) {
      a.founderLed.visible = a.reply.visible = false;
      return;
    }
    const fade = clamp01(1 - actProgress("hero") * 1.6);

    tip.copy(TIP_LOCAL);
    g.localToWorld(tip);
    tip.project(camera);
    a.founderLed.x = ((tip.x + 1) / 2) * size.width;
    a.founderLed.y = ((1 - tip.y) / 2) * size.height;
    a.founderLed.visible = fade > 0.01;
    a.founderLed.opacity = fade;

    tail.copy(TAIL_LOCAL);
    g.localToWorld(tail);
    tail.project(camera);
    a.reply.x = ((tail.x + 1) / 2) * size.width;
    a.reply.y = ((1 - tail.y) / 2) * size.height;
    a.reply.visible = fade > 0.01;
    a.reply.opacity = fade;
  });

  return null;
}
