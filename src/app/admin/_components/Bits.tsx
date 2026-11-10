"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "./Toaster";
import { Spinner } from "./ActionForm";

/* Small interactive helpers shared across admin views. */

export function CopyButton({
  value,
  label = "Copy",
  toastTitle = "Copied to clipboard",
  className = "",
}: {
  value: string;
  label?: string;
  toastTitle?: string;
  className?: string;
}) {
  const toast = useToast();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      title={`Copy ${value}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
          toast({ tone: "success", title: toastTitle, description: value });
        } catch {
          toast({ tone: "error", title: "Couldn't copy. Your browser blocked clipboard access." });
        }
      }}
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-haze transition-colors hover:bg-white/[0.06] hover:text-white ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {done ? (
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        ) : (
          <>
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V6a2 2 0 0 1 2-2h9" />
          </>
        )}
      </svg>
      <span className="sr-only sm:not-sr-only">{done ? "Copied" : label}</span>
    </button>
  );
}

/** Re-fetches the current view's server data, with feedback. */
export function RefreshButton() {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [stamp, setStamp] = useState(() => Date.now());
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);
  // Toast once the refreshed data has actually arrived.
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending) {
      setStamp(Date.now());
      toast({ tone: "info", title: "Data refreshed", duration: 2000 });
    }
    wasPending.current = pending;
  }, [pending, toast]);
  const ago = Math.round((Date.now() - stamp) / 60000);
  return (
    <button
      type="button"
      onClick={() =>
        start(() => {
          router.refresh();
        })
      }
      className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-ink-900/70 px-3 py-1.5 text-xs text-haze transition-colors hover:text-white"
      title="Reload this view's data"
    >
      {pending ? (
        <Spinner className="h-3 w-3" />
      ) : (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 11a8 8 0 1 0-2.3 5.7" />
          <path d="M20 5v6h-6" />
        </svg>
      )}
      <span className="tabular-nums">{ago < 1 ? "Updated just now" : `Updated ${ago}m ago`}</span>
    </button>
  );
}

export function relTime(iso: string | Date, now = Date.now()): string {
  const t = typeof iso === "string" ? new Date(iso).getTime() : iso.getTime();
  const diff = Math.round((now - t) / 1000);
  const abs = Math.abs(diff);
  const fmt = (n: number, u: string) => `${n}${u}`;
  let s: string;
  if (abs < 45) s = "just now";
  else if (abs < 3600) s = fmt(Math.round(abs / 60), "m");
  else if (abs < 86400) s = fmt(Math.round(abs / 3600), "h");
  else if (abs < 86400 * 30) s = fmt(Math.round(abs / 86400), "d");
  else
    return new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  if (s === "just now") return s;
  return diff >= 0 ? `${s} ago` : `in ${s}`;
}

/** Relative time that stays fresh, with the exact time on hover. */
export function TimeAgo({ iso, className = "" }: { iso: string; className?: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  const exact = new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <time dateTime={iso} title={exact} className={className}>
      {now === null ? exact : relTime(iso, now)}
    </time>
  );
}

/** Current time, refreshed every `ms` (null until mounted, to avoid SSR drift). */
export function useNow(ms = 60_000): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}
