import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/ui/Reveal";
import CTASection from "@/components/CTASection";
import { pillars, processSteps, stats } from "@/data/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "PKDM Studio is a founder-led web design & development studio run by Pietari (Pietu) Kaartinen, building unique, conversion-focused websites for digital-first businesses in Europe.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
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
        description="PKDM Studio is run by Pietari ('Pietu') Kaartinen. You talk directly to the person doing the strategic and design work — no account managers, no hand-offs."
      />

      <section className="shell pb-8">
        <div className="grid gap-10 md:grid-cols-2">
          <Reveal>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8">
              <h2 className="text-xl font-semibold tracking-tight text-white">
                Our core belief
              </h2>
              <p className="mt-4 leading-relaxed text-haze">
                Every business is unique, so every business website should be
                unique too. A website is the modern-day business card — and a
                24/7 sales rep. We design and build sites that feel trustworthy,
                explain your offer clearly, and push visitors towards the next
                step.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8">
              <h2 className="text-xl font-semibold tracking-tight text-white">
                Who we work with
              </h2>
              <p className="mt-4 leading-relaxed text-haze">
                Digital-first businesses in Europe — DTC brands, SaaS, agencies,
                and online service businesses — that already operate online and
                understand that design, UX, content, and development are one
                system, not just &ldquo;making it look pretty&rdquo;.
              </p>
            </div>
          </Reveal>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.05}>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 text-center">
                <div className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                  {s.value}
                </div>
                <div className="mt-1 text-xs uppercase tracking-wide text-haze/70">
                  {s.label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Brand pillars */}
      <section className="shell py-20 md:py-28">
        <Reveal>
          <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
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

      {/* Process */}
      <section className="shell pb-8">
        <Reveal>
          <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
            How we work
          </h2>
        </Reveal>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {processSteps.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.05}>
              <li className="h-full rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
                <span className="text-sm font-semibold text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-base font-semibold tracking-tight text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-haze">
                  {step.description}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      <CTASection />
    </main>
  );
}
