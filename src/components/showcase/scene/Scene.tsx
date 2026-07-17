"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { progress, actProgress } from "../scroll-store";

/**
 * Scene root. T-302: placeholder mesh proving the scroll→3D binding.
 * The glass cursor, stage and hero type replace/extend this in T-304+.
 */
export default function Scene({ variant = 0 }: { variant?: number }) {
  return (
    <>
      <color attach="background" args={["#000206"]} />
      <ambientLight intensity={0.15} />
      <directionalLight position={[2, 4, 3]} intensity={1.2} color="#eef3f7" />
      <Placeholder />
      {/* variant threaded through for T-304 material variants */}
      {variant >= 0 ? null : null}
    </>
  );
}

function Placeholder() {
  const group = useRef<Group>(null);
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const p = progress();
    // Glide with scroll — damped in the store, so this is pop-free/reversible.
    g.position.y = 0.4 - actProgress("hero", p) * 1.2 - p * 0.6;
    g.position.x = 1.6 - p * 3.2;
    g.rotation.z = -p * 0.26; // ≤15° — glide rule placeholder
  });
  return (
    <group ref={group} position={[1.6, 0.4, 0]}>
      <mesh>
        <icosahedronGeometry args={[0.9, 2]} />
        <meshStandardMaterial
          color="#0c1430"
          roughness={0.25}
          metalness={0.1}
          emissive="#1f9fd6"
          emissiveIntensity={0.25}
        />
      </mesh>
    </group>
  );
}
