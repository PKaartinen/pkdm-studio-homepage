import Image from "next/image";
import type { ReactNode } from "react";
import type { Shot } from "@/data/projects";

// ---------------------------------------------------------------------------
// Device frames for project screenshots. Pure server components (no JS):
// a browser window with a real address bar, and a phone with a dynamic
// island. Both frame next/image content with explicit dimensions → no CLS.
// ---------------------------------------------------------------------------

function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" aria-hidden="true">
      <path
        d="M4.5 7V5.5a3.5 3.5 0 1 1 7 0V7m-8 0h9v6.5h-9z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Browser chrome bar — traffic lights + address pill. */
export function BrowserBar({
  url,
  compact = false,
}: {
  url?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 border-b border-white/[0.06] bg-ink-800/90 ${
        compact ? "h-7 px-3" : "h-9 px-4"
      }`}
    >
      <div className="flex shrink-0 gap-1.5" aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]/80" />
      </div>
      {url && (
        <div className="mx-auto flex min-w-0 max-w-[60%] items-center justify-center gap-1.5 rounded-md bg-white/[0.05] px-3 py-1 text-[11px] text-haze/80">
          <span className="text-accent-soft/80">
            <LockIcon />
          </span>
          <span className="truncate font-mono tracking-tight">{url}</span>
        </div>
      )}
      {url && <div className="w-[42px] shrink-0" aria-hidden="true" />}
    </div>
  );
}

export function BrowserFrame({
  url,
  shot,
  priority = false,
  sizes = "(max-width: 1240px) 100vw, 1200px",
  className = "",
  children,
}: {
  url?: string;
  shot?: Shot;
  priority?: boolean;
  sizes?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-white/[0.09] bg-ink-900 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.02)] md:rounded-2xl ${className}`}
    >
      <BrowserBar url={url} />
      {shot ? (
        <Image
          src={shot.src}
          alt={shot.alt}
          width={shot.width}
          height={shot.height}
          priority={priority}
          sizes={sizes}
          className="block h-auto w-full"
        />
      ) : (
        children
      )}
    </div>
  );
}

export function PhoneFrame({
  shot,
  priority = false,
  sizes = "(max-width: 768px) 60vw, 320px",
  className = "",
  children,
}: {
  shot?: Shot;
  priority?: boolean;
  sizes?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={`relative rounded-[2.1rem] border border-white/[0.14] bg-[#05070d] p-[5px] shadow-[0_30px_70px_-25px_rgba(0,0,0,0.95),inset_0_0_0_1px_rgba(255,255,255,0.04)] ${className}`}
    >
      <div className="relative aspect-[390/844] overflow-hidden rounded-[1.75rem] bg-ink-900">
        {shot ? (
          <Image
            src={shot.src}
            alt={shot.alt}
            fill
            priority={priority}
            sizes={sizes}
            className="object-cover object-top"
          />
        ) : (
          children
        )}
        {/* Dynamic island */}
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-[1.6%] h-[3.1%] w-[30%] -translate-x-1/2 rounded-full bg-black"
        />
      </div>
    </div>
  );
}
