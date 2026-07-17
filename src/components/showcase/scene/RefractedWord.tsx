"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { Vector3 } from "three";
import { hero } from "../config";
import { syncState } from "../sync-store";

/** Depth of the type plane the glass floats in front of. */
export const TEXT_Z = -0.9;

const tmp = new Vector3();

/**
 * The in-canvas SDF word "convert." — pixel-mirrored to the transparent DOM
 * twin every frame so the glass cursor visibly refracts it (v6 §4b.2).
 * Font: Space Grotesk Bold flattened via fontTools removeOverlaps
 * (unflattened Google TTFs cause troika seam boxes).
 */
export default function RefractedWord() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const textRef = useRef<any>(null);
  const { camera, size } = useThree();

  useFrame(() => {
    const t = textRef.current;
    const rect = syncState.wordRect;
    if (!t || !rect || rect.width === 0) {
      if (t) t.visible = false;
      return;
    }
    t.visible = true;

    // Screen center of the DOM twin → NDC
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const ndcX = (cx / size.width) * 2 - 1;
    const ndcY = -((cy / size.height) * 2 - 1);

    // Ray from camera through the NDC point onto the z = TEXT_Z plane
    tmp.set(ndcX, ndcY, 0.5).unproject(camera);
    tmp.sub(camera.position).normalize();
    const dist = (TEXT_Z - camera.position.z) / tmp.z;
    t.position.set(
      camera.position.x + tmp.x * dist,
      camera.position.y + tmp.y * dist,
      TEXT_Z
    );

    // World units per CSS pixel at the text plane
    const persp = camera as import("three").PerspectiveCamera;
    const worldH =
      2 * Math.abs(dist) * Math.tan(((persp.fov ?? 38) * Math.PI) / 360);
    const worldPerPx = worldH / size.height;
    const fs = rect.fontSize * worldPerPx;
    if (Math.abs(t.fontSize - fs) > fs * 0.002) t.fontSize = fs;

    // Calibration nudge (screenshot-verified): troika's em-box middle sits a
    // few px low-right of the DOM line box at this size — correct in px.
    t.position.x -= 3 * worldPerPx;
    t.position.y += 5 * worldPerPx;
  });

  return (
    <Text
      ref={textRef}
      font="/showcase/fonts/SpaceGrotesk-Bold-flat.ttf"
      anchorX="center"
      anchorY="middle"
      letterSpacing={-0.02}
      color="#ffffff"
      fontSize={1}
      sdfGlyphSize={64}
      position={[0, 0, TEXT_Z]}
    >
      {hero.refractedWord}
      <meshBasicMaterial color="#ffffff" toneMapped={false} />
    </Text>
  );
}
