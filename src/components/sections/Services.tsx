"use client";

import { useRef } from "react";
import SectionHeading from "../ui/SectionHeading";
import Reveal from "../ui/Reveal";
import { services } from "@/data/content";

export default function Services() {
  return (
    <section id="services" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="shell">
        <SectionHeading
          eyebrow="What we do"
          title={
            <>
              Everything your website needs,{" "}
              <span className="text-glow">handled by one team</span>.
            </>
          }
          description="Design, content, and development as one system — not separate pieces bolted together."
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => (
            <Reveal key={service.title} delay={(i % 3) * 0.06}>
              <ServiceCard
                index={i + 1}
                title={service.title}
                description={service.description}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceCard({
  index,
  title,
  description,
}: {
  index: number;
  title: string;
  description: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Cursor-aware glow that follows the pointer across the card.
  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className="group relative h-full overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] p-7 transition-colors duration-300 hover:border-accent-soft/25"
    >
      {/* pointer glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(280px circle at var(--mx) var(--my), rgba(77,124,255,0.12), transparent 70%)",
        }}
      />
      <div className="relative flex h-full flex-col gap-4">
        <span className="font-display text-sm font-semibold text-accent-soft/70">
          {String(index).padStart(2, "0")}
        </span>
        <h3 className="font-display text-xl font-semibold text-white">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-haze">{description}</p>
      </div>
    </div>
  );
}
