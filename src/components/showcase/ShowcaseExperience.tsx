"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import { hero, act1, act2, act3, finale, ctas } from "./config";
import MagneticButton from "@/components/ui/MagneticButton";
import { startScrollStore, subscribe } from "./scroll-store";
import { scrollHintOpacity, statsProgress } from "./choreography";
import { syncState } from "./sync-store";
import Loader from "./Loader";
import AnnotationLayer from "./AnnotationLayer";
import PanelTagsLayer from "./PanelTagsLayer";
import PanelLinksLayer from "./PanelLinksLayer";

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
  const [alignQA, setAlignQA] = useState(false);
  const wordRef = useRef<HTMLSpanElement>(null);

  // Pixel-mirror measurement: the transparent DOM twin's rect → sync store,
  // read by the in-canvas SDF word every frame (buffer never sees the DOM).
  useEffect(() => {
    let raf = 0;
    let fontSize = 0;
    const readFont = () => {
      if (wordRef.current)
        fontSize = parseFloat(getComputedStyle(wordRef.current).fontSize);
    };
    readFont();
    window.addEventListener("resize", readFont);
    const tick = () => {
      const el = wordRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        syncState.wordRect = {
          left: r.left,
          top: r.top,
          width: r.width,
          height: r.height,
          fontSize,
        };
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", readFont);
    };
  }, []);

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

  // Material-variant switch for Checkpoint A (?variant=1..N) + ?align=1 QA
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("variant");
    if (v) setVariant(Math.max(0, parseInt(v, 10) - 1) || 0);
    if (params.has("align")) setAlignQA(true);
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

      {/* 3D-pinned mono annotations (DOM text, transform-only tracking) */}
      <AnnotationLayer />

      {/* Act 2 — panel tags pinned beneath the glass work panels */}
      <PanelTagsLayer />

      {/* Act 2 — clickable panel overlays → internal /projects/[slug] pages */}
      <PanelLinksLayer />

      {/* Scrolling DOM story — native scroll, selectable text */}
      <div className="relative z-10">
        {/* Hero */}
        <section className="relative flex min-h-[100svh] flex-col justify-center pb-16">
          <div className="shell">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent-soft">
              {hero.eyebrow}
            </p>
            <h1 className="display mt-6 font-display text-[clamp(3rem,9vw,8.4rem)] font-bold leading-[1.04] text-white">
              {hero.h1Line1}
              <br />
              <span className="inline-block pl-[1.5em]">
                {hero.h1Line2.slice(0, hero.h1Line2.length - hero.refractedWord.length)}
                {/* Transparent DOM twin — SEO/selection; drawn in-canvas as SDF */}
                <span
                  ref={wordRef}
                  className="inline-block"
                  style={{
                    color: alignQA ? "rgba(255,60,60,0.55)" : "transparent",
                  }}
                >
                  {hero.refractedWord}
                </span>
              </span>
            </h1>
            <div className="mt-10 flex max-w-xl flex-col gap-7">
              <p className="text-lg leading-relaxed text-haze">{hero.sub}</p>
              <div className="flex flex-col items-start gap-3">
                <a
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-ink-950 shadow-[0_8px_30px_-8px_rgba(105,237,254,0.65)] transition-colors duration-300 hover:bg-accent-soft"
                >
                  {hero.cta}
                </a>
                <p className="text-sm text-haze/70">{hero.reassurance}</p>
              </div>
            </div>
          </div>

          {/* Scroll hint (fades out as the story starts moving — T-308) */}
          <ScrollHint />
        </section>

        {/* Act 1 — Focus
            T-308/T-331: section heights are act-range-proportional (total
            scrollable = 945svh, ACT_SCRUB_SVH in scroll-store.ts) so DOM
            boundaries land exactly on act boundaries:
            hero 100 / focus 150 / work 390 (§3b.3 long scrub) / build 180 /
            finale 225.
            Copy blocks enter at their act start (pt-[90svh]), pin via sticky
            through the act's money hold, and release near the act's end —
            position:sticky is layout only; all animation stays transform/
            opacity in the store-driven layers. */}
        <section className="relative min-h-[150svh] pt-[90svh]">
          <div className="sticky top-[26svh]">
            <div className="shell">
              <h2 className="display max-w-3xl font-display text-4xl font-bold text-white md:text-5xl">
                {act1.headline}
              </h2>
              <p className="mt-6 max-w-xl text-haze">
                {act1.pillar.title} — {act1.pillar.description}
              </p>
            </div>
          </div>
        </section>

        {/* Act 2 — The Work (§3b.3: section grown for the long per-panel scrub) */}
        <section className="relative min-h-[390svh] pt-[90svh]">
          <div className="sticky top-[26svh]">
            <div className="shell">
              <h2 className="display max-w-3xl font-display text-4xl font-bold text-white md:text-5xl">
                {act2.headline}
              </h2>
              <p className="mt-6 max-w-xl text-haze">{act2.subline}</p>
              {/* §3b.4 — CTAs under the Act 2 text (canonical strings only).
                  Stacked column: stays inside the left copy lane, clear of
                  the panel queue (9:16-crop and panel-crowding checked). */}
              <div className="mt-8 flex flex-col items-start gap-4">
                <MagneticButton href={ctas.viewAllProjectsHref} variant="ghost">
                  {ctas.viewAllProjects}
                </MagneticButton>
                <MagneticButton href={ctas.contactHref}>
                  {ctas.contact}
                </MagneticButton>
              </div>
            </div>
          </div>
        </section>

        {/* Act 3 — The Build */}
        <section className="relative min-h-[180svh] pt-[90svh]">
          <div className="sticky top-[26svh]">
            <div className="shell">
              <h2 className="display max-w-3xl font-display text-4xl font-bold text-white md:text-5xl">
                {act3.pillar.title}
              </h2>
              <p className="mt-6 max-w-xl text-haze">{act3.pillar.description}</p>
              <BuildStats />
            </div>
          </div>
        </section>

        {/* Finale — The Click (Phase 3 builds the click; this DOM section is
            the canonical-copy stub + the stable seam through 0.78–1.00).
            §3b.7: the prominent finale CTA lands NOW, centered over the 3D
            CTA pill (~65vw/76svh at the click seam) so it becomes the 3D
            click target in Phase 3's T-313. */}
        <section className="relative min-h-[225svh] pt-[40svh]">
          {/* pt-40svh → the full-viewport sticky engages at v≈0.91, so the
              CTA is already parked on the pill through the click money shot
              and stays pixel-stable to the very end (T-313 hand-off). */}
          <div className="sticky top-0 h-[100svh]">
            <div className="pt-[26svh]">
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
            </div>
            {/* The finale CTA — pixel-parked on the 3D pill's screen position
                (T-313 hand-off). Real link, canonical copy, MagneticButton. */}
            <div className="absolute left-[65vw] top-[76svh] hidden -translate-x-1/2 -translate-y-1/2 md:block">
              <MagneticButton
                href={ctas.contactHref}
                className="px-10 py-5 text-base shadow-[0_10px_44px_-8px_rgba(105,237,254,0.75)]"
              >
                {finale.cta}
              </MagneticButton>
            </div>
            {/* Mobile/stacked fallback CTA (the absolute pill target is md+) */}
            <div className="shell mt-10 md:hidden">
              <MagneticButton href={ctas.contactHref}>{finale.cta}</MagneticButton>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/**
 * T-312 — the three canonical stats scrub-tick with scroll (value derived
 * from the damped store → pausing holds it; reversible). Tabular numerals,
 * fixed-width value slots — zero width jitter. Only the numeric prefix
 * animates; the canonical strings render exactly at rest.
 */
