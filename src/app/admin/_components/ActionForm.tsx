"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { createPortal } from "react-dom";
import type { ActionResult } from "../_lib/result";
import { useToast } from "./Toaster";

/**
 * Forms and buttons wired to server actions, with feedback built in:
 * pending states, success / error toasts, optional confirmation, unsaved-
 * changes tracking and Cmd/Ctrl+Enter to submit.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ServerAction = (fd: FormData) => Promise<ActionResult<any>>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyResult = ActionResult<any>;

export type ConfirmSpec = {
  title: string;
  body?: React.ReactNode;
  confirmLabel?: string;
  tone?: "danger" | "default";
};

type ToastExtras = {
  description?: string;
  action?: { label: string; onClick: () => void | Promise<void> };
};

function clientError(err: unknown): string {
  const msg = err instanceof Error ? err.message : "";
  if (/fetch|network|failed to fetch/i.test(msg)) return "Couldn't reach the server. Check your connection and try again.";
  if (/session has expired/i.test(msg)) return msg;
  return "Something went wrong on the server. Please try again.";
}

export function toFormData(fields: Record<string, string | number | null | undefined>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v == null ? "" : String(v));
  return fd;
}

/** Imperative server-action call with the same toast feedback as forms. */
export function useAction() {
  const toast = useToast();
  const [pending, start] = useTransition();
  const run = useCallback(
    (
      action: ServerAction,
      fd: FormData,
      opts: { silent?: boolean; extras?: (r: AnyResult) => ToastExtras | undefined } = {}
    ) =>
      new Promise<AnyResult>((resolve) => {
        start(async () => {
          let r: AnyResult;
          try {
            r = await action(fd);
          } catch (err) {
            r = { ok: false, error: clientError(err) };
          }
          if (r.ok) {
            if (!opts.silent) toast({ tone: "success", title: r.message, ...opts.extras?.(r) });
          } else {
            toast({ tone: "error", title: r.error });
          }
          resolve(r);
        });
      }),
    [toast]
  );
  return { run, pending };
}

// ---------------------------------------------------------------------------
// Confirm dialog
// ---------------------------------------------------------------------------

