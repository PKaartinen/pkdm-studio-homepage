"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils, Vector3 } from "three";
import type { Group } from "three";
import { syncState } from "../sync-store";
import GlassCursor from "./GlassCursor";

const ray = new Vector3();

/**
 * Cursor rig — owns the glass cursor's hero anchor: positioned relative to
 * the measured "convert." rect so the overlap holds at every viewport width.
 * T-307 layers idle bob + pointer lean on top; Phase 2 adds choreography.
 */
export default function CursorRig({
  cursorRef,
  variant,
}: {
  cursorRef: React.RefObject<Group | null>;
  variant: number;
}) {
  const { camera, size } = useThree();
  const innerRef = useRef<Group>(null);

  useFrame(() => {
    const g = cursorRef.current;
    const rect = syncState.wordRect;
    if (!g || !rect || rect.width === 0) return;

    // Word center + offset in em of the headline font → screen px
    const px = rect.left + rect.width / 2 + rect.fontSize * 0.95;
    const py = rect.top + rect.height / 2 + rect.fontSize * 0.55;

    // Unproject onto the cursor's z = 0 plane
    const ndcX = (px / size.width) * 2 - 1;
    const ndcY = -((py / size.height) * 2 - 1);
    ray.set(ndcX, ndcY, 0.5).unproject(camera);
    ray.sub(camera.position).normalize();
    const dist = (0 - camera.position.z) / ray.z;
    const tx = camera.position.x + ray.x * dist;
    const ty = camera.position.y + ray.y * dist;

    // Damped settle (store-damped scroll drives choreography later; this is
    // only layout-follow, so a gentle lerp avoids resize pops)
    g.position.x = MathUtils.lerp(g.position.x, tx, 0.18);
    g.position.y = MathUtils.lerp(g.position.y, ty, 0.18);
  });

  return (
    <group
      ref={cursorRef}
      position={[1.18, -0.18, 0]}
      rotation={[0.06, -0.22, -0.1]}
    >
      <group ref={innerRef} scale={0.85}>
        <GlassCursor variant={variant} />
      </group>
    </group>
  );
}
