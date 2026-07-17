"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useProgress } from "@react-three/drei";
import { isSceneReady, onSceneReady } from "./loader-signal";

const MIN_DURATION_MS = 1200; // count-up must read on camera (spec §3.0)

/** QA/recording helper: ?slowload=1 stretches the count-up (screenshots). */
function minDuration() {
  if (typeof window === "undefined") return MIN_DURATION_MS;
  const v = new URLSearchParams(window.location.search).get("slowload");
  if (v === null) return MIN_DURATION_MS;
  const sec = parseFloat(v);
  return Number.isFinite(sec) && sec > 0 ? sec * 1000 : 4500;
}

/**
 * Loader — "the first click." (spec §3.0)
 * #000206 screen · embossed tone-on-tone PKDM icon · letterspaced mono
 * counter 0 % → 100 % · hairline cyan progress line.
 * Gates on real R3F progress (useProgress) + first rendered frame + min 1.2s.
 * Exit: counter snap → cursor presses into center → cyan ripple ring →
 * veil parts. Transform/opacity only; position:fixed → zero CLS.
 */
export default function Loader({ onDone }: { onDone?: () => void }) {
  const reduce = useReducedMotion();
  const { progress: assetPct, active } = useProgress();
  const [display, setDisplay] = useState(0);
  const [phase, setPhase] = useState<"loading" | "exit" | "gone">("loading");
  const [sceneReady, setSceneReady] = useState(isSceneReady());
  const startRef = useRef<number | null>(null);
  const doneRef = useRef(false);

  useEffect(() => onSceneReady(() => setSceneReady(true)), []);

  // Real readiness: assets done (or none tracked) AND first frame rendered.
  const realPct = sceneReady && !active ? 100 : Math.min(assetPct, 90);

  useEffect(() => {
    if (phase !== "loading") return;
    if (reduce) {
      // Reduced motion: no counter animation — wait for ready, then fade.
      if (realPct >= 100) {
        setDisplay(100);
        setPhase("exit");
      }
      return;
    }
    let raf: number;
    const tick = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const elapsed = t - startRef.current;
      const minMs = minDuration();
      // Time-gated ceiling (min 1.2s) intersected with real progress.
      const timePct = Math.min(elapsed / minMs, 1) * 100;
      const next = Math.min(timePct, Math.max(realPct, timePct * 0.9));
      setDisplay((d) => Math.max(d, Math.min(next, realPct)));
      if (elapsed >= minMs && realPct >= 100) {
        setDisplay(100);
        if (!doneRef.current) {
          doneRef.current = true;
          setPhase("exit");
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, realPct, reduce]);

  useEffect(() => {
    if (phase !== "exit") return;
    const total = reduce ? 500 : 1250;
    const id = setTimeout(() => {
      setPhase("gone");
      onDone?.();
    }, total);
    return () => clearTimeout(id);
  }, [phase, reduce, onDone]);

  const count = Math.round(display);

  return (
    <AnimatePresence>
      {phase !== "gone" && (
        <motion.div
          key="veil"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          animate={
            phase === "exit"
              ? { opacity: 0, transition: { duration: reduce ? 0.4 : 0.55, delay: reduce ? 0.1 : 0.6, ease: "easeInOut" } }
              : { opacity: 1 }
          }
          aria-hidden="true"
        >
          {/* Embossed tone-on-tone PKDM icon (ink-800 shape on ink-950) */}
          <div className="relative flex flex-col items-center">
            <div className="relative h-24 w-24 md:h-28 md:w-28">
              {/* Tile silhouette at ink-800 */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: "#070c1a",
                  WebkitMaskImage: "url(/logo/icon.png)",
                  maskImage: "url(/logo/icon.png)",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                }}
              />
              {/* K mark, desaturated + darkened — tone-on-tone emboss */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo/icon.png"
                alt=""
                className="absolute inset-0 h-full w-full object-contain"
                style={{
                  filter: "saturate(0) brightness(0.55) contrast(1.15)",
                  mixBlendMode: "lighten",
                }}
              />
            </div>

            {/* Counter */}
            <div className="mt-10 font-mono text-sm font-light tracking-[0.35em] text-haze tabular-nums">
              {count}&nbsp;%
            </div>

            {/* Hairline cyan progress line */}
            <div className="mt-4 h-px w-44 overflow-hidden bg-white/[0.06] md:w-56">
              <div
                className="h-full origin-left bg-accent"
                style={{
                  transform: `scaleX(${display / 100})`,
                  boxShadow: "0 0 8px rgba(105,237,254,0.8)",
                }}
              />
            </div>

            {/* Exit: cursor presses into center + cyan ripple ring */}
            {!reduce && phase === "exit" && (
              <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <motion.svg
                  width="44"
                  height="44"
                  viewBox="0 0 24 24"
                  className="absolute left-1/2 top-1/2 -ml-[22px] -mt-[22px]"
                  initial={{ scale: 1, opacity: 0 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    scale: [1.15, 1.15, 0.82, 0.82],
                    transition: { duration: 0.55, times: [0, 0.25, 0.7, 1], ease: "easeInOut" },
                  }}
                >
                  <path
                    d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.45 0 .67-.54.35-.85L6.35 2.85a.5.5 0 0 0-.85.36Z"
                    fill="#eef3f7"
                  />
                </motion.svg>
                <motion.div
                  className="absolute left-1/2 top-1/2 h-10 w-10 -ml-5 -mt-5 rounded-full border border-accent"
                  style={{ boxShadow: "0 0 24px rgba(105,237,254,0.5), inset 0 0 12px rgba(105,237,254,0.35)" }}
                  initial={{ scale: 0.2, opacity: 0 }}
                  animate={{
                    scale: [0.2, 14],
                    opacity: [0, 0.9, 0],
                    transition: { duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] },
                  }}
                />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
