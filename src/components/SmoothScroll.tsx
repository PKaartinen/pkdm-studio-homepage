"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

/**
 * Smooth scrolling via Lenis. Disabled when the user prefers reduced motion.
 * Uses a single rAF loop and cleans up on unmount to avoid leaks/jank.
 *
 * T-333 (Checkpoint B2 founder note): /showcase gets a slightly lower lerp —
 * a subtle, visible glide ("just a bit"), still far from floaty. The showcase
 * scroll-store keeps its own damping (tau 0.09) as the dominant feel; this
 * stays light enough to avoid double-smoothing artifacts, and Lenis still
 * converges to the exact same resting scroll position, so fixed scrub
 * positions (money shots, tour) land repeatably.
 */
const LERP_DEFAULT = 0.14;
const LERP_SHOWCASE = 0.085;

export default function SmoothScroll() {
  const pathname = usePathname();
  const isShowcase = pathname?.startsWith("/showcase") ?? false;

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    // Light, responsive smoothing — prioritises snappy scroll over a heavy
    // floaty feel. `lerp` keeps the view tightly coupled to the wheel.
    const lenis = new Lenis({
      lerp: isShowcase ? LERP_SHOWCASE : LERP_DEFAULT,
      wheelMultiplier: 1,
      smoothWheel: true,
      syncTouch: false,
    });

    // Expose the instance for the showcase tour mode (input lock — T-317).
    (window as unknown as { __pkdmLenis?: Lenis }).__pkdmLenis = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Smoothly handle in-page anchor links
    function onClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest(
        'a[href^="#"]'
      ) as HTMLAnchorElement | null;
      if (!target) return;
      const id = target.getAttribute("href");
      if (!id || id === "#") return;
      const el = document.querySelector(id);
      if (el) {
        e.preventDefault();
        lenis.scrollTo(el as HTMLElement, { offset: -80 });
      }
    }
    document.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("click", onClick);
      const w = window as unknown as { __pkdmLenis?: Lenis };
      if (w.__pkdmLenis === lenis) delete w.__pkdmLenis;
      lenis.destroy();
    };
  }, [isShowcase]);

  return null;
}
