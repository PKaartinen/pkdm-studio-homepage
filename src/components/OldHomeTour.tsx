"use client";

import { useEffect } from "react";
import { resolveTourSeconds } from "@/components/showcase/tour-timing";

// ---------------------------------------------------------------------------
// ?tour=1 for the retired homepage (/old-homepage-preview) — the before/after
// counterpart to the 3D homepage tour (showcase/TourController.tsx). It runs
// for the exact same wall-clock duration (shared ./showcase/tour-timing, so
// the default and the &tourSec=NN override match), auto-scrolling top→bottom
// with an ease-in/out so a split-screen recording lines up start-to-finish.
//
// Because the two pages have different total heights, "same duration" means
// they finish together (founder call) — the pixel velocity differs, but the
// scripted take begins and ends in lockstep. Inert under reduced motion,
// mirroring the showcase tour. Input is locked for the length of the take.
// ---------------------------------------------------------------------------

type Lenis = {
  stop: () => void;
  start: () => void;
  scrollTo: (
    target: number,
    opts?: { immediate?: boolean; force?: boolean }
  ) => void;
};

/** Smootherstep (zero velocity + acceleration at both ends) → clean 0→1. */
const easeInOut = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * t * (t * (t * 6 - 15) + 10);
};

export default function OldHomeTour() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tour") !== "1") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Identical take length to the showcase tour (default 42s, &tourSec=NN
    // clamped 20–120) so the before/after clips finish together.
    const total = resolveTourSeconds(params.get("tourSec"));

    let raf = 0;
    let poll = 0;
    let cancelled = false;
    let locked = false;
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
      if (locked) return;
      locked = true;
      lenis?.stop();
      window.addEventListener("wheel", block, { passive: false });
      window.addEventListener("touchmove", block, { passive: false });
      window.addEventListener("keydown", blockKeys);
    };
    const unlock = () => {
      if (!locked) return;
      locked = false;
      window.removeEventListener("wheel", block);
      window.removeEventListener("touchmove", block);
      window.removeEventListener("keydown", blockKeys);
      lenis?.start();
    };

    const run = () => {
      if (cancelled) return;
      lock();
      const t0 = performance.now();
      // Shared instrumentation flag with the showcase tour (shot-list timing).
      (window as unknown as { __tourT0?: number }).__tourT0 = t0;
      const tick = (now: number) => {
        if (cancelled) return;
        const ts = (now - t0) / 1000;
        // Recompute max each frame — lazy media/fonts can shift page height.
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = easeInOut(ts / total);
        if (lenis) lenis.scrollTo(p * max, { immediate: true, force: true });
        else window.scrollTo(0, p * max);
        if (ts < total) {
          raf = requestAnimationFrame(tick);
        } else {
          unlock();
        }
      };
      raf = requestAnimationFrame(tick);
    };

    // --- wait for a settled layout (fonts/images) before rolling ----------
    const start = () => {
      if (cancelled) return;
      window.scrollTo(0, 0);
      // Settle beat mirrors the showcase tour's post-loader pause.
      poll = window.setTimeout(run, 600);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });

    return () => {
      cancelled = true;
      clearTimeout(poll);
      cancelAnimationFrame(raf);
      window.removeEventListener("load", start);
      unlock();
    };
  }, []);

  return null;
}
