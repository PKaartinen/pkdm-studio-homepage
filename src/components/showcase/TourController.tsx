"use client";

import { useEffect, useRef, useState } from "react";
import { ACTS, clamp01 } from "./scroll-store";
import { splineTrack } from "./choreography";
import { tourState } from "./tour-store";

// ---------------------------------------------------------------------------
// T-317 — tour mode (?tour=1) + fps readout (?fps=1). Recording is a
// first-class requirement (spec §4): the tour is a scripted auto-scroll —
// per-act ACT_SECONDS budget → monotone-cubic easing across act boundaries
// (continuous velocity, zero-slope ends), waits for the loader, locks input,
// hides the scroll hint. `&tourSec=NN` (clamp 20–120) stretches the take.
// Inert under reduced motion. Runs on production builds for real takes.
// ---------------------------------------------------------------------------

/** Per-act seconds — weights the panel glides + the final click (42s total). */
const ACT_SECONDS = {
  hero: 5,
  focus: 6.5,
  work: 14,
  build: 6.5,
  click: 10,
} as const;
const TOTAL_S = Object.values(ACT_SECONDS).reduce((a, b) => a + b, 0); // 42

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
    if (params.get("tour") !== "1") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // --- take duration: default 42s, &tourSec=NN clamped 20–120 -----------
    const sec = parseFloat(params.get("tourSec") ?? "");
    const total = Number.isFinite(sec)
      ? Math.min(120, Math.max(20, sec))
      : TOTAL_S;
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
