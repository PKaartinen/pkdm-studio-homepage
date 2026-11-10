"use client";

import { motion, useReducedMotion } from "framer-motion";
import SectionHeading from "../ui/SectionHeading";
import Reveal from "../ui/Reveal";
import { processSteps } from "@/data/content";

/**
 * Process timeline. Desktop: five stations on a rail that draws itself in as
 * the section enters; each station names what the client walks away with.
 * Phones: a vertical spine with the same content.
 */
export default function Process() {
  const reduce = useReducedMotion();

  return (
    <section className="relative py-24 md:py-32">
      <div className="shell">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            eyebrow="Our process"
            title={
              <>
                A clear path from{" "}
                <span className="text-glow">idea to launch</span>.
              </>
            }
            description="No mystery, no surprises. You always know what's happening, what's next and what you get at each step."
          />
          <Reveal delay={0.1}>
            <div className="flex items-center gap-3 rounded-full border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-xs text-haze">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Every step ends with something you can see and sign off.
            </div>
          </Reveal>
        </div>

        <ol className="relative mt-16 grid gap-5 lg:grid-cols-5 lg:gap-4">
          {/* Rail (desktop) */}
          <div aria-hidden="true" className="absolute left-0 right-0 top-[1.4rem] hidden h-px bg-white/10 lg:block">
            <motion.div
              className="h-full origin-left bg-gradient-to-r from-accent-soft via-accent to-accent-deep"
              initial={reduce ? { scaleX: 1 } : { scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          {/* Spine (phones/tablets) */}
          <div aria-hidden="true" className="absolute bottom-6 left-[1.4rem] top-6 w-px bg-gradient-to-b from-accent-soft/40 via-white/10 to-transparent lg:hidden" />

          {processSteps.map((step, i) => (
            <li key={step.title} className="relative">
              <Reveal delay={0.1 + i * 0.08} className="h-full">
                <div className="flex h-full gap-5 lg:flex-col lg:gap-0">
                  <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-accent-soft/30 bg-ink-800 font-display text-base font-bold text-accent-soft">
                    {i + 1}
                    {!reduce && (
                      <motion.span
                        className="absolute inset-0 rounded-full border border-accent-soft/40"
                        animate={{ scale: [1, 1.45], opacity: [0.5, 0] }}
                        transition={{
                          duration: 2.4,
                          repeat: Infinity,
                          delay: i * 0.35,
                          ease: "easeOut",
                        }}
                      />
                    )}
                  </div>
                  <div className="group flex flex-1 flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition-colors duration-300 hover:border-accent-soft/25 lg:mt-6">
                    <h3 className="font-display text-lg font-semibold text-white">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-haze">
                      {step.description}
                    </p>
                    {step.deliverable && (
                      <div className="mt-auto pt-4">
                        <p className="border-t border-white/[0.06] pt-3 text-xs text-white/80">
                          <span className="mr-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-accent-soft/80">
                            You get
                          </span>
                          {step.deliverable}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
