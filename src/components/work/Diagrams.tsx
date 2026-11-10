import type { FlowColumn } from "@/data/projects";
import Reveal from "@/components/ui/Reveal";

// ---------------------------------------------------------------------------
// Case-study diagrams — pure CSS animation (transform/opacity only), no JS.
// Under reduced motion the global rule freezes the pulses; the diagrams stay
// fully readable as static figures.
// ---------------------------------------------------------------------------

/**
 * Horizontal pipeline (vertical on phones): numbered stages on a rail with a
 * light pulse travelling through them; each node "pings" as the pulse
 * passes (staggered animation-delay derived from the stage index).
 */
export function Pipeline({
  steps,
  accent = "#69edfe",
}: {
  steps: { label: string; title: string; body: string }[];
  accent?: string;
}) {
  const period = 5.2; // seconds for one pass of the pulse
  return (
    <div
      className="pipeline relative rounded-3xl border border-white/[0.07] bg-gradient-to-b from-white/[0.03] to-transparent p-6 md:p-10"
      style={{ "--pl-accent": accent, "--pl-period": `${period}s` } as React.CSSProperties}
    >
      {/* Rail */}
      <div
        aria-hidden="true"
        className="pipeline-rail absolute bottom-10 left-[2.6rem] top-10 w-px overflow-hidden bg-white/10 md:bottom-auto md:left-[3.875rem] md:right-10 md:top-[3.85rem] md:h-px md:w-auto"
      >
        <span className="pipeline-pulse" />
      </div>

      <ol className="relative grid gap-7 md:grid-cols-6 md:gap-5">
        {steps.map((s, i) => (
          <li key={s.label} className="relative pl-12 md:pl-0">
            <Reveal delay={i * 0.06}>
              <div
                className="pipeline-node absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-ink-900 font-mono text-[11px] text-white md:relative md:mb-5 md:h-11 md:w-11"
                style={{ animationDelay: `${(i / steps.length) * period}s` }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: accent }}>
                {s.label}
              </p>
              <h4 className="mt-1.5 text-sm font-semibold text-white md:text-[15px]">
                {s.title}
              </h4>
              <p className="mt-2 text-[13px] leading-relaxed text-haze">{s.body}</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Connector() {
  return (
    <div
      aria-hidden="true"
      className="flow-connector flex shrink-0 items-center justify-center md:w-8 lg:w-10"
    >
      <svg viewBox="0 0 40 12" className="h-3 w-10 rotate-90 md:rotate-0" fill="none">
        <path d="M0 6h34" stroke="currentColor" strokeWidth="1.4" className="flow-dash" />
        <path d="M31 1.5 36.5 6 31 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/** Left-to-right system flow (stacks vertically on phones). */
export function FlowDiagram({
  columns,
  footnote,
  accent = "#69edfe",
}: {
  columns: FlowColumn[];
  footnote?: string;
  accent?: string;
}) {
  return (
    <figure className="rounded-3xl border border-white/[0.07] bg-gradient-to-b from-white/[0.03] to-transparent p-5 md:p-8">
      <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:gap-0">
        {columns.map((col, ci) => (
          <div key={col.title} className="contents">
            {ci > 0 && (
              <div className="text-accent-soft/50 flex justify-center">
                <Connector />
              </div>
            )}
            <Reveal delay={ci * 0.07} className="min-w-0 flex-1">
              <div className="flex h-full flex-col gap-2">
                <p className="mb-1 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-haze/60 md:text-left">
                  {col.title}
                </p>
                {col.nodes.map((n) => (
                  <div
                    key={n.label}
                    className={`rounded-xl border px-3.5 py-2.5 transition-colors duration-300 ${
                      n.accent
                        ? "flow-node-accent bg-white/[0.04]"
                        : "border-white/[0.08] bg-ink-900/70 hover:border-white/20"
                    }`}
                    style={
                      n.accent
                        ? ({
                            borderColor: `${accent}55`,
                            boxShadow: `0 0 24px -8px ${accent}66`,
                          } as React.CSSProperties)
                        : undefined
                    }
                  >
                    <p className="text-[13px] font-semibold text-white">{n.label}</p>
                    {n.sub && <p className="mt-0.5 text-[11px] text-haze">{n.sub}</p>}
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        ))}
      </div>
      {footnote && (
        <figcaption className="mt-6 border-t border-white/[0.06] pt-4 text-xs leading-relaxed text-haze/80">
          {footnote}
        </figcaption>
      )}
    </figure>
  );
}
