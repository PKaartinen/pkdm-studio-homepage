"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Shot } from "@/data/projects";

/**
 * A real screen recording playing inside a phone frame. Bytes are only
 * fetched once the phone is near the viewport (preload="none" + src set on
 * intersect), it plays only while visible, and reduced-motion users get the
 * still poster with a play button instead of autoplay.
 */
export default function PhoneVideo({
  src,
  poster,
  label,
}: {
  src: string;
  poster: Shot;
  label?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [armed, setArmed] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const v = videoRef.current;
        if (entry.isIntersecting) {
          setArmed(true);
          if (v && !reduced) v.play().catch(() => {});
        } else if (v) {
          v.pause();
        }
      },
      { rootMargin: "200px 0px", threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <div ref={wrapRef} className="relative mx-auto w-[260px] sm:w-[290px]">
      <div className="relative rounded-[2.4rem] border border-white/[0.14] bg-[#05070d] p-[6px] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.95),0_0_80px_-20px_rgba(105,237,254,0.25)]">
        <div className="relative aspect-[9/16] overflow-hidden rounded-[2rem] bg-white">
          <Image
            src={poster.src}
            alt={poster.alt}
            fill
            sizes="290px"
            className="object-cover"
          />
          <video
            ref={videoRef}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
              playing ? "opacity-100" : "opacity-0"
            }`}
            src={armed ? src : undefined}
            muted
            loop
            playsInline
            preload="none"
            autoPlay={!reduced}
            onPlaying={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            aria-label={poster.alt}
          />
          {reduced && !playing && (
            <button
              type="button"
              onClick={() => {
                setArmed(true);
                requestAnimationFrame(() => videoRef.current?.play());
              }}
              className="absolute inset-0 flex items-center justify-center bg-ink-950/20"
              aria-label="Play the screen recording"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink-950/80 text-white">
                <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </button>
          )}
        </div>
      </div>
      {label && (
        <p className="mt-4 flex items-center justify-center gap-2 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-haze/70">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400/60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
          </span>
          {label}
        </p>
      )}
    </div>
  );
}
