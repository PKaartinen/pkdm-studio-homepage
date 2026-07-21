"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * First-party analytics tracker.
 *
 * Captures, per visit:
 *  - pageviews (path, referrer, UTM params, device, viewport)
 *  - max scroll depth + time on page (sent on leave/navigation)
 *  - every click (document-relative position + element) for heatmaps
 *  - custom events via window.__pkdmTrack(type, data) — e.g. lead submissions
 *
 * Events are batched and flushed with sendBeacon so navigation is never
 * blocked. All data goes to our own /api/track endpoint (first-party, so it
 * isn't blocked by ad-blockers) and is stored in our own database.
 *
 * Visits are NOT tracked when localStorage.pkdm_no_track === "1" (toggle in
 * the admin dashboard so your own browsing doesn't pollute the data).
 */

declare global {
  interface Window {
    __pkdmTrack?: (type: string, data?: Record<string, unknown>) => void;
  }
}

type TrackedEvent = {
  type: string;
  path: string;
  ts: number;
  data: Record<string, unknown>;
};

const ENDPOINT = "/api/track";
const FLUSH_INTERVAL = 8000;
const MAX_BATCH = 40;

function rid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function deviceType(): string {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1100) return "tablet";
  return "desktop";
}

function cssPath(el: Element): string {
  // Short, human-readable selector for heatmap "top elements" lists.
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node !== document.body && parts.length < 4) {
    let part = node.tagName.toLowerCase();
    if (node.id) {
      parts.unshift(`${part}#${node.id}`);
      break;
    }
    const cls = Array.from(node.classList)
      .filter((c) => c.length < 24 && !/[[\]:/]/.test(c))
      .slice(0, 2);
    if (cls.length) part += `.${cls.join(".")}`;
    parts.unshift(part);
    node = node.parentElement;
  }
  return parts.join(" > ");
}

export default function Tracker() {
  const pathname = usePathname();
  const queue = useRef<TrackedEvent[]>([]);
  const sid = useRef<string>("");
  const vid = useRef<string>("");
  const pageStart = useRef<number>(0);
  const maxScroll = useRef<number>(0);
  const currentPath = useRef<string>("");
  const disabled = useRef<boolean>(false);

  // Everything lives in one effect keyed on pathname so SPA navigations count
  // as fresh pageviews and close out the previous page's scroll/time metrics.
  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;
    try {
      if (localStorage.getItem("pkdm_no_track") === "1") {
        disabled.current = true;
        return;
      }
    } catch {
      /* storage unavailable — keep tracking */
    }
    disabled.current = false;

    // --- identity -----------------------------------------------------------
    try {
      vid.current = localStorage.getItem("pkdm_vid") || rid();
      localStorage.setItem("pkdm_vid", vid.current);
      sid.current = sessionStorage.getItem("pkdm_sid") || rid();
      sessionStorage.setItem("pkdm_sid", sid.current);
    } catch {
      vid.current = vid.current || rid();
      sid.current = sid.current || rid();
    }

    const push = (type: string, data: Record<string, unknown> = {}) => {
      if (disabled.current) return;
      queue.current.push({ type, path: currentPath.current || pathname, ts: Date.now(), data });
      if (queue.current.length >= MAX_BATCH) flush();
    };

    const flush = (useBeacon = false) => {
      if (!queue.current.length) return;
      const body = JSON.stringify({
        sid: sid.current,
        vid: vid.current,
        meta: {
          referrer: document.referrer || "",
          screen_w: window.screen?.width || window.innerWidth,
          device: deviceType(),
          landing: currentPath.current || pathname,
          search: window.location.search || "",
        },
        events: queue.current.splice(0, queue.current.length),
      });
      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
      } else {
        fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    };

    // --- close out previous page (SPA navigation) ---------------------------
    const closePage = () => {
      if (!currentPath.current || !pageStart.current) return;
      queue.current.push({
        type: "page_leave",
        path: currentPath.current,
        ts: Date.now(),
        data: {
          max_scroll_pct: Math.round(maxScroll.current),
          duration_ms: Date.now() - pageStart.current,
        },
      });
    };
    closePage();

    // --- new pageview --------------------------------------------------------
    currentPath.current = pathname;
    pageStart.current = Date.now();
    maxScroll.current = 0;
    push("pageview", {
      vw: window.innerWidth,
      vh: window.innerHeight,
      ref: document.referrer || "",
    });
    flush();

    // --- scroll depth ---------------------------------------------------------
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const pct =
        scrollable <= 0
          ? 100
          : Math.min(100, ((window.scrollY + window.innerHeight) / doc.scrollHeight) * 100);
      if (pct > maxScroll.current) maxScroll.current = pct;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // --- clicks (for heatmaps) ------------------------------------------------
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const doc = document.documentElement;
      const docH = Math.max(doc.scrollHeight, 1);
      const text =
        target instanceof HTMLElement
          ? (target.innerText || "").trim().slice(0, 60)
          : "";
      push("click", {
        x_pct: +((e.clientX / window.innerWidth) * 100).toFixed(2),
        y_px: Math.round(e.pageY),
        y_pct: +((e.pageY / docH) * 100).toFixed(2),
        doc_h: docH,
        vw: window.innerWidth,
        device: deviceType(),
        sel: target ? cssPath(target) : "",
        text,
        link:
          target?.closest("a")?.getAttribute("href") ||
          (target?.closest("button") ? "[button]" : ""),
      });
    };
    document.addEventListener("click", onClick, true);

    // --- custom events (leads etc.) --------------------------------------------
    window.__pkdmTrack = (type, data = {}) => {
      push(type, data);
      flush();
    };

    // --- flushing --------------------------------------------------------------
    const interval = window.setInterval(() => flush(), FLUSH_INTERVAL);
    const onHide = () => {
      if (document.visibilityState === "hidden") {
        closePage();
        // Reset so a return to the same page doesn't double-close.
        pageStart.current = Date.now();
        maxScroll.current = 0;
        flush(true);
      }
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
      flush();
    };
  }, [pathname]);

  return null;
}
