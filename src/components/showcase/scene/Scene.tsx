"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { Environment, Lightformer } from "@react-three/drei";
import { markSceneReady } from "../loader-signal";
import GlassCursor from "./GlassCursor";
import Stage from "./Stage";

/**
 * Scene root — "The Click".
 * T-304: glass cursor center-right + studio env (procedural Lightformers —
 * zero network bytes, well under the ≤1 MB env budget, inside loader gate).
 * T-305 adds the floor grid + caustic pool; T-307 adds idle motion.
 */
export default function Scene({ variant = 0 }: { variant?: number }) {
  // First rendered frame = shaders compiled → release the loader gate.
  useFrame(() => markSceneReady());

  const cursorGroup = useRef<Group>(null);

  return (
    <>
      {/* No solid background: the CSS void gradient (#000206→#03060e) shows
          through the alpha canvas — vertical gradient per spec §2b. */}

      {/* Studio lighting — cool key above, deep-blue left rim, cyan right rim */}
      <ambientLight intensity={0.12} color="#0c1430" />
      <directionalLight position={[1.5, 6, 4]} intensity={1.6} color="#eef3f7" />
      <pointLight position={[-5, 1.5, 2.5]} intensity={60} color="#0167b4" />
      <pointLight position={[5.5, 2.5, 3]} intensity={90} color="#69edfe" />

      {/* Procedural studio env — drives glass reflections/refraction */}
      <Environment resolution={256} frames={1}>
        <color attach="background" args={["#01040a"]} />
        {/* Overhead key strip — white-hot core */}
        <Lightformer
          form="rect"
          intensity={6}
          color="#ffffff"
          position={[0, 4.5, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[6, 1.6, 1]}
        />
        {/* Deep-blue left fill */}
        <Lightformer
          form="rect"
          intensity={3.2}
          color="#0167b4"
          position={[-5, 1, 1]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[5, 2.4, 1]}
        />
        {/* Electric-cyan right rim */}
        <Lightformer
          form="rect"
          intensity={4.2}
          color="#69edfe"
          position={[5, 1.6, 1]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[4.5, 2, 1]}
        />
        {/* Soft cyan-white bounce below-front for edge definition */}
        <Lightformer
          form="rect"
          intensity={1.4}
          color="#a6f4ff"
          position={[0, -3.5, 4]}
          rotation={[Math.PI / 3, 0, 0]}
          scale={[7, 1.2, 1]}
        />
      </Environment>

      <Stage cursorRef={cursorGroup} />

      <group ref={cursorGroup} position={[1.85, 0.3, 0]} rotation={[0.06, -0.28, -0.12]}>
        <GlassCursor variant={variant} />
      </group>
    </>
  );
}
