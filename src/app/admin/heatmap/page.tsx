"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, EmptyState, PageHeader, inputCls } from "../_components/ui";

/**
 * Click heatmap.
 *
 * Two preview modes, because a page's desktop and mobile experiences can be
 * completely different documents:
 *
 * 1. Live iframe (default): the page renders in preview mode (?pkdm_preview=1
 *    → static variant, no Lenis, no tracking) at the selected device width.
 *    Click positions are stored relative to document height, so they rescale.
 *
 * 2. Captured slices (desktop homepage only): the 3D showcase can't render in
 *    a full-height iframe, and its mobile counterpart is a different page — so
 *    the desktop heatmap uses screenshots captured scroll-step by scroll-step
 *    from the real experience (`npm run heatmap:capture`), stacked into one
 *    tall image that matches what desktop visitors actually saw.
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

type Manifest = {
  width: number;
  viewport: number;
  docHeight: number;
  slices: { file: string; height: number }[];
  capturedAt: string;
};

const DEVICE_WIDTHS: Record<string, number> = {
  all: 1280,
  desktop: 1280,
  tablet: 900,
  mobile: 390,
};

// inputCls sets w-full, which wins over an appended w-auto in Tailwind's
// cascade — swap it out for the inline filter selects.
const selCls = inputCls.replace("w-full", "w-auto");

export default function HeatmapPage() {
  const [data, setData] = useState<ApiData | null>(null);
  const [manifest, setManifest] = useState<Manifest | null | "missing">(null);
  const [path, setPath] = useState("/");
  const [device, setDevice] = useState("desktop");
  const [range, setRange] = useState(30);
  const [loading, setLoading] = useState(true);
  const [docH, setDocH] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // The desktop and mobile homepages are different experiences with different
  // lengths and content — "all devices" would mix incomparable coordinates.
  const isHome = path === "/";
  const effectiveDevice = isHome && device === "all" ? "desktop" : device;
  const useSlices = isHome && effectiveDevice === "desktop";

  useEffect(() => {
    fetch("/heatmap/home-desktop/manifest.json")
      .then((r) => (r.ok ? r.json() : "missing"))
      .then(setManifest)
      .catch(() => setManifest("missing"));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(
      `/api/admin/heatmap?path=${encodeURIComponent(path)}&device=${effectiveDevice}&range=${range}`
    )
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
  }, [path, effectiveDevice, range]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;

    let width = 0;
    let height = 0;
    if (useSlices) {
      const stack = stackRef.current;
      if (!stack) return;
      width = stack.clientWidth;
      height = stack.scrollHeight;
    } else {
      const iframe = iframeRef.current;
      if (!iframe) return;
      width = iframe.clientWidth;
      try {
        height = iframe.contentDocument?.documentElement?.scrollHeight ?? 0;
      } catch {
        /* ignore */
      }
      if (!height) height = 4000;
      setDocH(height);
    }
    if (!width || !height) return;

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
  }, [data, useSlices]);

  useEffect(() => {
    // Redraw once data arrives and again after the iframe/images settle.
    draw();
    const t1 = setTimeout(draw, 1200);
    const t2 = setTimeout(draw, 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [draw, manifest]);

  const frameWidth = DEVICE_WIDTHS[effectiveDevice] ?? 1280;
  // pkdm_preview=1 forces the embedded page into preview mode: static
  // variant instead of the WebGL showcase, no Lenis, no analytics recorded.
  const previewSrc = `${path}${path.includes("?") ? "&" : "?"}pkdm_preview=1`;
  const hasManifest = manifest && manifest !== "missing";

  return (
    <>
      <PageHeader
        title="Click heatmap"
        description="Where visitors actually click, overlaid on what they saw. Hot spots that aren't links are opportunities — people expect something clickable there."
      />

      <div className="mb-2 flex flex-wrap items-center gap-3">
        <select value={path} onChange={(e) => setPath(e.target.value)} className={selCls}>
          {(data?.paths?.length ? data.paths : [{ path: "/", clicks: 0 }]).map((p) => (
            <option key={p.path} value={p.path}>
              {p.path} {p.clicks ? `(${p.clicks} clicks)` : ""}
            </option>
          ))}
        </select>
        <select
          value={effectiveDevice}
          onChange={(e) => setDevice(e.target.value)}
          className={selCls}
        >
          {!isHome ? <option value="all">All devices</option> : null}
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

      {isHome ? (
        <p className="mb-4 text-xs text-haze/80">
          The desktop homepage (3D experience) and mobile homepage (static page) are different
          experiences, so their heatmaps are shown per device.
          {useSlices && hasManifest
            ? ` Desktop preview captured ${new Date((manifest as Manifest).capturedAt).toLocaleDateString("en-GB")} — re-run \`npm run heatmap:capture\` after homepage changes.`
            : ""}
        </p>
      ) : (
        <div className="mb-4" />
      )}

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <Card className="overflow-hidden !p-0">
          <div className="max-h-[75vh] overflow-auto">
            <div
              className="relative mx-auto origin-top"
              style={{ width: frameWidth, maxWidth: "100%" }}
            >
              {useSlices ? (
                hasManifest ? (
                  <div ref={stackRef}>
                    {(manifest as Manifest).slices.map((s, i) => (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        key={s.file}
                        src={`/heatmap/home-desktop/${s.file}`}
                        alt={`Desktop homepage, scroll section ${i + 1}`}
                        onLoad={draw}
                        className="block w-full object-cover object-bottom"
                        style={{
                          // The tail slice is cropped to the remaining height
                          // (captured bottom-anchored at the final scroll stop).
                          aspectRatio: `${(manifest as Manifest).width} / ${s.height}`,
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-10 text-sm leading-relaxed text-haze">
                    <p className="font-display text-base font-semibold text-white">
                      Desktop homepage preview not captured yet
                    </p>
                    <p className="mt-2 max-w-md">
                      The desktop homepage is a 3D scroll experience that can&apos;t render in a
                      static frame. Capture it once (and after visual changes) with:
                    </p>
                    <code className="mt-3 inline-block rounded-lg bg-ink-950/80 px-3 py-2 text-accent">
                      npm run heatmap:capture
                    </code>
                    <p className="mt-3 max-w-md">
                      This screenshots the live experience at every scroll depth and stacks the
                      slices here as the heatmap base.
                    </p>
                  </div>
                )
              ) : (
                <iframe
                  ref={iframeRef}
                  src={previewSrc}
                  onLoad={draw}
                  title="Page preview"
                  className="w-full border-0 bg-ink-950"
                  style={{ height: docH || 3000, pointerEvents: "none" }}
                  scrolling="no"
                />
              )}
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
