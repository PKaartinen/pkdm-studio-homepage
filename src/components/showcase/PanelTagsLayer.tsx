"use client";

import { useEffect, useRef } from "react";
import { act2 } from "./config";
import { PANELS, CLEARPEN_SLUG } from "./panels-manifest";
import { syncState } from "./sync-store";

/**
 * T-311 — Act 2 mono panel tags. Real DOM text (crisp, selectable), pinned
 * beneath each glass panel via anchors written by WorkPanels every frame.
 * The "types on" effect is scroll-derived (character count from the hover
 * envelope) → perfectly reversible; transform/opacity only.
 *
 * Tags are verbatim `name — category` from the T-310 manifest (script-diffed
 * against projects.ts). Only the ClearPen tag is an outbound link (F-4):
 * https://clearpen.ai, new tab, rel=noopener noreferrer. The other five have
 * NO outbound link (their projects.ts url fields are empty).
 */
export default function PanelTagsLayer() {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const textRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const charsShown = useRef<number[]>(PANELS.map(() => -1));

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const tags = syncState.panelTags;
      for (let i = 0; i < PANELS.length; i++) {
        const el = refs.current[i];
        const textEl = textRefs.current[i];
        const a = tags[i];
        if (!el || !textEl) continue;
        if (!a || a.opacity <= 0.005) {
          el.style.opacity = "0";
          continue;
        }
        el.style.transform = `translate3d(${a.x}px, ${a.y}px, 0)`;
        el.style.opacity = String(a.opacity);
        if (charsShown.current[i] !== a.chars) {
          charsShown.current[i] = a.chars;
          textEl.textContent = PANELS[i].tag.slice(0, a.chars);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-20 hidden md:block"
      aria-hidden="true"
    >
      {PANELS.map((p, i) => {
        const isLink = p.slug === CLEARPEN_SLUG;
        const inner = (
          <>
            <span className="mr-2 inline-block h-[5px] w-[5px] rounded-full bg-accent-soft align-middle shadow-[0_0_6px_rgba(166,244,255,0.9)]" />
            <span
              ref={(el) => {
                textRefs.current[i] = el;
              }}
              className="align-middle"
            />
            {isLink && <span className="ml-1.5 align-middle text-accent-soft">↗</span>}
          </>
        );
        return (
          <div
            key={p.slug}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className="absolute left-0 top-0 will-change-transform"
            style={{ opacity: 0 }}
          >
            <div className="-translate-x-1/2">
              {isLink ? (
                <a
                  href={act2.clearpenUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pointer-events-auto inline-block whitespace-nowrap rounded-[3px] px-2 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-haze transition-colors duration-300 hover:text-accent-soft"
                  style={{ background: "rgba(0, 2, 6, 0.55)" }}
                >
                  {inner}
                </a>
              ) : (
                <span
                  className="inline-block whitespace-nowrap rounded-[3px] px-2 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-haze"
                  style={{ background: "rgba(0, 2, 6, 0.55)" }}
                >
                  {inner}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
