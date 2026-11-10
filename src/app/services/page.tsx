import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import SpotlightCard from "@/components/ui/SpotlightCard";
import CTASection from "@/components/CTASection";
import Process from "@/components/sections/Process";
import Capabilities from "@/components/home/Capabilities";
import { services } from "@/data/content";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Strategy & UX, web design, modern web development, web apps and members areas, payments and funnels, AI features, content and ongoing growth, delivered as one connected system.",
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
        description="Design, content, and development as one system, not separate pieces bolted together. Here's how we help."
      />

      <section className="shell pb-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => (
            <Reveal key={service.title} delay={(i % 3) * 0.06}>
              <SpotlightCard className="h-full rounded-2xl border border-white/[0.07] bg-white/[0.02] p-7 transition-colors duration-300 hover:border-accent/25">
                <span className="relative font-mono text-xs text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="relative mt-4 text-xl font-semibold tracking-tight text-white">
                  {service.title}
                </h2>
                <p className="relative mt-3 text-sm leading-relaxed text-haze">
                  {service.description}
                </p>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Capability proof */}
      <section className="mt-20 border-y border-white/[0.05] bg-white/[0.012] py-24 md:mt-28 md:py-32">
        <div className="shell">
          <SectionHeading
            eyebrow="What we build"
            title={
              <>
                Every service, backed by{" "}
                <span className="text-glow">something live</span>.
              </>
            }
            description="Don't take our word for it; each capability links to a real project you can open today."
          />
          <div className="mt-14">
            <Capabilities />
          </div>
        </div>
      </section>

      <Process />

      <CTASection
        title="Not sure which you need?"
        description="Tell us about your business and goals and we'll recommend the right approach. Reply within 24 hours."
      />
    </main>
  );
}
