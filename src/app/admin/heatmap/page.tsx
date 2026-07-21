"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, EmptyState, PageHeader, inputCls } from "../_components/ui";

/**
 * Click heatmap: renders the live page in an iframe (same origin) and paints
 * recorded clicks on a canvas overlay. Click positions are stored as
 * x% of viewport width + y as a fraction of document height, so they rescale
 * to whatever size the iframe renders at.
 */

type Click = {
  x_pct?: number;
  y_px?: number;
  y_pct?: number;
  doc_h?: number;
  device?: string;
};

type ApiData = {
  paths: { path: string; clicks: number }[];
  clicks: Click[];
  elements: { target: string; text: string; clicks: number }[];
};

// inputCls sets w-full, which wins over an appended w-auto in Tailwind's
// cascade — swap it out for the inline filter selects.
const selCls = inputCls.replace("w-full", "w-auto");

const DEVICE_WIDTHS: Record<string, number> = {
  all: 1280,
  desktop: 1280,
  tablet: 900,
  mobile: 390,
};

export default function HeatmapPage() {
  const [data, setData] = useState<ApiData | null>(null);
  const [path, setPath] = useState("/");
  const [device, setDevice] = useState("all");
  const [range, setRange] = useState(30);
  const [loading, setLoading] = useState(true);
  const [docH, setDocH] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/admin/heatmap?path=${encodeURIComponent(path)}&device=${device}&range=${range}`)
      .then((r) => r.json())
      .then((d: ApiData) => {
        if (cancelled) return;
        setData(d);
        setLoading(false);
      })
      .catch(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [path, device, range]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const iframe = iframeRef.current;
    if (!canvas || !iframe || !data) return;

    // Same-origin iframe: read the real rendered document height.
    let height = 0;
    try {
      height = iframe.contentDocument?.documentElement?.scrollHeight ?? 0;
    } catch {
      /* ignore */
    }
    if (!height) height = 4000;
    setDocH(height);

    const width = iframe.clientWidth;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    for (const c of data.clicks) {
      const x = ((c.x_pct ?? 50) / 100) * width;
      // Prefer relative y (rescales across layouts); fall back to raw px.
      const y =
        c.y_pct != null
          ? (c.y_pct / 100) * height
          : c.doc_h
            ? ((c.y_px ?? 0) / c.doc_h) * height
            : (c.y_px ?? 0);
      const r = 26;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(255, 80, 60, 0.28)");
      g.addColorStop(0.5, "rgba(255, 180, 60, 0.12)");
      g.addColorStop(1, "rgba(255, 220, 60, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [data]);

  useEffect(() => {
    // Redraw once data arrives and again after the iframe settles/loads media.
    draw();
    const t1 = setTimeout(draw, 1200);
    const t2 = setTimeout(draw, 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [draw]);

  const frameWidth = DEVICE_WIDTHS[device] ?? 1280;
  // pkdm_preview=1 forces the embedded page into preview mode: static
  // homepage instead of the WebGL showcase, no Lenis, no analytics recorded.
  const previewSrc = `${path}${path.includes("?") ? "&" : "?"}pkdm_preview=1`;

  return (
    <>
      <PageHeader
        title="Click heatmap"
        description="Where visitors actually click, overlaid on the live page. Hot spots that aren't links are opportunities — people expect something clickable there."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select value={path} onChange={(e) => setPath(e.target.value)} className={selCls}>
          {(data?.paths?.length ? data.paths : [{ path: "/", clicks: 0 }]).map((p) => (
            <option key={p.path} value={p.path}>
              {p.path} {p.clicks ? `(${p.clicks} clicks)` : ""}
            </option>
          ))}
        </select>
        <select value={device} onChange={(e) => setDevice(e.target.value)} className={selCls}>
          <option value="all">All devices</option>
          <option value="desktop">Desktop</option>
          <option value="tablet">Tablet</option>
          <option value="mobile">Mobile</option>
        </select>
        <select
          value={range}
          onChange={(e) => setRange(Number(e.target.value))}
          className={selCls}
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
        <span className="text-xs text-haze">
          {loading ? "Loading…" : `${data?.clicks.length ?? 0} clicks plotted`}
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <Card className="overflow-hidden !p-0">
          <div className="max-h-[75vh] overflow-auto">
            <div
              className="relative mx-auto origin-top"
              style={{ width: frameWidth, maxWidth: "100%" }}
            >
              <iframe
                ref={iframeRef}
                src={previewSrc}
                onLoad={draw}
                title="Page preview"
                className="w-full border-0 bg-ink-950"
                style={{ height: docH || 3000, pointerEvents: "none" }}
                scrolling="no"
              />
              <canvas
                ref={canvasRef}
                className="pointer-events-none absolute left-0 top-0 h-full w-full"
              />
            </div>
          </div>
        </Card>

        <Card title="Most clicked elements">
          {!data?.elements?.length ? (
            <EmptyState>No clicks recorded for this page yet.</EmptyState>
          ) : (
            <ul className="space-y-3">
              {data.elements.map((el, i) => (
                <li key={i} className="text-sm">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-white/90">
                      {el.text || el.target || "(unknown)"}
                    </span>
                    <span className="shrink-0 tabular-nums text-accent">{el.clicks}</span>
                  </div>
                  <p className="truncate text-xs text-haze/70">{el.target}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
