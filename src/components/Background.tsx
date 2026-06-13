"use client";

import { useEffect, useRef } from "react";

/**
 * Animated dark-blue background.
 *
 * Layers:
 *  1. Static CSS radial glows + grid (always rendered, zero cost).
 *  2. A lightweight canvas particle/constellation field, only on capable
 *     devices. It is:
 *       - skipped entirely on `prefers-reduced-motion` and on small screens,
 *       - paused when the tab is hidden,
 *       - capped at a sane device-pixel-ratio,
 *     so it stays cheap and never tanks performance.
 */
export default function Background() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (reduced || isMobile) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let width = 0;
    let height = 0;
    let particles: { x: number; y: number; vx: number; vy: number; r: number }[] =
      [];

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Density scales with screen area but is capped for performance.
      const count = Math.min(70, Math.floor((width * height) / 26000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: Math.random() * 1.6 + 0.6,
      }));
    }

    const LINK_DIST = 130;

    function draw() {
      ctx!.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // glow dot
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = "rgba(122, 160, 255, 0.55)";
        ctx!.fill();

        // links to nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK_DIST) {
            const alpha = (1 - dist / LINK_DIST) * 0.18;
            ctx!.strokeStyle = `rgba(77, 124, 255, ${alpha})`;
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(p.x, p.y);
            ctx!.lineTo(q.x, q.y);
            ctx!.stroke();
          }
        }
      }
    }

    let rafId = 0;
    let running = true;

    function loop() {
      if (running) draw();
      rafId = requestAnimationFrame(loop);
    }

    function onVisibility() {
      running = document.visibilityState === "visible";
    }

    resize();
    loop();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink-950"
    >
      {/* Deep base gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,#0d1a40_0%,#070b1c_45%,#04060f_100%)]" />
      {/* Accent glows */}
      <div className="absolute -left-40 top-[-10%] h-[520px] w-[520px] rounded-full bg-accent-glow/20 blur-[140px]" />
      <div className="absolute right-[-10%] top-[30%] h-[460px] w-[460px] rounded-full bg-accent/10 blur-[150px]" />
      <div className="absolute bottom-[-10%] left-1/3 h-[420px] w-[420px] rounded-full bg-[#1b2c6b]/30 blur-[150px]" />
      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(122,160,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(122,160,255,0.04)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(100%_60%_at_50%_0%,#000_30%,transparent_75%)]" />
      {/* Particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {/* Vignette / fade to base at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent to-ink-950" />
    </div>
  );
}
