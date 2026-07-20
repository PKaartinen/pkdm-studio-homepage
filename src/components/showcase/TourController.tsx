"use client";

import { useEffect, useRef, useState } from "react";
import { ACTS, clamp01 } from "./scroll-store";
import { splineTrack, MONEY_SHOTS, workPanelHoldProgress } from "./choreography";
import { tourState } from "./tour-store";
import { ACT_SECONDS, TOTAL_S, resolveTourSeconds } from "./tour-timing";
import { runStepTour } from "./tour-steps";

// ---------------------------------------------------------------------------
// T-317 — tour mode (?tour=…) + fps readout (?fps=1). Recording is a
// first-class requirement (spec §4). Two take styles, both loader-gated,
// input-locked, inert under reduced motion, and sharing the same duration
// (tour-timing → default 42s, &tourSec=NN clamp 20–120) so a before/after
// against the old homepage lines up:
//
//   ?tour=1  — continuous glide: per-act ACT_SECONDS budget → monotone-cubic
//              easing across act boundaries (the original cinematic take).
//   ?tour=2  — section-by-section (also `steps`/`sections`): eases to each
//              choreography beat and PAUSES, the way a person reads the page.
//              The long "work" act stops on every project panel (the middle
//              ground for a long scroller). Runs on the shared tour-steps
//              engine so the old-homepage-preview ?tour=2 matches beat-for-beat.
// ---------------------------------------------------------------------------

/** ?tour values that select the section-by-section step take. */
const STEP_VALUES = new Set(["2", "steps", "sections"]);

/** Natural stopping points for the stepped take — the choreography money shots
 *  plus one stop per project panel through the long work-act scroller. Sorted
 *  / deduped / bottom-anchored by the step engine. */
function showcaseStops(): number[] {
  const work = [0, 1, 2, 3, 4, 5].map(workPanelHoldProgress);
  return [
    0,
    MONEY_SHOTS.hero,
    MONEY_SHOTS.focus,
    ...work,
    MONEY_SHOTS.build,
    MONEY_SHOTS.click,
    MONEY_SHOTS.ripple,
    MONEY_SHOTS.footer,
    1,
  ];
}

type Lenis = {
  stop: () => void;
  start: () => void;
  scrollTo: (
    target: number,
    opts?: { immediate?: boolean; force?: boolean }
  ) => void;
};

