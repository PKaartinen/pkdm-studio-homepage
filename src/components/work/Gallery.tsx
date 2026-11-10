"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Shot } from "@/data/projects";
import Reveal from "@/components/ui/Reveal";
import { BrowserBar } from "./Frames";

type LenisLike = { stop: () => void; start: () => void };

/**
 * Captioned screenshot gallery with a keyboard-friendly lightbox.
 * Grid: a feature tile + pairs. Click/Enter opens the lightbox; ←/→ step,
 * Esc closes, focus returns to the tile that opened it. Page scroll (native
 * and Lenis) is locked while it's open.
 */
export default function Gallery({
  shots,
  url,
}: {
  shots: Shot[];
  url?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen((cur) => {
      if (cur !== null) {
        requestAnimationFrame(() => triggerRefs.current[cur]?.focus());
      }
      return null;
    });
  }, []);
  const step = useCallback(
    (dir: 1 | -1) =>
      setOpen((cur) =>
        cur === null ? cur : (cur + dir + shots.length) % shots.length
      ),
    [shots.length]
  );

  useEffect(() => {
    if (open === null) return;
    const lenis = (window as unknown as { __pkdmLenis?: LenisLike }).__pkdmLenis;
    lenis?.stop();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      lenis?.start();
    };
  }, [open, close, step]);

  const current = open === null ? null : shots[open];

  return (
    <>
      <div className="grid gap-5 md:grid-cols-2 md:gap-6">
        {shots.map((s, i) => {
          const feature = i === 0 && shots.length % 2 === 1;
          return (
            <Reveal
              key={s.src}
              delay={(i % 2) * 0.06}
              className={feature ? "md:col-span-2" : undefined}
            >
              <figure>
                <button
                  ref={(el) => {
                    triggerRefs.current[i] = el;
                  }}
                  type="button"
                  onClick={() => setOpen(i)}
                  className="group relative block w-full overflow-hidden rounded-xl border border-white/[0.08] bg-ink-900 text-left transition-[border-color,transform] duration-500 hover:-translate-y-1 hover:border-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:rounded-2xl"
                  aria-label={`Open screenshot: ${s.caption ?? s.alt}`}
                >
                  <BrowserBar url={url} compact />
                  <div className="relative overflow-hidden">
                    <Image
                      src={s.src}
                      alt={s.alt}
                      width={s.width}
                      height={s.height}
                      loading="lazy"
                      sizes={feature ? "(max-width: 1240px) 100vw, 1200px" : "(max-width: 768px) 100vw, 600px"}
                      className="block h-auto w-full transition-transform duration-[1200ms] ease-out group-hover:scale-[1.02]"
                    />
                    <span className="pointer-events-none absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-ink-950/70 text-white opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                        <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </span>
                  </div>
                </button>
                {s.caption && (
                  <figcaption className="mt-3 flex items-center gap-2.5 text-sm text-haze">
                    <span className="font-mono text-[11px] text-accent-soft/80">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {s.caption}
                  </figcaption>
                )}
              </figure>
            </Reveal>
          );
        })}
      </div>

      <AnimatePresence>
        {current && open !== null && (
          <motion.div
            key="lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={current.caption ?? current.alt}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[90] flex flex-col bg-ink-950/95 backdrop-blur-xl"
            onClick={close}
          >
            <div className="flex items-center justify-between px-5 py-4 md:px-8">
              <p className="font-mono text-xs text-haze">
                {String(open + 1).padStart(2, "0")} / {String(shots.length).padStart(2, "0")}
                {current.caption && <span className="ml-3 text-white/90">{current.caption}</span>}
              </p>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white transition-colors hover:border-accent/60 hover:bg-accent hover:text-ink-950"
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6 md:px-20">
              <motion.div
                key={current.src}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="relative max-h-full w-full max-w-6xl overflow-hidden rounded-xl border border-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                <BrowserBar url={url} />
                <Image
                  src={current.src}
                  alt={current.alt}
                  width={current.width}
                  height={current.height}
                  sizes="100vw"
                  className="block max-h-[78vh] w-full object-contain object-top"
                />
              </motion.div>

              {shots.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      step(-1);
                    }}
                    className="absolute left-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-ink-900/80 text-white transition-colors hover:border-accent/60 md:left-6 md:flex"
                    aria-label="Previous screenshot"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5 rotate-180" fill="none" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      step(1);
                    }}
                    className="absolute right-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-ink-900/80 text-white transition-colors hover:border-accent/60 md:right-6 md:flex"
                    aria-label="Next screenshot"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </>
              )}
            </div>
            {shots.length > 1 && (
              <div className="flex justify-center gap-3 pb-6 md:hidden" onClick={(e) => e.stopPropagation()}>
                <button type="button" onClick={() => step(-1)} className="rounded-full border border-white/15 px-4 py-2 text-xs text-white">
                  Previous
                </button>
                <button type="button" onClick={() => step(1)} className="rounded-full border border-white/15 px-4 py-2 text-xs text-white">
                  Next
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
