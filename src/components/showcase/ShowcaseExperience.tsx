"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  hero,
  act1,
  act2,
  act3,
  finale,
  ctas,
  featuredCase,
} from "./config";
import MagneticButton from "@/components/ui/MagneticButton";
import { ArrowRight } from "@/components/ui/icons";
import {
  setStoryElement,
  startScrollStore,
  storyScrollMax,
  subscribe,
} from "./scroll-store";
import { clickPose, scrollHintOpacity, statsProgress } from "./choreography";
import { syncState } from "./sync-store";
import { tourState } from "./tour-store";
import TourController from "./TourController";
import Loader from "./Loader";
import AnnotationLayer from "./AnnotationLayer";
import PanelTagsLayer from "./PanelTagsLayer";
import PanelLinksLayer from "./PanelLinksLayer";

type CanvasRootType = ComponentType<{
  onContextLost: () => void;
  variant?: number;
  paused?: boolean;
}>;

/**
 * /showcase client shell — "The Click".
 *
 * Canvas mount is StrictMode-safe (v6 canon): a plain state-held import()
 * (NO next/dynamic Suspense around the Canvas) + keyed context-loss recovery
 * remount. Dev renders identically to prod.
 */
export default function ShowcaseExperience({
  children,
}: {
  /** Server-rendered homepage content that follows the 3D story. */
  children?: ReactNode;
}) {
  const [CanvasRoot, setCanvasRoot] = useState<CanvasRootType | null>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  // True once the visitor has scrolled past the end of the 3D story: every
  // fixed story layer fades out and the WebGL loop pauses (zero GPU cost
  // while reading the content below). Flips back on the way up.
  const [past, setPast] = useState(false);
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

  useEffect(() => {
    setStoryElement(storyRef.current);
    let raf = 0;
    const check = () => {
      raf = 0;
      // A little past the final frame, so the click + ripple fully land first
      setPast(window.scrollY > storyScrollMax() + window.innerHeight * 0.35);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      setStoryElement(null);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

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
      <Loader
        onDone={() => {
          tourState.loaderDone = true;
        }}
      />

      {/* T-317 — ?tour=1 scripted take + ?fps=1 readout */}
      <TourController />

      {/* Every fixed story layer lives in this wrapper so it can fade out (and
          stop catching pointer events) once the story is over. */}
      <div className="story-layers" data-past={past ? "true" : "false"}>
        {/* Fixed 3D layer behind the scrolling DOM */}
        <div className="fixed inset-0 z-0" aria-hidden="true">
          {CanvasRoot && (
            <CanvasRoot
              key={canvasKey}
              onContextLost={handleContextLost}
              variant={variant}
              paused={past}
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

        {/* T-313 — the real DOM CTA, pixel-aligned over the 3D button */}
        <FinaleCta />
      </div>

      {/* Scrolling DOM story — native scroll, selectable text */}
      <div ref={storyRef} className="relative z-10">
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
                {act1.pillar.title}: {act1.pillar.description}
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
              {/* 2026-11: ClearPen is the hero project — a compact featured
                  case-study card leads the act's CTAs. */}
              <Link
                href={featuredCase.href}
                className="group mt-8 flex max-w-[27rem] items-center gap-4 rounded-2xl border border-white/10 bg-ink-950/85 p-2.5 pr-4 backdrop-blur-md transition-colors duration-300 hover:border-accent/40"
              >
                <span className="relative h-[4.25rem] w-[6.8rem] shrink-0 overflow-hidden rounded-xl border border-white/10">
                  <Image
                    src={featuredCase.image}
                    alt=""
                    fill
                    sizes="110px"
                    className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-accent-soft">
                    {featuredCase.eyebrow}
                  </span>
                  <span className="mt-1 block text-sm font-semibold leading-snug text-white">
                    {featuredCase.title}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-haze">
                    {featuredCase.scope}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-white/70 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
                <MagneticButton href={ctas.contactHref}>
                  {ctas.contact}
                </MagneticButton>
                <Link
                  href={ctas.viewAllProjectsHref}
                  className="group inline-flex items-center gap-1.5 text-sm font-semibold text-white/85 transition-colors hover:text-white"
                >
                  {ctas.viewAllProjects}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
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

        {/* Finale — The Click (T-313). The DOM CTA is no longer parked by
            layout: it lives in the fixed FinaleCta layer below, pixel-locked
            to the 3D glass button's projected center every frame through the
            WHOLE click act (resolves B2-Q4). This section carries the
            canonical copy + the footer band in its final viewport. */}
        <section className="relative min-h-[225svh] pt-[40svh]">
          <div className="sticky top-0 h-[100svh]">
            <div className="pt-[26svh]">
              <div className="shell">
                <h2 className="display max-w-3xl font-display text-4xl font-bold text-white md:text-5xl">
                  {finale.headline}
                </h2>
                <p className="mt-6 max-w-xl text-haze">
                  {finale.pillar.title}: {finale.pillar.description}
                </p>
                <p className="mt-4 max-w-xl text-sm text-haze/70">
                  {finale.reassurance}
                </p>
              </div>
            </div>
            {/* Mobile/stacked fallback CTA (the pixel-locked target is md+) */}
            <div className="shell mt-10 md:hidden">
              <MagneticButton href={ctas.contactHref}>{finale.cta}</MagneticButton>
            </div>

            {/* T-313 band — lights up as the click ripple reaches it. Since
                the 2026-11 refresh it hands over to the content below
                instead of closing the page. */}
            <ContinueBand />
          </div>
        </section>
      </div>

      {/* The rest of the homepage — slides up over the (now static) scene */}
      {children && (
        <div className="relative z-10">
          <div
            aria-hidden="true"
            className="pointer-events-none h-[14svh] bg-gradient-to-b from-transparent to-ink-950"
          />
          <div className="bg-ink-950">{children}</div>
        </div>
      )}
    </main>
  );
}

/**
 * T-313 — the finale CTA. A fixed-position layer that parks the real
 * MagneticButton on the 3D button's projected screen center every frame
 * (written by FinaleButton into the sync store). transform/opacity only.
 */
function FinaleCta() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const el = ref.current;
      if (el) {
        const b = syncState.finale.button;
        el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;
        el.style.opacity = b.visible ? String(b.opacity) : "0";
        el.style.pointerEvents =
          b.visible && b.opacity > 0.4 ? "auto" : "none";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={ref}
      className="fixed left-0 top-0 z-20 hidden will-change-transform md:block"
      style={{ opacity: 0, pointerEvents: "none" }}
    >
      <div className="-translate-x-1/2 -translate-y-1/2">
        <MagneticButton
          href={ctas.contactHref}
          className="px-10 py-5 text-base shadow-[0_10px_44px_-8px_rgba(105,237,254,0.75)]"
        >
          {finale.cta}
        </MagneticButton>
      </div>
    </div>
  );
}

/**
 * T-313 band, refreshed 2026-11. Pinned to the bottom of the finale's final
 * viewport (page height unchanged — act math stays exact). It still "lights
 * up" as the click ripple rolls out (opacity + hairline glow from the same
 * clickPose the 3D scene reads), but now it invites the visitor on into the
 * real content below instead of acting as the page footer.
 */
function ContinueBand() {
  const bandRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      subscribe((v) => {
        const glow = clickPose(v).footerGlow;
        if (bandRef.current)
          bandRef.current.style.opacity = String(0.25 + 0.75 * glow);
        if (glowRef.current) glowRef.current.style.opacity = String(glow);
      }),
    []
  );

  const chapters = [
    { label: "Case study", href: "#work" },
    { label: "Selected work", href: "#selected-work" },
    { label: "What we build", href: "#capabilities" },
  ];

  return (
    <div
      ref={bandRef}
      className="absolute inset-x-0 bottom-0"
      style={{ opacity: 0.25 }}
    >
      {/* Hairline that flares cyan as the ripple hits */}
      <div className="h-px w-full bg-white/10" />
      <div
        ref={glowRef}
        className="pointer-events-none -mt-px h-px w-full bg-accent"
        style={{
          opacity: 0,
          boxShadow:
            "0 0 12px rgba(105,237,254,0.9), 0 0 34px rgba(105,237,254,0.45)",
        }}
      />
      <div className="shell flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
        <p className="flex items-center gap-3 text-sm text-white/90">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15">
            <svg viewBox="0 0 24 24" className="showcase-continue-arrow h-4 w-4" fill="none" aria-hidden="true">
              <path d="M12 5v14M6 13l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          Keep scrolling: the work, up close.
        </p>
        <nav aria-label="On this page">
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.18em]">
            {chapters.map((c, i) => (
              <li key={c.href}>
                <a href={c.href} className="text-haze transition-colors hover:text-white">
                  <span className="mr-1.5 text-accent-soft/80">{String(i + 1).padStart(2, "0")}</span>
                  {c.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
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
        if (ref.current)
          ref.current.style.opacity = tourState.active
            ? "0"
            : String(scrollHintOpacity(v));
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
