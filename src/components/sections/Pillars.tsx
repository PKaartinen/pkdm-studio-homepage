import SectionHeading from "../ui/SectionHeading";
import Reveal from "../ui/Reveal";
import { pillars } from "@/data/content";

export default function Pillars() {
  return (
    <section id="about" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="shell">
        <SectionHeading
          eyebrow="How we make sites work"
          title={
            <>
              We build for trust,{" "}
              <span className="text-glow">clarity, and conversions</span>.
            </>
          }
          description="Every business is unique, so every business website should be too. We treat your site as the modern-day business card — and a 24/7 sales rep."
        />

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {pillars.map((pillar, i) => (
            <Reveal key={pillar.title} delay={i * 0.08}>
              <div className="relative h-full overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-transparent p-8">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-accent-soft/20 bg-accent/10 font-display text-lg font-bold text-accent-soft">
                  {i + 1}
                </div>
                <h3 className="mb-3 font-display text-xl font-semibold text-white">
                  {pillar.title}
                </h3>
                <p className="text-sm leading-relaxed text-haze">
                  {pillar.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
