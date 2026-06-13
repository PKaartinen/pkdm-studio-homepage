import Reveal from "./ui/Reveal";
import MagneticButton from "./ui/MagneticButton";
import { ArrowRight } from "./ui/icons";

/**
 * Reusable bottom-of-page call-to-action band (no pricing — straight to a
 * conversation).
 */
export default function CTASection({
  title = "Need to start a project?",
  description = "Tell us what you're building. You'll get a thoughtful reply within 24 hours — straight from Pietu, the person doing the work.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="shell py-24 md:py-32">
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-ink-800/60 to-ink-900/40 p-10 text-center md:p-16">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/15 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent-deep/20 blur-[120px]" />
        <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
              {title}
            </h2>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="text-base leading-relaxed text-haze sm:text-lg">
              {description}
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <MagneticButton href="/contact">
              Let&apos;s talk about your project
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </MagneticButton>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
