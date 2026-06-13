import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/ui/Reveal";
import CTASection from "@/components/CTASection";
import { services, processSteps } from "@/data/content";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Strategy & UX, web design, Webflow development, conversion landing pages, content, UI/UX systems, and ongoing growth — delivered as one connected system.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <main id="main">
      <PageHero
        eyebrow="Services"
        title={
          <>
            Everything your website needs,{" "}
            <span className="text-glow">handled by one team</span>.
          </>
        }
        description="Design, content, and Webflow development as one system — not separate pieces bolted together. Here's how we help."
      />

      <section className="shell pb-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => (
            <Reveal key={service.title} delay={(i % 3) * 0.06}>
              <div className="h-full rounded-2xl border border-white/[0.07] bg-white/[0.02] p-7 transition-colors duration-300 hover:border-accent/25">
                <span className="text-sm font-semibold text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="mt-4 text-xl font-semibold tracking-tight text-white">
                  {service.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-haze">
                  {service.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="shell py-20 md:py-28">
        <Reveal>
          <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
            A clear path from idea to launch
          </h2>
        </Reveal>
        <ol className="mt-10 space-y-4">
          {processSteps.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.05}>
              <li className="flex items-start gap-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-ink-800 text-base font-bold text-accent">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-white">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-haze">
                    {step.description}
                  </p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      <CTASection title="Not sure which you need?" description="Tell us about your business and goals — we'll recommend the right approach. Reply within 24 hours." />
    </main>
  );
}
