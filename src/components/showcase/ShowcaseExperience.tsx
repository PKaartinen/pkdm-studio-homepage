"use client";

import { useCallback, useEffect, useState } from "react";
import type { ComponentType } from "react";
import { hero, act1, act2, act3, finale } from "./config";
import { startScrollStore } from "./scroll-store";
import Loader from "./Loader";

type CanvasRootType = ComponentType<{
  onContextLost: () => void;
  variant?: number;
}>;

/**
 * /showcase client shell — "The Click".
 *
 * Canvas mount is StrictMode-safe (v6 canon): a plain state-held import()
 * (NO next/dynamic Suspense around the Canvas) + keyed context-loss recovery
 * remount. Dev renders identically to prod.
 */
export default function ShowcaseExperience() {
  const [CanvasRoot, setCanvasRoot] = useState<CanvasRootType | null>(null);
  const [canvasKey, setCanvasKey] = useState(0);
  const [variant, setVariant] = useState(0);

  useEffect(() => {
    let alive = true;
    import("./CanvasRoot").then((m) => {
      if (alive) setCanvasRoot(() => m.default);
    });
    return () => {
      alive = false;
    };
  }, []);

  // The single scroll-damping source (scroll-store.ts) for DOM + 3D.
  useEffect(() => startScrollStore(), []);

  // Material-variant switch for Checkpoint A (?variant=1..N)
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("variant");
    if (v) setVariant(Math.max(0, parseInt(v, 10) - 1) || 0);
  }, []);

  const handleContextLost = useCallback(
    () => setCanvasKey((k) => k + 1),
    []
  );

  return (
    <main id="main" className="relative">
      <Loader />

      {/* Fixed 3D layer behind the scrolling DOM */}
      <div className="fixed inset-0 z-0" aria-hidden="true">
        {CanvasRoot && (
          <CanvasRoot
            key={canvasKey}
            onContextLost={handleContextLost}
            variant={variant}
          />
        )}
      </div>

      {/* CSS vignette (postprocessing banned) */}
      <div className="showcase-vignette" aria-hidden="true" />

      {/* Scrolling DOM story — native scroll, selectable text */}
      <div className="relative z-10">
        {/* Hero */}
        <section className="relative flex min-h-[100svh] items-center">
          <div className="shell">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent-soft">
              {hero.eyebrow}
            </p>
            <h1 className="display mt-6 font-display text-[11vw] font-bold leading-[1.02] text-white md:text-[10vw]">
              {hero.h1Line1}
              <br />
              {hero.h1Line2}
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-haze">
              {hero.sub}
            </p>
          </div>
        </section>

        {/* Act 1 — Focus */}
        <section className="relative flex min-h-[170svh] items-start pt-[35svh]">
          <div className="shell">
            <h2 className="display max-w-3xl font-display text-4xl font-bold text-white md:text-5xl">
              {act1.headline}
            </h2>
            <p className="mt-6 max-w-xl text-haze">
              {act1.pillar.title} — {act1.pillar.description}
            </p>
          </div>
        </section>

        {/* Act 2 — The Work */}
        <section className="relative flex min-h-[220svh] items-start pt-[35svh]">
          <div className="shell">
            <h2 className="display max-w-3xl font-display text-4xl font-bold text-white md:text-5xl">
              {act2.headline}
            </h2>
            <p className="mt-6 max-w-xl text-haze">{act2.subline}</p>
          </div>
        </section>

        {/* Act 3 — The Build */}
        <section className="relative flex min-h-[170svh] items-start pt-[35svh]">
          <div className="shell">
            <h2 className="display max-w-3xl font-display text-4xl font-bold text-white md:text-5xl">
              {act3.pillar.title}
            </h2>
            <p className="mt-6 max-w-xl text-haze">{act3.pillar.description}</p>
          </div>
        </section>

        {/* Finale — The Click */}
        <section className="relative flex min-h-[190svh] items-start pt-[40svh]">
          <div className="shell">
            <h2 className="display max-w-3xl font-display text-4xl font-bold text-white md:text-5xl">
              {finale.headline}
            </h2>
            <p className="mt-6 max-w-xl text-haze">
              {finale.pillar.title} — {finale.pillar.description}
            </p>
            <p className="mt-4 max-w-xl text-sm text-haze/70">
              {finale.reassurance}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
