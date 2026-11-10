"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type IndexRow = {
  slug: string;
  name: string;
  category: string;
  kind: string;
  year: string;
  status: string;
  accent: string;
  image: { src: string; width: number; height: number };
};

/**
 * The full project index as a table of rows. On pointer devices, hovering a
 * row floats a live preview of that project's screenshot beside the cursor
 * (transform-only, rAF-smoothed, never blocks clicks). Keyboard and touch
 * users get the same rows as plain, fully-labelled links.
 */
export default function ProjectIndex({ rows }: { rows: IndexRow[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const [enabled, setEnabled] = useState(false);
  const target = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const mq = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)"
    );
    setEnabled(mq.matches);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const tick = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.16;
      pos.current.y += (target.current.y - pos.current.y) * 0.16;
      const el = previewRef.current;
      if (el) {
        el.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);

  const onMove = (e: React.MouseEvent) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const r = wrap.getBoundingClientRect();
    target.current = { x: e.clientX - r.left + 28, y: e.clientY - r.top - 90 };
  };

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseMove={enabled ? onMove : undefined}
      onMouseLeave={() => setActive(null)}
    >
      <div className="hidden grid-cols-[3rem_1.4fr_1.2fr_1fr_4rem_6rem] gap-4 border-b border-white/[0.08] pb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-haze/50 md:grid">
        <span>#</span>
        <span>Project</span>
        <span>Category</span>
        <span>Type</span>
        <span>Year</span>
        <span className="text-right">Status</span>
      </div>
      <ul>
        {rows.map((r, i) => (
          <li key={r.slug}>
            <Link
              href={`/projects/${r.slug}`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(null)}
              className="group grid grid-cols-[2rem_1fr_auto] items-center gap-3 border-b border-white/[0.06] py-5 transition-colors duration-300 hover:border-white/20 md:grid-cols-[3rem_1.4fr_1.2fr_1fr_4rem_6rem] md:gap-4"
            >
              <span className="font-mono text-xs text-haze/50">{String(i + 1).padStart(2, "0")}</span>
              <span className="flex min-w-0 items-center gap-3">
                <span
                  className="h-2 w-2 shrink-0 rounded-full transition-transform duration-300 group-hover:scale-150"
                  style={{ background: r.accent }}
                />
                <span className="truncate text-lg font-semibold tracking-tight text-white transition-transform duration-300 group-hover:translate-x-1 md:text-xl">
                  {r.name}
                </span>
              </span>
              <span className="hidden truncate text-sm text-haze md:block">{r.category}</span>
              <span className="hidden text-sm text-haze md:block">{r.kind}</span>
              <span className="hidden font-mono text-sm text-haze md:block">{r.year}</span>
              <span className="text-right text-xs">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
                    r.status === "Live"
                      ? "bg-emerald-400/10 text-emerald-300"
                      : r.status === "In preview"
                        ? "bg-amber-300/10 text-amber-200"
                        : "bg-white/[0.04] text-haze"
                  }`}
                >
                  {r.status}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Floating preview */}
      {enabled && (
        <div
          ref={previewRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 z-20 w-[300px] will-change-transform"
        >
          {rows.map((r, i) => (
            <div
              key={r.slug}
              className={`absolute left-0 top-0 w-full overflow-hidden rounded-xl border border-white/15 bg-ink-900 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.9)] transition-all duration-300 ${
                active === i ? "scale-100 opacity-100" : "scale-90 opacity-0"
              }`}
            >
              <div className="relative aspect-[16/10]">
                <Image src={r.image.src} alt="" fill sizes="300px" className="object-cover object-top" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