export default function TourController() {
  const [fpsOn, setFpsOn] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("fps")) setFpsOn(true);
    const tourParam = params.get("tour");
    const stepped = STEP_VALUES.has(tourParam ?? "");
    if (tourParam !== "1" && !stepped) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // --- take duration: default 42s, &tourSec=NN clamped 20–120 -----------
    const total = resolveTourSeconds(params.get("tourSec"));

    const lenisStep = (window as unknown as { __pkdmLenis?: Lenis }).__pkdmLenis;

    // --- ?tour=2 — section-by-section via the shared step engine ----------
    if (stepped) {
      let cancelledStep = false;
      let pollStep = 0;
      let cancelStep: (() => void) | null = null;
      const startStep = () => {
        if (cancelledStep) return;
        cancelStep = runStepTour({
          stops: showcaseStops(),
          totalSeconds: total,
          lenis: lenisStep,
          getMax: () =>
            document.documentElement.scrollHeight - window.innerHeight,
          onActiveChange: (a) => {
            tourState.active = a;
          },
        });
      };
      const waitLoaderStep = () => {
        if (cancelledStep) return;
        if (tourState.loaderDone) {
          window.scrollTo(0, 0);
          startStep();
        } else {
          pollStep = window.setTimeout(waitLoaderStep, 100);
        }
      };
      waitLoaderStep();
      return () => {
        cancelledStep = true;
        clearTimeout(pollStep);
        cancelStep?.();
      };
    }

    const scaleT = total / TOTAL_S;

    // --- monotone-cubic time→progress knots (zero-slope ends via flat
    //     lead-in/out knots; splineTrack zeroes tangents at plateaus) -------
    const knots = [{ at: -1, v: 0 }, { at: 0, v: 0 }];
    let t = 0;
    for (const act of ["hero", "focus", "work", "build", "click"] as const) {
      t += ACT_SECONDS[act] * scaleT;
      knots.push({ at: t, v: ACTS[act][1] });
    }
    knots.push({ at: t + 1, v: 1 });

    let raf = 0;
    let cancelled = false;
    const lenis = (window as unknown as { __pkdmLenis?: Lenis }).__pkdmLenis;

    // --- input lock (wheel/touch via Lenis stop + key/wheel blockers) -----
    const block = (e: Event) => e.preventDefault();
    const blockKeys = (e: KeyboardEvent) => {
      const keys = [
        " ",
        "ArrowDown",
        "ArrowUp",
        "PageDown",
        "PageUp",
        "Home",
        "End",
      ];
      if (keys.includes(e.key)) e.preventDefault();
    };
    const lock = () => {
      lenis?.stop();
      window.addEventListener("wheel", block, { passive: false });
      window.addEventListener("touchmove", block, { passive: false });
      window.addEventListener("keydown", blockKeys);
    };
    const unlock = () => {
      window.removeEventListener("wheel", block);
      window.removeEventListener("touchmove", block);
      window.removeEventListener("keydown", blockKeys);
      lenis?.start();
    };

    const run = () => {
      if (cancelled) return;
      tourState.active = true;
      lock();
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const t0 = performance.now();
      // real-take instrumentation (shot-list timestamps read from a take)
      (window as unknown as { __tourT0?: number }).__tourT0 = t0;
      const tick = (now: number) => {
        const ts = (now - t0) / 1000;
        const p = clamp01(splineTrack(knots, ts));
        // Drive THROUGH Lenis (immediate+force works while stopped, and a
        // stopped Lenis pins native scroll — the input lock). Fallback to
        // native scrollTo when Lenis is absent (reduced motion never gets
        // here; the tour is inert there).
        if (lenis) lenis.scrollTo(p * max, { immediate: true, force: true });
        else window.scrollTo(0, p * max);
        if (ts < t + 0.5) {
          raf = requestAnimationFrame(tick);
        } else {
          tourState.active = false;
          unlock();
        }
      };
      raf = requestAnimationFrame(tick);
    };

    // --- wait for the loader (never start mid-veil) ------------------------
    let poll = 0;
    const waitLoader = () => {
      if (cancelled) return;
      if (tourState.loaderDone) {
        window.scrollTo(0, 0);
        // small settle beat after the veil parts, then roll
        setTimeout(run, 600);
      } else {
        poll = window.setTimeout(waitLoader, 100);
      }
    };
    waitLoader();

    return () => {
      cancelled = true;
      clearTimeout(poll);
      cancelAnimationFrame(raf);
      if (tourState.active) {
        tourState.active = false;
        unlock();
      }
    };
  }, []);

  return fpsOn ? <FpsReadout /> : null;
}

/** ?fps=1 — corner readout: rolling fps + worst frame ms (last 5s). */
function FpsReadout() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let frames = 0;
    let shown = 0;
    const worstWindow: { t: number; ms: number }[] = [];
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      acc += dt;
      frames++;
      worstWindow.push({ t: now, ms: dt });
      while (worstWindow.length && worstWindow[0].t < now - 5000)
        worstWindow.shift();
      if (acc >= 500) {
        const fps = (frames / acc) * 1000;
        const worst = Math.max(...worstWindow.map((w) => w.ms));
        shown = Math.round(fps);
        if (ref.current)
          ref.current.textContent = `${shown} FPS · worst ${worst.toFixed(1)} ms`;
        acc = 0;
        frames = 0;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed bottom-3 right-3 z-50 rounded bg-ink-950/80 px-2.5 py-1.5 font-mono text-[11px] tracking-[0.08em] text-accent-soft"
      aria-hidden="true"
    >
      — FPS
    </div>
  );
}
