"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { Environment, Lightformer } from "@react-three/drei";
import { markSceneReady } from "../loader-signal";
import Stage from "./Stage";
import FocusPlane from "./FocusPlane";
import WorkPanels from "./WorkPanels";
import RefractedWord from "./RefractedWord";
import AnnotationTracker from "./AnnotationTracker";
import CursorRig from "./CursorRig";
import CameraRig from "./CameraRig";

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
        {/* Overhead key strip — thin, white-hot core */}
        <Lightformer
          form="rect"
          intensity={9}
          color="#ffffff"
          position={[0, 4.5, 1]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[5.5, 0.8, 1]}
        />
        {/* Deep-blue left fill */}
        <Lightformer
          form="rect"
          intensity={4.5}
          color="#0167b4"
          position={[-5, 1, 1]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[5, 2.2, 1]}
        />
        {/* Electric-cyan right rim — thin hot strip */}
        <Lightformer
          form="rect"
          intensity={8}
          color="#69edfe"
          position={[5, 1.8, 1.5]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[3.5, 0.9, 1]}
        />
        {/* Cyan-soft diagonal accent for fresnel sparkle */}
        <Lightformer
          form="rect"
          intensity={5}
          color="#a6f4ff"
          position={[3, 4, -2]}
          rotation={[-Math.PI / 3, -Math.PI / 6, 0]}
          scale={[1.2, 3.5, 1]}
        />
        {/* Soft cyan-white bounce below-front for edge definition */}
        <Lightformer
          form="rect"
          intensity={2}
          color="#a6f4ff"
          position={[0, -3.5, 4]}
          rotation={[Math.PI / 3, 0, 0]}
          scale={[7, 1, 1]}
        />
      </Environment>

      <CameraRig />

      <Stage cursorRef={cursorGroup} />

      {/* In-canvas SDF "convert." — pixel-mirrored to the DOM twin */}
      <RefractedWord />

      {/* Act 1 — the blurred type plane that resolves to "why you?" */}
      <FocusPlane />

      {/* Act 2 — six glass work panels in a right-to-left arc queue */}
      <WorkPanels />

      <CursorRig cursorRef={cursorGroup} variant={variant} />

      <AnnotationTracker cursorRef={cursorGroup} />
    </>
  );
}
