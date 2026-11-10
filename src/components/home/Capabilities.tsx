import Link from "next/link";
import SpotlightCard from "@/components/ui/SpotlightCard";
import Reveal from "@/components/ui/Reveal";
import { getProject } from "@/data/projects";

// Each capability is backed by real shipped projects (linked) — proof, not
// claims. Icons are inline 24px strokes, no icon library.
const CAPABILITIES = [
  {
    title: "Marketing sites & landing pages",
    body: "Conversion-led sites that explain the offer in seconds and make the next step obvious.",
    proof: ["privatebyright-vpn", "spray"],
    icon: "M3 5h18v14H3zM3 9h18M7 13h6M7 16h4",
  },
  {
    title: "Web apps & members areas",
    body: "Dashboards, accounts, gated content and onboarding people actually finish.",
    proof: ["clearpen", "liveside"],
    icon: "M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z",
  },
  {
    title: "Payments & funnels",
    body: "Stripe and card-iframe checkouts, trials, upsells and A/B funnels for paid and affiliate traffic.",
    proof: ["clearpen", "liveside"],
    icon: "M3 6h18v12H3zM3 10h18M7 15h3",
  },
  {
    title: "AI products & pipelines",
    body: "LLM features, multi-stage NLP pipelines and AI advisors — engineered, measured and shipped.",
    proof: ["clearpen", "unifolio"],
    icon: "M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2M9 9h6v6H9z",
  },
  {
    title: "Streaming & live data",
    body: "HLS video, live scores and real-time surfaces that stay fast on a static host.",
    proof: ["liveside", "watchshort"],
    icon: "M4 6h16v10H4zM9 20h6M12 16v4M10 9l4 2-4 2z",
  },
  {
    title: "Brand & launch",
    body: "Identity, product renders and a launch site — a brand that looks established on day one.",
    proof: ["spray"],
    icon: "M12 3l2.6 5.6L20 9.3l-4 4.1.9 5.6L12 16.4 7.1 19l.9-5.6-4-4.1 5.4-.7z",
  },
];

function Card({
  c,
  index,
}: {
  c: (typeof CAPABILITIES)[number];
  index: number;
}) {
  return (
    <SpotlightCard className="flex h-full flex-col rounded-2xl border border-white/[0.07] bg-ink-900/50 p-6 transition-colors duration-300 hover:border-accent-soft/25 md:p-7">
      <div className="relative flex items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-accent-soft transition-colors duration-300 group-hover:border-accent-soft/40">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            <path d={c.icon} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="font-mono text-[11px] text-haze/50">{String(index + 1).padStart(2, "0")}</span>
      </div>
      <h3 className="relative mt-6 font-display text-lg font-semibold text-white md:text-xl">{c.title}</h3>
      <p className="relative mt-2 text-sm leading-relaxed text-haze">{c.body}</p>
      <div className="relative mt-auto flex flex-wrap items-center gap-1.5 pt-6">
        <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.18em] text-haze/50">Seen in</span>
        {c.proof.map((slug) => {
          const p = getProject(slug);
          if (!p) return null;
          return (
            <Link
              key={slug}
              href={`/projects/${slug}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.09] px-2.5 py-1 text-[11px] text-white/85 transition-colors hover:border-white/25 hover:text-white"
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.accent }} />
              {p.name}
            </Link>
          );
        })}
      </div>
    </SpotlightCard>
  );
}

export default function Capabilities() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {CAPABILITIES.map((c, i) => (
        <Reveal key={c.title} delay={(i % 3) * 0.06}>
          <Card c={c} index={i} />
        </Reveal>
      ))}
    </div>
  );
}
