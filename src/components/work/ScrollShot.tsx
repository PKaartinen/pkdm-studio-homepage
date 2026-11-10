import Image from "next/image";
import type { Shot } from "@/data/projects";
import { BrowserBar } from "./Frames";

/**
 * A full-page screenshot inside a browser window that scrolls itself top to
 * bottom on hover/focus — the whole site in one gesture. Pure CSS:
 *   - the image is translated by exactly (imageHeight − frameHeight), computed
 *     from the shot's aspect ratio, so it stops precisely at the footer;
 *   - duration scales with page length (long pages scroll at the same speed);
 *   - touch devices and reduced-motion users get a native scrollable window
 *     instead (see .scroll-shot rules in globals.css).
 */
export default function ScrollShot({
  shot,
  url,
  frameRatio = 16 / 10,
}: {
  shot: Shot;
  url?: string;
  frameRatio?: number;
}) {
  // Displayed image height relative to frame height, both as multiples of width
  const imgH = shot.height / shot.width;
  const frameH = 1 / frameRatio;
  const shiftPct = Math.max(0, (1 - frameH / imgH) * 100);
  // ~1,000 px of page per second of glide, clamped to a pleasant range
  const seconds = Math.min(16, Math.max(5, shot.height / 900));

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.09] bg-ink-900 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] md:rounded-2xl">
      <BrowserBar url={url} />
      <div
        className="scroll-shot group relative"
        style={{ aspectRatio: String(frameRatio) }}
        tabIndex={0}
        aria-label={`${shot.alt}. Hover or focus to scroll through the page.`}
      >
        <div
          className="scroll-shot-img absolute inset-x-0 top-0 will-change-transform"
          style={
            {
              "--shift": `-${shiftPct.toFixed(3)}%`,
              transitionDuration: `${seconds}s`,
            } as React.CSSProperties
          }
        >
          <Image
            src={shot.src}
            alt={shot.alt}
            width={shot.width}
            height={shot.height}
            loading="lazy"
            sizes="(max-width: 1240px) 100vw, 1100px"
            className="block h-auto w-full"
          />
        </div>

        {/* Hint chip — fades out once the glide starts */}
        <div className="scroll-shot-hint pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-ink-950/80 px-3.5 py-1.5 text-[11px] font-medium text-white/85 backdrop-blur-md transition-opacity duration-300">
          <span className="relative flex h-4 w-2.5 justify-center rounded-full border border-white/40">
            <span className="mt-0.5 h-1 w-0.5 animate-[scroll-dot_1.6s_ease-in-out_infinite] rounded-full bg-accent-soft" />
          </span>
          <span>Hover to scroll the full page</span>
        </div>
      </div>
    </div>
  );
}