export function ConfirmDialog({
  spec,
  onConfirm,
  onCancel,
}: {
  spec: ConfirmSpec;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [onCancel]);

  const danger = spec.tone !== "default";
  return createPortal(
    <div className="admin-dialog fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Cancel"
        onClick={onCancel}
        className="absolute inset-0 cursor-default bg-ink-950/70 backdrop-blur-sm"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="admin-dialog-panel relative w-full max-w-md rounded-2xl border border-white/10 bg-ink-900 p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
      >
        <div className="flex items-start gap-4">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
              danger ? "border-red-400/30 bg-red-400/10 text-red-300" : "border-accent/30 bg-accent/10 text-accent"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {danger ? (
                <>
                  <path d="M4 7h16" />
                  <path d="M9 7V4.5h6V7" />
                  <path d="m6 7 1 13h10l1-13" />
                </>
              ) : (
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v5M12 16.5h.01" />
                </>
              )}
            </svg>
          </span>
          <div className="min-w-0">
            <h2 id="confirm-title" className="font-display text-lg font-semibold text-white">
              {spec.title}
            </h2>
            {spec.body ? <div className="mt-1.5 text-sm leading-relaxed text-haze">{spec.body}</div> : null}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-haze transition-colors hover:text-white"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              danger
                ? "bg-red-500/90 text-white hover:bg-red-500"
                : "bg-accent text-ink-950 hover:bg-accent-soft"
            }`}
          >
            {spec.confirmLabel ?? (danger ? "Delete" : "Confirm")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ---------------------------------------------------------------------------
// ActionForm + SubmitButton
// ---------------------------------------------------------------------------

type FormState = { pending: boolean; dirty: boolean; saved: boolean };
const FormCtx = createContext<FormState>({ pending: false, dirty: false, saved: false });
export const useFormState = () => useContext(FormCtx);

export function ActionForm({
  action,
  children,
  className,
  confirm,
  resetOnSuccess,
  onSuccess,
  successExtras,
  silent,
  focusAfterReset,
}: {
  action: ServerAction;
  children: React.ReactNode;
  className?: string;
  confirm?: ConfirmSpec;
  resetOnSuccess?: boolean;
  onSuccess?: (r: AnyResult) => void;
  successExtras?: (r: AnyResult) => ToastExtras | undefined;
  silent?: boolean;
  /** name of the field to focus after a successful reset (fast repeat entry) */
  focusAfterReset?: string;
}) {
  const { run, pending } = useAction();
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [asking, setAsking] = useState<FormData | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (savedTimer.current) clearTimeout(savedTimer.current);
  }, []);

  const submit = useCallback(
    async (fd: FormData) => {
      const r = await run(action, fd, { silent, extras: successExtras });
      if (r.ok) {
        setDirty(false);
        setSaved(true);
        if (savedTimer.current) clearTimeout(savedTimer.current);
        savedTimer.current = setTimeout(() => setSaved(false), 1800);
        if (resetOnSuccess) {
          formRef.current?.reset();
          if (focusAfterReset) {
            formRef.current
              ?.querySelector<HTMLElement>(`[name="${focusAfterReset}"]`)
              ?.focus();
          }
        }
        onSuccess?.(r);
      } else if (r.field) {
        formRef.current?.querySelector<HTMLElement>(`[name="${r.field}"]`)?.focus();
      }
    },
    [action, run, silent, successExtras, resetOnSuccess, focusAfterReset, onSuccess]
  );

  return (
    <FormCtx.Provider value={{ pending, dirty, saved }}>
      <form
        ref={formRef}
        className={className}
        onSubmit={(e) => {
          e.preventDefault();
          if (pending) return;
          const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
          const fd = new FormData(e.currentTarget, submitter);
          if (confirm) setAsking(fd);
          else void submit(fd);
        }}
        onInput={() => setDirty(true)}
        onChange={() => setDirty(true)}
        onReset={() => setDirty(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            formRef.current?.requestSubmit();
          }
        }}
      >
        {children}
      </form>
      {asking && confirm ? (
        <ConfirmDialog
          spec={confirm}
          onCancel={() => setAsking(null)}
          onConfirm={() => {
            const fd = asking;
            setAsking(null);
            void submit(fd);
          }}
        />
      ) : null}
    </FormCtx.Provider>
  );
}

const VARIANT = {
  primary:
    "bg-accent text-ink-950 font-semibold hover:bg-accent-soft disabled:bg-white/10 disabled:text-haze",
  ghost: "border border-white/10 text-haze hover:border-white/25 hover:text-white",
  danger: "border border-white/10 text-haze hover:border-red-400/40 hover:bg-red-400/[0.06] hover:text-red-300",
  success: "border border-emerald-400/30 text-emerald-300 hover:bg-emerald-400/10",
  subtle: "text-haze hover:bg-white/[0.06] hover:text-white",
} as const;

export type Variant = keyof typeof VARIANT;

export function Spinner({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
    />
  );
}

export function SubmitButton({
  children,
  pendingLabel,
  savedLabel,
  variant = "primary",
  requireDirty,
  className = "",
  size = "md",
  title,
  name,
  value,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  savedLabel?: string;
  variant?: Variant;
  requireDirty?: boolean;
  className?: string;
  size?: "sm" | "md";
  title?: string;
  name?: string;
  value?: string;
}) {
  const { pending, dirty, saved } = useFormState();
  const disabled = pending || (requireDirty && !dirty);
  const pad = size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-sm";
  return (
    <button
      type="submit"
      name={name}
      value={value}
      title={title}
      disabled={disabled}
      aria-busy={pending}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg transition-all duration-200 disabled:cursor-not-allowed ${
        requireDirty && !dirty && !pending ? "opacity-50" : ""
      } ${VARIANT[variant]} ${pad} ${className}`}
    >
      {pending ? (
        <>
          <Spinner />
          {pendingLabel ?? children}
        </>
      ) : saved && savedLabel ? (
        <>
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
          {savedLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/** Shows "Unsaved changes" while the surrounding ActionForm is dirty. */
export function DirtyHint() {
  const { dirty, pending } = useFormState();
  if (!dirty || pending) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-yellow-300/90">
      <span className="h-1.5 w-1.5 rounded-full bg-yellow-300" />
      Unsaved changes
      <kbd className="ml-1 hidden rounded border border-white/10 px-1 font-mono text-[10px] text-haze sm:inline">
        ⌘↵
      </kbd>
    </span>
  );
}

/** One-click server action (delete, move, mark as…) with optional confirm. */
export function ActionButton({
  action,
  fields,
  children,
  pendingLabel,
  confirm,
  variant = "ghost",
  size = "md",
  className = "",
  title,
  successExtras,
  onSuccess,
}: {
  action: ServerAction;
  fields: Record<string, string | number | null | undefined>;
  children: React.ReactNode;
  pendingLabel?: string;
  confirm?: ConfirmSpec;
  variant?: Variant;
  size?: "sm" | "md";
  className?: string;
  title?: string;
  successExtras?: (r: AnyResult) => ToastExtras | undefined;
  onSuccess?: (r: AnyResult) => void;
}) {
  return (
    <ActionForm
      action={action}
      confirm={confirm}
      successExtras={successExtras}
      onSuccess={onSuccess}
      className="contents"
    >
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v == null ? "" : String(v)} />
      ))}
      <SubmitButton
        variant={variant}
        size={size}
        pendingLabel={pendingLabel}
        className={className}
        title={title}
      >
        {children}
      </SubmitButton>
    </ActionForm>
  );
}
