"use client";

import { forwardRef, useMemo } from "react";
import type { Group } from "three";
import { Color } from "three";
import { MeshTransmissionMaterial } from "@react-three/drei";
import { createCursorGeometry } from "./cursor-geometry";
import { GLASS_VARIANTS } from "./variants";

// Faint cool backdrop for the transmission buffer so the body never reads as
// a black hole against the empty void (the buffer NEVER sees the DOM).
const BUFFER_BG = new Color("#0a1526");

/**
 * The glass cursor — the ONLY transmissive mesh in the scene (hard canon).
 * samples ≤ 6, resolution ≤ 512. Colorless body; every trace of cyan comes
 * from rim light + chromatic dispersion, never body color.
 */
const GlassCursor = forwardRef<Group, { variant?: number }>(
  function GlassCursor({ variant = 0 }, ref) {
    const geometry = useMemo(() => createCursorGeometry(), []);
    const v = GLASS_VARIANTS[variant % GLASS_VARIANTS.length];

    return (
      <group ref={ref}>
        <mesh geometry={geometry}>
          <MeshTransmissionMaterial
            // Perf canon (spec §4): samples ≤ 6, resolution ≤ 512.
            samples={6}
            resolution={512}
            background={BUFFER_BG}
            transmission={1}
            color="#ffffff"
            thickness={v.thickness}
            ior={v.ior}
            chromaticAberration={v.chromaticAberration}
            roughness={v.roughness}
            anisotropicBlur={v.anisotropicBlur}
            distortion={v.distortion}
            distortionScale={0.4}
            temporalDistortion={0}
            clearcoat={v.clearcoat}
            clearcoatRoughness={0.06}
            attenuationDistance={v.attenuationDistance}
            attenuationColor={v.attenuationColor}
            envMapIntensity={v.envMapIntensity * 2.5}
          />
        </mesh>
      </group>
    );
  }
);

export default GlassCursor;
