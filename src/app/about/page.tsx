import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/ui/Reveal";
import CTASection from "@/components/CTASection";
import Process from "@/components/sections/Process";
import CountUp from "@/components/work/CountUp";
import { ArrowRight } from "@/components/ui/icons";
import { pillars, stats } from "@/data/content";
import { getProject } from "@/data/projects";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "PKDM Studio is a founder-led web design & development studio run by Pietari (Pietu) Kaartinen, building unique, conversion-focused websites and products for digital-first businesses in Europe.",
  alternates: { canonical: "/about" },
};

const OWN = ["clearpen", "unifolio", "spray"];

export default function AboutPage() {
  const own = OWN.map((s) => getProject(s)).filter(Boolean) as NonNullable<
    ReturnType<typeof getProject>
  >[];

  return (
    <main id="main">
      <PageHero
        eyebrow="About"
        title={
          <>
            A founder-led studio that treats your site like a{" "}
            <span className="text-glow">24/7 sales rep</span>.
          </>
        }
        description="PKDM Studio is run by Pietari ('Pietu') Kaartinen. You talk directly to the person doing the strategy, design and engineering. No account managers, no hand-offs."
      />

      {/* Founder */}
      <section className="shell pb-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <div className="relative h-full overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-ink-800/80 to-ink-950 p-8 md:p-10">
              <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(70%_70%_at_20%_10%,#000,transparent)]" />
              <div className="relative flex items-center gap-5">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 font-display text-xl font-bold text-accent">
                  PK
                </span>
                <div>
                  <p className="font-display text-xl font-semibold text-white">Pietari Kaartinen</p>
                  <p className="text-sm text-haze">Founder · design & engineering</p>
                </div>
              </div>
              <dl className="relative mt-10 grid gap-5 text-sm">
                {[
                  ["Studio", `${site.legalEntity}, Tallinn, Estonia`],
                  ["Works with", "Founders and digital-first businesses across Europe"],
                  ["Day to day", "Product design, full-stack builds, funnels & analytics"],
                  ["Reply time", "Within 24 hours, from Pietu himself"],
                ].map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[7.5rem_1fr] gap-4 border-t border-white/[0.06] pt-4">
                    <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-haze/60">{k}</dt>
                    <dd className="text-white/90">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="flex h-full flex-col justify-between gap-8 rounded-3xl border border-white/[0.07] bg-white/[0.02] p-8 md:p-10">
              <div>
                <h2 className="display font-display text-2xl font-bold text-white md:text-3xl">
                  Designed by someone who has to make products sell.
                </h2>
                <p className="mt-5 leading-relaxed text-haze">
                  Pietu designs and engineers every project himself. Alongside
                  client work he works as a product owner and manager in performance marketing, where funnels, payments and analytics are his day job, and he builds and runs his own products.
                </p>
                <p className="mt-4 leading-relaxed text-haze">
                  That mix is the studio&apos;s edge. Every site is shaped by
                  what actually moves people to act, then built properly enough
                  to keep working long after launch day.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {stats.map((s) => (
                  <div key={s.label} className="flex flex-col-reverse gap-1 rounded-2xl border border-white/[0.07] bg-ink-900/60 p-4 text-center">
                    <span className="text-[10px] uppercase tracking-[0.14em] text-haze/70">{s.label}</span>
                    <span className="font-display text-2xl font-bold text-white md:text-3xl">
                      <CountUp value={s.value} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Own products */}
      <section className="shell py-20 md:py-28">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Reveal>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-soft">Skin in the game</p>
            </Reveal>
            <Reveal delay={0.04}>
              <h2 className="display mt-4 max-w-2xl font-display text-3xl font-bold leading-tight text-white md:text-4xl">
                We build and run our own products, too.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.08}>
            <p className="max-w-sm text-sm leading-relaxed text-haze">
              The lessons from launching, selling and supporting our own
              products go straight into client work.
            </p>
          </Reveal>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {own.map((p, i) => (
            <Reveal key={p.slug} delay={i * 0.06}>
              <Link
                href={`/projects/${p.slug}`}
                className="group block overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-900/60 transition-colors duration-500 hover:border-white/20"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={p.image.src}
                    alt={p.image.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover object-top transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
                  />
                </div>
                <div className="flex items-center justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{p.name}</p>
                    <p className="truncate text-sm text-haze">{p.category}</p>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white transition-colors group-hover:bg-white group-hover:text-ink-950">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Belief + audience */}
      <section className="shell pb-8">
        <div className="grid gap-5 md:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8">
              <h2 className="text-xl font-semibold tracking-tight text-white">
                Our core belief
              </h2>
              <p className="mt-4 leading-relaxed text-haze">
                Every business is unique, so every business website should be
                unique too. A website is the modern-day business card, and a 24/7 sales rep. We design and build sites that feel trustworthy,
                explain your offer clearly, and push visitors towards the next
                step.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="h-full rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8">
              <h2 className="text-xl font-semibold tracking-tight text-white">
                Who we work with
              </h2>
              <p className="mt-4 leading-relaxed text-haze">
                Digital-first businesses and founders in Europe (SaaS and AI products, streaming and subscription platforms, DTC brands, online services) who understand that design, UX, content and
                development are one system, not just &ldquo;making it look
                pretty&rdquo;.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Brand pillars */}
      <section className="shell py-20 md:py-28">
        <Reveal>
          <h2 className="display font-display text-2xl font-bold tracking-tight text-white md:text-3xl">
            What we stand for
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {pillars.map((pillar, i) => (
            <Reveal key={pillar.title} delay={i * 0.07}>
              <div className="h-full rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-transparent p-8">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-lg font-bold text-accent">
                  {i + 1}
                </div>
                <h3 className="mb-3 text-xl font-semibold tracking-tight text-white">
                  {pillar.title}
                </h3>
                <p className="text-sm leading-relaxed text-haze">
                  {pillar.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Process />

      <CTASection />
    </main>
  );
}