function BuildStats() {
  const valueRefs = useRef<(HTMLSpanElement | null)[]>([]);
  // Canonical stat strings split into numeric target + suffix ("97" + "%")
  const parsed = act3.stats.map((s) => {
    const m = /^(\d+)(.*)$/.exec(s.value);
    return { target: m ? parseInt(m[1], 10) : 0, suffix: m ? m[2] : "" };
  });

  useEffect(
    () =>
      subscribe((v) => {
        const e = statsProgress(v);
        for (let i = 0; i < parsed.length; i++) {
          const el = valueRefs.current[i];
          if (!el) continue;
          const text = `${Math.round(parsed[i].target * e)}${parsed[i].suffix}`;
          if (el.textContent !== text) el.textContent = text;
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="mt-12 flex gap-12 md:gap-16">
      {act3.stats.map((s, i) => (
        <div key={s.label}>
          <div
            className="font-display text-4xl font-bold text-white md:text-5xl"
            style={{
              fontVariantNumeric: "tabular-nums",
              minWidth: `${s.value.length + 0.5}ch`,
            }}
          >
            <span
              ref={(el) => {
                valueRefs.current[i] = el;
              }}
            >
              {s.value}
            </span>
          </div>
          <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-haze">
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Hero scroll hint — opacity driven by the shared damped store (T-308). */
function ScrollHint() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      subscribe((v) => {
        if (ref.current) ref.current.style.opacity = String(scrollHintOpacity(v));
      }),
    []
  );

  return (
    <div
      ref={ref}
      className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 md:block"
    >
      <div className="flex h-9 w-5 items-start justify-center rounded-full border border-white/20 p-1">
        <span className="showcase-scroll-dot h-1.5 w-1.5 rounded-full bg-accent-soft" />
      </div>
    </div>
  );
}
