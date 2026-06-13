"use client";

import { motion, useReducedMotion } from "framer-motion";
import SectionHeading from "../ui/SectionHeading";
import Reveal from "../ui/Reveal";
import { processSteps } from "@/data/content";

export default function Process() {
  const reduce = useReducedMotion();

  return (
    <section className="relative py-24 md:py-32">
      <div className="shell">
        <SectionHeading
          eyebrow="Our process"
          title={
            <>
              A clear path from{" "}
              <span className="text-glow">idea to launch</span>.
            </>
          }
          description="No mystery, no surprises. You always know what's happening and why."
        />

        <ol className="relative mt-14 space-y-4">
          {/* timeline spine */}
          <div className="absolute bottom-0 left-[1.35rem] top-2 w-px bg-gradient-to-b from-accent-soft/40 via-white/10 to-transparent md:left-[1.6rem]" />

          {processSteps.map((step, i) => (
            <li key={step.title} className="relative">
              <Reveal delay={i * 0.05}>
                <div className="flex items-start gap-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 md:gap-7 md:p-6">
                  <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-accent-soft/30 bg-ink-800 font-display text-base font-bold text-accent-soft md:h-12 md:w-12">
                    {i + 1}
                    {!reduce && (
                      <motion.span
                        className="absolute inset-0 rounded-full border border-accent-soft/40"
                        animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
                        transition={{
                          duration: 2.4,
                          repeat: Infinity,
                          delay: i * 0.3,
                          ease: "easeOut",
                        }}
                      />
                    )}
                  </div>
                  <div className="pt-1">
                    <h3 className="font-display text-lg font-semibold text-white md:text-xl">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-haze">
                      {step.description}
                    </p>
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
