"use client";

import { hero } from "./config";

/**
 * /showcase client shell — "The Click".
 * T-301 scaffold: DOM copy from config only (zero typed strings).
 * Canvas shell + scroll store land in T-302.
 */
export default function ShowcaseExperience() {
  return (
    <main id="main" className="relative">
      <section className="relative flex min-h-[100svh] items-center">
        <div className="shell">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent-soft">
            {hero.eyebrow}
          </p>
          <h1 className="display mt-6 font-display text-[10vw] font-bold leading-[1.02] text-white">
            {hero.h1Line1}
            <br />
            {hero.h1Line2}
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-haze">
            {hero.sub}
          </p>
        </div>
      </section>
    </main>
  );
}
