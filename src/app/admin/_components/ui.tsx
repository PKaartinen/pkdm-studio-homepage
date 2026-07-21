import Link from "next/link";

/* Shared presentational primitives for the admin dashboard. */

export function Card({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.08] bg-ink-900/70 p-5 ${className}`}
    >
      {title ? (
        <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-haze">
          {title}
        </h2>
      ) : null}
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-ink-900/70 p-5">
      <p className="text-xs uppercase tracking-wider text-haze">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-white">{value}</p>
      {sub ? <p className="mt-1 text-xs text-haze/80">{sub}</p> : null}
    </div>
  );
}

/** Horizontal bar with label — used for top pages, referrers, devices, etc. */
export function BarRow({
  label,
  value,
  max,
  suffix = "",
}: {
  label: string;
  value: number;
  max: number;
  suffix?: string;
}) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="py-1.5">
      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
        <span className="truncate text-white/90">{label}</span>
        <span className="shrink-0 tabular-nums text-haze">
          {value.toLocaleString()}
          {suffix}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent-deep to-accent"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Tiny SVG area chart for daily traffic. */
export function TrendChart({
  points,
  height = 120,
}: {
  points: { day: string; sessions: number }[];
  height?: number;
}) {
  const w = 600;
  const max = Math.max(1, ...points.map((p) => p.sessions));
  const step = points.length > 1 ? w / (points.length - 1) : w;
  const coords = points.map(
    (p, i) => [i * step, height - (p.sessions / max) * (height - 10) - 4] as const
  );
  const line = coords.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${height} L0,${height} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="trend" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#69edfe" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#69edfe" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#trend)" />
      <path d={line} fill="none" stroke="#69edfe" strokeWidth="2" />
    </svg>
  );
}

/** 7 / 30 / 90-day range switcher (preserves the current admin page). */
export function RangePicker({ current, basePath }: { current: number; basePath: string }) {
  return (
    <div className="flex gap-1 rounded-full border border-white/[0.08] bg-ink-900/70 p-1 text-xs">
      {[7, 30, 90].map((d) => (
        <Link
          key={d}
          href={`${basePath}?range=${d}`}
          className={`rounded-full px-3 py-1.5 transition-colors ${
            current === d
              ? "bg-accent text-ink-950 font-semibold"
              : "text-haze hover:text-white"
          }`}
        >
          {d}d
        </Link>
      ))}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  range,
  basePath,
}: {
  title: string;
  description?: string;
  range?: number;
  basePath?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">{title}</h1>
        {description ? <p className="mt-1 text-sm text-haze">{description}</p> : null}
      </div>
      {range && basePath ? <RangePicker current={range} basePath={basePath} /> : null}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-haze">
      {children}
    </div>
  );
}

export const inputCls =
  "w-full rounded-lg border border-white/10 bg-ink-950/60 px-3 py-2 text-sm text-white placeholder:text-haze/50 focus:border-accent/50 focus:outline-none";
export const btnCls =
  "rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-ink-950 transition-opacity hover:opacity-90 disabled:opacity-50";
export const btnGhostCls =
  "rounded-lg border border-white/10 px-3 py-2 text-sm text-haze transition-colors hover:border-red-400/40 hover:text-red-300";
