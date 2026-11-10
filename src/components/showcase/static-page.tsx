// ---------------------------------------------------------------------------
// Static homepage (mobile + reduced-motion + touch/small-window desktops).
//
// NO "use client" directive and NO imports that reach any 3D module:
//   - rendered directly by the server UA gate (page.tsx) for mobile UAs, so
//     a phone's tree never references any 3D client code;
//   - also rendered by device-gate.tsx (client) for iPadOS-as-Mac /
//     reduced-motion / small-window desktops — it compiles in both worlds.
//
// This is a full, clean homepage — not a bare poster placeholder. Its intro
// renders zero client JS of its own (real H1, a recently-shipped strip, the
// 3D poster teaser, pillars and stats); the shared HomeContent (featured case
// study, selected work, capabilities, process, CTA) follows as children. The
// site chrome (Nav / Background / Footer) from the root layout is visible.
//
// Story copy comes from showcase/config.ts (canonical re-exports).
// ---------------------------------------------------------------------------

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { hero, act1, act3, finale, ctas, featuredProjects } from "./config";

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

export default function ShowcaseStaticPage({
  children,
}: {
  /** The shared homepage content (HomeContent), rendered after the intro. */
  children?: ReactNode;
}) {
  return (
    <main id="main" className="showcase-static-root relative">
      {/* Hero — real text (H1 is DOM text, not baked into an image) */}
      <section className="shell pb-14 pt-32 md:pt-40">
        <p className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
          {hero.eyebrow}
        </p>
        <h1 className="display mt-6 font-display text-[2.7rem] font-bold leading-[1.03] tracking-tight text-white sm:text-6xl md:text-7xl">
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

        {/* Recent work strip — tiny thumbnails, straight into case studies */}
        <div className="mt-10 border-t border-white/[0.06] pt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-haze/50">
            Recently shipped
          </p>
          <ul className="no-scrollbar -mx-5 mt-4 flex gap-2.5 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0">
            {featuredProjects.map((p) => (
              <li key={p.slug} className="shrink-0">
                <Link
                  href={`/projects/${p.slug}`}
                  className="flex items-center gap-2.5 rounded-full border border-white/[0.09] bg-white/[0.02] py-1.5 pl-1.5 pr-4 text-sm text-white/90 transition-colors hover:border-white/25"
                >
                  <span className="relative h-7 w-7 overflow-hidden rounded-full border border-white/10">
                    <Image src={p.image.src} alt="" fill sizes="28px" className="object-cover object-top" />
                  </span>
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Desktop-experience teaser — the baked poster of the 3D hero */}
      <section className="shell pb-16">
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-800/40">
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
          <span className="absolute bottom-3 left-3 rounded-full border border-white/10 bg-ink-950/80 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/80 backdrop-blur">
            Interactive 3D · on desktop
          </span>
        </div>
      </section>

      {/* Why us — the answer in under 5 seconds + canonical pillars + stats */}
      <section className="shell pb-20">
        <h2 className="display max-w-2xl font-display text-2xl font-bold leading-snug text-white md:text-3xl">
          {act1.headline}
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[act1.pillar, act3.pillar, finale.pillar].map((p, i) => (
            <div
              key={p.title}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6"
            >
              <span className="font-mono text-[11px] text-accent-soft/80">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-base font-semibold text-white">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-haze">
                {p.description}
              </p>
            </div>
          ))}
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 text-center">
          {act3.stats.map((s) => (
            <div key={s.label} className="flex flex-col-reverse gap-1">
              <dt className="text-[10px] uppercase tracking-[0.14em] text-haze/70 sm:text-xs">
                {s.label}
              </dt>
              <dd className="display font-display text-2xl font-bold text-white md:text-3xl">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {children}
    </main>
  );
}
