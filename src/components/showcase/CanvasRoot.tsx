"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import Scene from "./scene/Scene";

/**
 * The R3F canvas root — loaded via a plain state-held import() from the
 * experience shell (StrictMode-safe: NO next/dynamic Suspense around the
 * Canvas — v6 device-gate lesson; dev must render identically to prod).
 *
 * Context-loss recovery: the shell remounts us via `key` when we report loss.
 */
export default function CanvasRoot({
  onContextLost,
  variant = 0,
}: {
  onContextLost: () => void;
  variant?: number;
}) {
  const [glEl, setGlEl] = useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!glEl) return;
    const handler = (e: Event) => {
      e.preventDefault();
      onContextLost();
    };
    glEl.addEventListener("webglcontextlost", handler);
    return () => glEl.removeEventListener("webglcontextlost", handler);
  }, [glEl, onContextLost]);

  return (
    <Canvas
      // Perf canon: DPR clamp 1–1.5 (spec §4).
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
      camera={{ position: [0, 0.9, 7.2], fov: 38, near: 0.1, far: 60 }}
      style={{ position: "absolute", inset: 0 }}
      onCreated={({ gl }) => {
        setGlEl(gl.domElement);
        if (process.env.NODE_ENV !== "production") {
          // QA hook — verify gl.isContextLost() === false in dev (T-302 AC).
          (window as unknown as { __showcaseGL?: unknown }).__showcaseGL =
            gl.getContext();
        }
      }}
    >
      <Scene variant={variant} />
      <FrameloopGuard />
    </Canvas>
  );
}

/** Expose renderer info for perf/leak checks — dev always; production only
 *  behind ?qa=1 (T-316 memory QA runs against production builds, v6 canon). */
function FrameloopGuard() {
  const gl = useThree((s) => s.gl);
  const ref = useRef(gl);
  ref.current = gl;
  useEffect(() => {
    const qa =
      process.env.NODE_ENV !== "production" ||
      new URLSearchParams(window.location.search).has("qa");
    if (!qa) return;
    (window as unknown as { __showcaseInfo?: unknown }).__showcaseInfo =
      ref.current.info;
  }, []);
  return null;
}
