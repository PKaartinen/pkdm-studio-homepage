"use client";

import { useRef } from "react";
import type { ReactNode } from "react";

/**
 * Card shell with a soft glow that follows the pointer (CSS vars only — no
 * re-renders). Children are server-rendered.
 */
export default function SpotlightCard({
  children,
  className = "",
  color = "rgba(105,237,254,0.09)",
}: {
  children: ReactNode;
  className?: string;
  color?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <div ref={ref} onMouseMove={onMove} className={`group relative overflow-hidden ${className}`}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(300px circle at var(--mx) var(--my), ${color}, transparent 70%)`,
        }}
      />
      {children}
    </div>
  );
}
