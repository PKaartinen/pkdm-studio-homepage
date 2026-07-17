"use client";

import { useEffect, useRef } from "react";
import { act1, act3, heroAnnotations } from "./config";
import { syncState } from "./sync-store";

/**
 * DOM annotation layer — mono labels with hairline leader lines pinned to
 * 3D-tracked anchors (positions written by AnnotationTracker each frame).
 * transform/opacity only; text is real DOM (selectable, crisp).
 */
export default function AnnotationLayer() {
  const founderRef = useRef<HTMLDivElement>(null);
  const replyRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<HTMLDivElement>(null);
  const buildRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const apply = (
      el: HTMLDivElement | null,
      a: { x: number; y: number; visible: boolean; opacity: number }
    ) => {
      if (!el) return;
      el.style.transform = `translate3d(${a.x}px, ${a.y}px, 0)`;
      el.style.opacity = a.visible ? String(a.opacity) : "0";
    };
    const tick = () => {
      const a = syncState.annotations;
      apply(founderRef.current, a.founderLed);
      apply(replyRef.current, a.reply);
      apply(focusRef.current, a.focus);
      apply(buildRef.current, a.build);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-20 hidden md:block" aria-hidden="true">
      {/* FOUNDER-LED — up-left from the cursor tip */}
      <div ref={founderRef} className="absolute left-0 top-0 will-change-transform" style={{ opacity: 0 }}>
        <span className="absolute -ml-[2.5px] -mt-[2.5px] block h-[5px] w-[5px] rounded-full bg-accent-soft shadow-[0_0_6px_rgba(166,244,255,0.9)]" />
        <span
          className="absolute block h-px origin-left bg-gradient-to-r from-accent-soft/70 to-accent-soft/25"
          style={{ width: 120, transform: "rotate(-32deg)" }}
        />
        <span
          className="absolute block font-mono text-[10px] font-normal leading-[1.7] tracking-[0.22em] text-haze"
          style={{ left: 108, top: -96, width: 230 }}
        >
          {heroAnnotations.founderLed}
        </span>
      </div>

      {/* REPLY — down-right from the tail */}
      <div ref={replyRef} className="absolute left-0 top-0 will-change-transform" style={{ opacity: 0 }}>
        <span className="absolute -ml-[2.5px] -mt-[2.5px] block h-[5px] w-[5px] rounded-full bg-accent-soft shadow-[0_0_6px_rgba(166,244,255,0.9)]" />
        <span
          className="absolute block h-px origin-left bg-gradient-to-r from-accent-soft/70 to-accent-soft/25"
          style={{ width: 110, transform: "rotate(28deg)" }}
        />
        {/* Subtle dark backing plate — keeps contrast over bright caustic
            patches (Checkpoint-A carry-over fix) */}
        <span
          className="absolute block whitespace-nowrap rounded-[3px] font-mono text-[10px] font-normal tracking-[0.22em] text-haze"
          style={{
            left: 100,
            top: 56,
            padding: "3px 8px 3px 7px",
            margin: "-3px -8px -3px -7px",
            background: "rgba(0, 2, 6, 0.62)",
            boxShadow: "0 0 14px 6px rgba(0, 2, 6, 0.45)",
          }}
        >
          {heroAnnotations.reply}
        </span>
      </div>

      {/* UNDER 5 SECONDS — pinned to the Act 1 focus plane (T-309) */}
      <div ref={focusRef} className="absolute left-0 top-0 will-change-transform" style={{ opacity: 0 }}>
        <span className="absolute -ml-[2.5px] -mt-[2.5px] block h-[5px] w-[5px] rounded-full bg-accent-soft shadow-[0_0_6px_rgba(166,244,255,0.9)]" />
        <span
          className="absolute block h-px origin-left bg-gradient-to-r from-accent-soft/70 to-accent-soft/25"
          style={{ width: 96, transform: "rotate(-30deg)" }}
        />
        <span
          className="absolute block whitespace-nowrap font-mono text-[10px] font-normal tracking-[0.22em] text-haze"
          style={{ left: 88, top: -60 }}
        >
          {act1.annotation}
        </span>
      </div>

      {/* A 24/7 SALES REP — pinned to the finished Act 3 skeleton (T-312) */}
      <div ref={buildRef} className="absolute left-0 top-0 will-change-transform" style={{ opacity: 0 }}>
        <span className="absolute -ml-[2.5px] -mt-[2.5px] block h-[5px] w-[5px] rounded-full bg-accent-soft shadow-[0_0_6px_rgba(166,244,255,0.9)]" />
        <span
          className="absolute block h-px origin-left bg-gradient-to-r from-accent-soft/70 to-accent-soft/25"
          style={{ width: 96, transform: "rotate(-30deg)" }}
        />
        <span
          className="absolute block whitespace-nowrap font-mono text-[10px] font-normal tracking-[0.22em] text-haze"
          style={{ left: 88, top: -60 }}
        >
          {act3.annotation}
        </span>
      </div>
    </div>
  );
}
