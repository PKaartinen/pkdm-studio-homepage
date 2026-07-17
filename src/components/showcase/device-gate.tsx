"use client";

// ---------------------------------------------------------------------------
// T-315 — client device/motion gate (stage 2 of the two-stage gate; v6 canon).
//
// Stage 1 (server UA hint) already routed obvious phones to the pure static
// Server Component. This gate catches everything a UA string cannot:
//   - prefers-reduced-motion (also live-toggles!)
//   - small windows (max-width: 767px)
//   - hover: none / pointer: coarse — iPadOS masquerading as macOS.
//
// Only when ALL four queries are false does it mount the 3D experience — and
// it does so with the SAME StrictMode-safe pattern the experience itself uses
// for its Canvas (plain state-held import(), no next/dynamic Suspense), so
// dev renders identically to prod. Loading ShowcaseExperience lazily here is
// what keeps three.js bytes off the network on the static path: Loader.tsx
// (drei useProgress) sits in that chunk graph, so it must never be statically
// imported from gate code.
//
// Hydration safety: `mode` starts "pending" and resolves in an effect, so the
// SSR HTML and the first client render are identical (a bare full-height dark
// block — .showcase-root already paints the void gradient). Live matchMedia
// listeners re-resolve the mode, so toggling reduced-motion swaps to the
// poster (and back) without a reload.
// ---------------------------------------------------------------------------

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import ShowcaseStaticPage from "./static-page";

const GATE_QUERIES = [
  "(prefers-reduced-motion: reduce)",
  "(max-width: 767px)",
  "(hover: none)",
  "(pointer: coarse)",
] as const;

type Mode = "pending" | "3d" | "static";

export default function ShowcaseDeviceGate() {
  const [mode, setMode] = useState<Mode>("pending");
  const [Experience, setExperience] = useState<ComponentType | null>(null);

  // Resolve + live-track the four media queries (mode resolves in an effect —
  // never during render — to keep SSR and first client render identical).
  useEffect(() => {
    const mqls = GATE_QUERIES.map((q) => window.matchMedia(q));
    const resolve = () =>
      setMode(mqls.some((m) => m.matches) ? "static" : "3d");
    resolve();
    mqls.forEach((m) => m.addEventListener("change", resolve));
    return () =>
      mqls.forEach((m) => m.removeEventListener("change", resolve));
  }, []);

  // StrictMode-safe lazy mount of the existing experience shell (which holds
  // the equally StrictMode-safe Canvas import + context-loss remount).
  useEffect(() => {
    if (mode !== "3d" || Experience) return;
    let alive = true;
    import("./ShowcaseExperience").then((m) => {
      if (alive) setExperience(() => m.default);
    });
    return () => {
      alive = false;
    };
  }, [mode, Experience]);

  if (mode === "static") return <ShowcaseStaticPage />;
  if (mode === "3d" && Experience) return <Experience />;
  // "pending" (SSR + first client render) or "3d" while the chunk loads:
  // a stable full-height block over the layout's void gradient.
  return <div className="min-h-[100svh]" aria-hidden="true" />;
}
