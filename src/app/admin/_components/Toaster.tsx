"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

/**
 * Admin toast notifications: every action reports back (saved, deleted,
 * failed and why), optionally with an inline action such as "Undo".
 */

type Tone = "success" | "error" | "info";
type ToastAction = { label: string; onClick: () => void | Promise<void> };
type Toast = {
  id: number;
  tone: Tone;
  title: string;
  description?: string;
  action?: ToastAction;
  leaving?: boolean;
};
type ToastInput = Omit<Toast, "id" | "leaving"> & { duration?: number };

const Ctx = createContext<((t: ToastInput) => void) | null>(null);

export function useToast() {
  const push = useContext(Ctx);
  return useCallback(
    (t: ToastInput) => {
      if (push) push(t);
    },
    [push]
  );
}

const ICON: Record<Tone, React.ReactNode> = {
  success: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  error: (
    <>
      <path d="M12 8v5" />
      <path d="M12 16.5h.01" />
      <circle cx="12" cy="12" r="9" />
    </>
  ),
  info: (
    <>
      <path d="M12 11v5" />
      <path d="M12 7.5h.01" />
      <circle cx="12" cy="12" r="9" />
    </>
  ),
};

const TONE: Record<Tone, string> = {
  success: "text-emerald-300 bg-emerald-400/10 border-emerald-400/25",
  error: "text-red-300 bg-red-400/10 border-red-400/25",
  info: "text-accent bg-accent/10 border-accent/25",
};

function ToastItem({ t, onClose }: { t: Toast; onClose: (id: number) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <div
      role={t.tone === "error" ? "alert" : "status"}
      className={`admin-toast pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-white/10 bg-ink-900/95 p-3.5 pr-3 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.7)] backdrop-blur-xl ${
        t.leaving ? "admin-toast-out" : ""
      }`}
    >
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${TONE[t.tone]}`}
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          {ICON[t.tone]}
        </svg>
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-sm font-medium text-white">{t.title}</p>
        {t.description ? (
          <p className="mt-0.5 break-words text-xs leading-relaxed text-haze">{t.description}</p>
        ) : null}
      </div>
      {t.action ? (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await t.action?.onClick();
            } finally {
              onClose(t.id);
            }
          }}
          className="shrink-0 rounded-md border border-white/15 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:border-accent/50 hover:text-accent disabled:opacity-50"
        >
          {busy ? "…" : t.action.label}
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => onClose(t.id)}
        aria-label="Dismiss"
        className="-mr-1 shrink-0 rounded-md p-1 text-haze/60 transition-colors hover:text-white"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const close = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((all) => all.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setToasts((all) => all.filter((t) => t.id !== id)), 220);
  }, []);

  const push = useCallback(
    ({ duration, ...t }: ToastInput) => {
      const id = ++seq.current;
      setToasts((all) => [...all.slice(-3), { ...t, id }]);
      const ms = duration ?? (t.tone === "error" ? 9000 : t.action ? 7000 : 3800);
      timers.current.set(
        id,
        setTimeout(() => close(id), ms)
      );
    },
    [close]
  );

  useEffect(() => {
    const all = timers.current;
    return () => all.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-3 bottom-3 z-[80] flex flex-col items-end gap-2 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[380px]"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} t={t} onClose={close} />
        ))}
      </div>
    </Ctx.Provider>
  );
}
