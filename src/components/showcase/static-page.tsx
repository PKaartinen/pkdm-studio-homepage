// ---------------------------------------------------------------------------
// T-315 — /showcase static fallback page (mobile + reduced-motion).
//
// NO "use client" directive and NO imports that reach any 3D module:
//   - rendered directly by the server UA gate (page.tsx) for mobile UAs, so
//     a phone's RSC tree never references any 3D client code;
//   - also rendered by device-gate.tsx (client) for iPadOS-as-Mac /
//     reduced-motion / small-window desktops — it compiles in both worlds.
//
// ALL copy comes from showcase/config.ts (canonical re-exports) — nothing
// re-typed. The footer is the site-wide config-driven <Footer /> (site.ts),
// i.e. the exact same link set the 3D footer renders.
// ---------------------------------------------------------------------------

import Footer from "@/components/Footer";
import { hero, act2, finale, ctas } from "./config";

/** Poster variants generated from the approved hero at rest (prod capture,
 *  1440×900 @ DPR2). Files live in public/showcase/poster/. */
const POSTER = {
  base: "/showcase/poster/hero-poster-1600.webp",
  srcSet: [
    "/showcase/poster/hero-poster-720.webp 720w",
    "/showcase/poster/hero-poster-1080.webp 1080w",
    "/showcase/poster/hero-poster-1600.webp 1600w",
    "/showcase/poster/hero-poster-2400.webp 2400w",
  ].join(", "),
  width: 2400,
  height: 1500,
} as const;

export default function ShowcaseStaticPage() {
  return (
    <main id="main" className="showcase-static-root relative">
      {/* Hero — baked poster of the approved 3D hero at rest. The headline
          is baked into the image, so the DOM H1 is sr-only (composition
          choice per spec §4 / T-315 brief). */}
      <section className="relative">
        <h1 className="sr-only">
          {hero.h1Line1} {hero.h1Line2}
        </h1>
        <div className="showcase-static-posterwrap relative">
          {/* eslint-disable-next-line @next/next/no-img-element -- v6 precedent:
              this is the LCP asset, hand-encoded to ≤200 KB WebP with explicit
              srcset variants; next/image would re-encode it. Served verbatim. */}
          <img
            src={POSTER.base}
            srcSet={POSTER.srcSet}
            sizes="100vw"
            width={POSTER.width}
            height={POSTER.height}
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            decoding="async"
            className="showcase-static-poster"
          />
          {/* Blend the poster's bottom edge into the void gradient below */}
          <div className="showcase-static-fade" aria-hidden="true" />
        </div>
      </section>

      {/* Stacked canonical copy + CTA (spec §2c strings via config only) */}
      {/* Copy stack per T-315 brief: sub + CTA + reassurance + projects link
          + finale block + footer. (The eyebrow is baked into the poster —
          not repeated here.) */}
      <section className="shell relative -mt-6 pb-20 pt-2">
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-haze">
          {hero.sub}
        </p>
        <div className="mt-8 flex flex-col items-start gap-3">
          <a
            href={ctas.contactHref}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-ink-950 shadow-[0_8px_30px_-8px_rgba(105,237,254,0.65)] transition-colors duration-300 hover:bg-accent-soft"
          >
            {hero.cta}
          </a>
          <p className="text-sm text-haze/70">{hero.reassurance}</p>
        </div>

        {/* The Work — canonical section heading as the link to /projects */}
        <div className="mt-16 border-t border-white/5 pt-10">
          <a
            href={ctas.viewAllProjectsHref}
            className="group inline-flex items-center gap-3"
          >
            <span className="display font-display text-2xl font-bold text-white transition-colors group-hover:text-accent-soft md:text-3xl">
              {act2.headline}
            </span>
            <span aria-hidden="true" className="text-accent-soft">
              →
            </span>
          </a>
          <p className="mt-4 max-w-xl text-haze">{act2.subline}</p>
        </div>

        {/* Finale CTA block */}
        <div className="mt-16 border-t border-white/5 pt-10">
          <h2 className="display font-display text-3xl font-bold text-white md:text-4xl">
            {finale.headline}
          </h2>
          <p className="mt-4 max-w-xl text-haze">
            {finale.pillar.title} — {finale.pillar.description}
          </p>
          <div className="mt-8 flex flex-col items-start gap-3">
            <a
              href={ctas.contactHref}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-ink-950 shadow-[0_8px_30px_-8px_rgba(105,237,254,0.65)] transition-colors duration-300 hover:bg-accent-soft"
            >
              {finale.cta}
            </a>
            <p className="text-sm text-haze/70">{finale.reassurance}</p>
          </div>
        </div>
      </section>

      {/* Same links as the 3D footer: the site-wide config-driven footer
          (site.ts navLinks / socialLinks / contact). The root-layout footer
          is display:none inside .showcase-root, so this nested one renders. */}
      <Footer />
    </main>
  );
}
