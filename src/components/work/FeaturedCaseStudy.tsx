import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import MagneticButton from "@/components/ui/MagneticButton";
import { ArrowRight, ArrowUpRight } from "@/components/ui/icons";
import { displayUrl, heroProject } from "@/data/projects";
import { BrowserFrame, PhoneFrame } from "./Frames";
import CountUp from "./CountUp";

/**
 * The hero project module (ClearPen) — used on the homepage and /projects.
 * A device composition (browser + phone + floating capability chips) next to
 * the story in brief, the scope as chips and four headline numbers.
 */
export default function FeaturedCaseStudy({
  headingLevel = "h2",
}: {
  headingLevel?: "h2" | "h3";
}) {
  const p = heroProject;
  const H = headingLevel;
  const host = displayUrl(p.url);
  const chips = [
    { label: "Members area", x: "left-[-4%] top-[14%]", d: "0s" },
    { label: "Stripe billing + trials", x: "right-[-3%] top-[6%]", d: "1.2s" },
    { label: "A/B funnels", x: "right-[6%] bottom-[30%]", d: "2.1s" },
    { label: "6-stage NLP engine", x: "left-[18%] bottom-[-5%]", d: "0.6s" },
  ];

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-gradient-to-br from-ink-800/70 via-ink-900/60 to-ink-950 p-6 sm:p-8 md:rounded-[2rem] lg:p-12">
      {/* ambient brand glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-40 h-[28rem] w-[28rem] rounded-full blur-[130px]"
        style={{ background: `${p.accent}26` }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-32 h-[26rem] w-[26rem] rounded-full bg-accent-deep/20 blur-[130px]" />
      <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(70%_60%_at_70%_40%,#000,transparent)]" />

      <div className="relative grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
        {/* Story */}
        <div>
          <Reveal>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_#69edfe]" />
                Featured case study
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-haze">
                {p.kind} · {p.year}
              </span>
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <H className="display mt-6 font-display text-3xl font-bold leading-[1.08] text-white sm:text-4xl md:text-[2.9rem]">
              {p.name}:{" "}
              <span className="text-glow">an AI product, built end to end.</span>
            </H>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-haze md:text-lg">
              {p.summary}
            </p>
          </Reveal>

          <Reveal delay={0.14}>
            <ul className="mt-7 flex flex-wrap gap-2">
              {(p.scope ?? []).map((s) => (
                <li
                  key={s.title}
                  className="rounded-full border border-white/[0.09] bg-white/[0.03] px-3 py-1.5 text-xs text-white/85"
                >
                  {s.title}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.18}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <MagneticButton href={`/projects/${p.slug}`}>
                Read the case study
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </MagneticButton>
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 rounded-full px-4 py-3 text-sm font-semibold text-white/85 transition-colors hover:text-white"
              >
                Visit {host}
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </div>
          </Reveal>
        </div>

        {/* Composition */}
        <Reveal delay={0.08}>
          <Link
            href={`/projects/${p.slug}`}
            aria-label={`${p.name} case study`}
            className="group relative block pb-8 pl-6 pr-2 pt-4 sm:pl-12"
          >
            <div className="transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:-translate-y-1.5">
              <BrowserFrame
                url={host}
                shot={p.image}
                sizes="(max-width: 1024px) 100vw, 640px"
              />
            </div>
            {p.mobile && (
              <div className="absolute -bottom-2 left-0 w-[27%] transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:-translate-y-3 group-hover:-rotate-2 sm:left-2">
                <PhoneFrame shot={p.mobile} sizes="180px" />
              </div>
            )}
            {chips.map((c) => (
              <span
                key={c.label}
                aria-hidden="true"
                className={`float-chip absolute hidden items-center gap-1.5 whitespace-nowrap rounded-full border border-white/10 bg-ink-950/85 px-3 py-1.5 text-[11px] font-medium text-white shadow-xl backdrop-blur-md sm:inline-flex ${c.x}`}
                style={{ animationDelay: c.d }}
              >
                <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden="true">
                  <path d="m3.5 8.5 3 3 6-7" fill="none" stroke={p.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {c.label}
              </span>
            ))}
          </Link>
        </Reveal>
      </div>

      {/* Numbers */}
      {p.stats && (
        <dl className="relative mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.06] md:mt-14 md:grid-cols-4">
          {p.stats.map((s) => (
            <div key={s.label} className="flex flex-col-reverse justify-end gap-1.5 bg-ink-900/90 px-5 py-6 md:px-7">
              <dt className="text-xs uppercase tracking-[0.14em] text-haze/80">
                {s.label}
              </dt>
              <dd className="font-display text-3xl font-bold text-white md:text-4xl">
                <CountUp value={s.value} />
              </dd>
            </div>
          ))}
        </dl>
      )}

      {/* Small print: the product's logo row */}
      <div className="relative mt-6 flex items-center gap-3 text-xs text-haze/60">
        <Image src="/clients/clearpen.svg" alt="" width={90} height={24} className="logo-mono h-4 w-auto" />
        <span>Own product — designed, engineered and grown by PKDM Studio.</span>
      </div>
    </div>
  );
}
