/* Labelled form fields + list chrome shared by the CRM views. */

import { inputCls } from "./ui";

export function Field({
  label,
  children,
  className = "",
  hint,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <span className="text-[11px] font-medium uppercase tracking-wider text-haze/70">
        {label}
        {hint ? <span className="ml-1 normal-case tracking-normal text-haze/40">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

export { inputCls };

export function FilterTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { key: T; label: string; count?: number; dot?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="no-scrollbar -mx-1 flex max-w-full gap-1 overflow-x-auto px-1">
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors ${
              active ? "bg-white/[0.1] text-white" : "text-haze hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            {t.dot ? <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} /> : null}
            {t.label}
            {t.count !== undefined ? (
              <span className={`tabular-nums ${active ? "text-white/70" : "text-haze/50"}`}>{t.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  return (
    <label className="relative w-full sm:w-64">
      <span className="sr-only">{placeholder}</span>
      <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-haze/60" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onChange("");
            e.currentTarget.blur();
          }
        }}
        placeholder={placeholder}
        className="w-full rounded-full border border-white/10 bg-ink-900/70 py-1.5 pl-8 pr-3 text-sm text-white placeholder:text-haze/40 focus:border-accent/50 focus:outline-none"
      />
    </label>
  );
}

export function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-20 -mx-5 mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.05] bg-ink-950/85 px-5 py-3 backdrop-blur-md lg:-mx-8 lg:px-8">
      {children}
    </div>
  );
}

export function Chip({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${className}`}>
      {children}
    </span>
  );
}

export const TONE_CHIP = {
  red: "border-red-400/30 bg-red-400/10 text-red-300",
  amber: "border-yellow-400/30 bg-yellow-400/10 text-yellow-300",
  muted: "border-white/10 text-haze",
} as const;

export function NewPanelToggle({
  open,
  onToggle,
  label,
}: {
  open: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
        open ? "border border-white/10 text-haze hover:text-white" : "bg-accent text-ink-950 hover:bg-accent-soft"
      }`}
    >
      <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${open ? "rotate-45" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
      {open ? "Close" : label}
    </button>
  );
}
