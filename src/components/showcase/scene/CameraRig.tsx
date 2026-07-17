"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { progress } from "../scroll-store";
import { cameraTarget } from "../choreography";

/**
 * T-308 — camera keyframes. The Checkpoint-A hero pose ([0, 0.9, 7.2],
 * straight-ahead, fov 38) is LOCKED; this rig only applies the subtle
 * per-act y/z dolly from choreography.ts. No rotation changes ever — the
 * floor-world moves past the cursor, the camera never swings.
 *
 * No extra damping here: the input is the store's damped value (single
 * damping source, v6 canon) — keyframe sampling is a pure function of it.
 */
export default function CameraRig() {
  const camera = useThree((s) => s.camera);

  useFrame(() => {
    const c = cameraTarget(progress());
    camera.position.y = c.y;
    camera.position.z = c.z;
  });

  return null;
}
