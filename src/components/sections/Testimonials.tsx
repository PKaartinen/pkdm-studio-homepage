"use client";

import SectionHeading from "../ui/SectionHeading";
import Reveal from "../ui/Reveal";
import { testimonials } from "@/data/content";

function Card({ name, role, quote }: (typeof testimonials)[number]) {
  return (
    <figure className="flex h-full w-[320px] shrink-0 flex-col gap-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-7 sm:w-[380px]">
      <div className="flex gap-1 text-accent-soft" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7L12 2z" />
          </svg>
        ))}
      </div>
      <blockquote className="text-sm leading-relaxed text-white/90">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <figcaption className="mt-auto flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 font-display text-sm font-semibold text-accent-soft">
          {name
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </span>
        <span>
          <span className="block text-sm font-semibold text-white">{name}</span>
          <span className="block text-xs text-haze/80">{role}</span>
        </span>
      </figcaption>
    </figure>
  );
}

/**
 * Auto-scrolling testimonial rail (transform-based CSS marquee, pauses on
 * hover, static/scrollable under reduced motion).
 */
export default function Testimonials() {
  const row = [...testimonials, ...testimonials];

  return (
    <section className="relative py-24 md:py-32">
      <div className="shell">
        <SectionHeading
          eyebrow="Testimonials"
          align="center"
          title={
            <>
              What clients say about{" "}
              <span className="text-glow">working with us</span>.
            </>
          }
        />
      </div>

      <div className="group relative mt-14 flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        <div
          className="flex shrink-0 animate-marquee gap-5 pr-5 group-hover:[animation-play-state:paused] motion-reduce:animate-none motion-reduce:overflow-x-auto"
          style={{ ["--marquee-duration" as string]: "60s" }}
        >
          {row.map((t, i) => (
            <Card key={`${t.name}-${i}`} {...t} />
          ))}
        </div>
      </div>
    </section>
  );
}
