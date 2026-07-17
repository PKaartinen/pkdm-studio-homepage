"use client";

import { useEffect, useRef } from "react";
import { PANELS } from "./panels-manifest";
import { syncState } from "./sync-store";

/**
 * T-331 (§3b.3) — Act 2 clickable work panels. Each glass panel gets a DOM
 * link overlay pinned to its projected screen rect (written by WorkPanels
 * every frame), navigating to the project's existing internal
 * /projects/[slug] page — all six. Real anchors: keyboard-focusable with
 * accessible names (the canonical `name — category` tag), cursor:pointer
 * affordance, visible focus ring. Only clearly-visible panels are active
 * (pointer events + tab order gated via the `active` flag), so hidden
 * panels never trap focus or clicks.
 *
 * Overlays are invisible hit areas — no copy is rendered (zero new strings;
 * accessible names come from the T-310 manifest, verified against
 * projects.ts).
 */
export default function PanelLinksLayer() {
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const hits = syncState.panelHits;
      for (let i = 0; i < PANELS.length; i++) {
        const el = refs.current[i];
        const h = hits[i];
        if (!el) continue;
        if (!h || !h.active) {
          if (el.style.visibility !== "hidden") {
            el.style.visibility = "hidden";
            el.tabIndex = -1;
          }
          continue;
        }
        el.style.visibility = "visible";
        el.tabIndex = 0;
        el.style.transform = `translate3d(${h.x.toFixed(1)}px, ${h.y.toFixed(1)}px, 0)`;
        el.style.width = `${h.w.toFixed(1)}px`;
        el.style.height = `${h.h.toFixed(1)}px`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-20 hidden md:block">
      {PANELS.map((p, i) => (
        <a
          key={p.slug}
          ref={(el) => {
            refs.current[i] = el;
          }}
          href={`/projects/${p.slug}`}
          aria-label={p.tag}
          className="pointer-events-auto absolute left-0 top-0 block cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft"
          style={{ visibility: "hidden" }}
          tabIndex={-1}
        />
      ))}
    </div>
  );
}
