// ---------------------------------------------------------------------------
// Static homepage (mobile + reduced-motion + touch/small-window desktops).
//
// NO "use client" directive and NO imports that reach any 3D module:
//   - rendered directly by the server UA gate (page.tsx) for mobile UAs, so
//     a phone's tree never references any 3D client code;
//   - also rendered by device-gate.tsx (client) for iPadOS-as-Mac /
//     reduced-motion / small-window desktops — it compiles in both worlds.
//
// This is a full, clean homepage — not a bare poster placeholder. It renders
// zero client JS of its own (server components only: real H1, pillars, the
// featured work grid, stats, and the finale CTA). The site chrome (Nav /
// Background / Footer) from the root layout IS visible on this variant —
// globals.css only hides chrome for the 3D showcase (see .showcase-static-root
// scoping there).
//
// ALL copy comes from showcase/config.ts (canonical re-exports) — nothing
// re-typed.
// ---------------------------------------------------------------------------

import Link from "next/link";
import ProjectCard from "@/components/ProjectCard";
import { hero, act1, act2, act3, finale, ctas, featuredProjects } from "./config";

/** Poster variants generated from the approved hero at rest (prod capture,
 *  1440×900 @ DPR2). Files live in public/showcase/poster/. Shown here as a
 *  framed teaser of the desktop experience (headline is baked into it). */
const POSTER = {
  base: "/showcase/poster/hero-poster-1080.webp",
  srcSet: [
    "/showcase/poster/hero-poster-720.webp 720w",
    "/showcase/poster/hero-poster-1080.webp 1080w",
    "/showcase/poster/hero-poster-1600.webp 1600w",
  ].join(", "),
  width: 2400,
  height: 1500,
} as const;

function PrimaryCta({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-ink-950 shadow-[0_8px_30px_-8px_rgba(105,237,254,0.65)] transition-colors duration-300 hover:bg-accent-soft"
    >
      {label}
    </Link>
  );
}

export default function ShowcaseStaticPage() {
  return (
    <main id="main" className="showcase-static-root relative">
      {/* Hero — real text (H1 is DOM text, not baked into an image) */}
      <section className="shell pb-16 pt-32 md:pt-40">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">
          {hero.eyebrow}
        </p>
        <h1 className="display mt-5 font-display text-[2.6rem] font-bold leading-[1.05] tracking-tight text-white sm:text-6xl">
          {hero.h1Line1}
          <br />
          <span className="text-glow">{hero.h1Line2}</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-haze">
          {hero.sub}
        </p>
        <div className="mt-8 flex flex-col items-start gap-3">
          <PrimaryCta href={ctas.contactHref} label={hero.cta} />
          <p className="text-sm text-haze/70">{hero.reassurance}</p>
        </div>
      </section>

      {/* Desktop-experience teaser — the baked poster of the 3D hero */}
      <section className="shell pb-16">
        <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-800/40">
          {/* eslint-disable-next-line @next/next/no-img-element -- hand-encoded
              WebP variants with explicit srcset; next/image would re-encode. */}
          <img
            src={POSTER.base}
            srcSet={POSTER.srcSet}
            sizes="(max-width: 1240px) 100vw, 1176px"
            width={POSTER.width}
            height={POSTER.height}
            alt="Preview of the PKDM Studio interactive 3D homepage"
            loading="lazy"
            decoding="async"
            className="showcase-static-poster"
          />
        </div>
        <p className="mt-3 text-xs text-haze/60">
          The full interactive experience is waiting on desktop.
        </p>
      </section>

      {/* Why us — the answer in under 5 seconds + canonical pillars */}
      <section className="shell pb-16">
        <h2 className="display max-w-2xl font-display text-2xl font-bold leading-snug text-white md:text-3xl">
          {act1.headline}
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[act1.pillar, act3.pillar, finale.pillar].map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6"
            >
              <h3 className="text-base font-semibold text-white">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-haze">
                {p.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* The Work — featured projects, same canonical set as the 3D panels */}
      <section className="shell pb-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="display font-display text-2xl font-bold text-white md:text-3xl">
              {act2.headline}
            </h2>
            <p className="mt-3 max-w-xl text-haze">{act2.subline}</p>
          </div>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {featuredProjects.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
        <div className="mt-8">
          <Link
            href={ctas.viewAllProjectsHref}
            className="group inline-flex items-center gap-2 text-sm font-semibold text-accent transition-colors hover:text-accent-soft"
          >
            {ctas.viewAllProjects}
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </div>
      </section>

      {/* Stats strip */}
      <section className="shell pb-16">
        <dl className="grid grid-cols-3 gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 text-center">
          {act3.stats.map((s) => (
            <div key={s.label}>
              <dd className="display font-display text-2xl font-bold text-white md:text-3xl">
                {s.value}
              </dd>
              <dt className="mt-1 text-xs uppercase tracking-[0.14em] text-haze/70">
                {s.label}
              </dt>
            </div>
          ))}
        </dl>
      </section>

      {/* Finale CTA */}
      <section className="shell pb-24">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8 md:p-12">
          <h2 className="display font-display text-3xl font-bold text-white md:text-4xl">
            {finale.headline}
          </h2>
          <div className="mt-8 flex flex-col items-start gap-3">
            <PrimaryCta href={ctas.contactHref} label={finale.cta} />
            <p className="text-sm text-haze/70">{finale.reassurance}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
