"use client";

import { motion, useReducedMotion } from "framer-motion";
import MagneticButton from "../ui/MagneticButton";
import { ArrowRight } from "../ui/icons";
import { stats } from "@/data/content";

export default function Hero() {
  const reduce = useReducedMotion();

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.08, delayChildren: 0.05 },
    },
  };
  const item = {
    hidden: { opacity: 0, y: reduce ? 0 : 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] items-center pt-28 pb-20"
    >
      <div className="shell">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex max-w-4xl flex-col items-start gap-7"
        >
          <motion.span
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-accent-soft/20 bg-accent/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-accent-soft"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-soft opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-soft" />
            </span>
            Founder-led web design & Webflow studio
          </motion.span>

          <motion.h1
            variants={item}
            className="font-display text-[2.75rem] font-bold leading-[1.02] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[5.25rem]"
          >
            Websites built <br className="hidden sm:block" />
            to <span className="text-glow">convert</span>.
          </motion.h1>

          <motion.p
            variants={item}
            className="max-w-xl text-lg leading-relaxed text-haze md:text-xl"
          >
            Your website should do more than look pretty. We design and build
            unique, conversion-focused Webflow sites that build trust and turn
            visitors into customers.
          </motion.p>

          <motion.div
            variants={item}
            className="flex flex-col items-start gap-4 sm:flex-row sm:items-center"
          >
            <MagneticButton href="/contact">
              Let&apos;s talk about your website
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </MagneticButton>
            <MagneticButton href="/projects" variant="ghost">
              See our work
            </MagneticButton>
          </motion.div>

          <motion.p variants={item} className="text-sm text-haze/70">
            Get a reply within 24 hours — straight from the person doing the work.
          </motion.p>

          <motion.dl
            variants={item}
            className="mt-6 grid w-full max-w-lg grid-cols-3 gap-4 border-t border-white/5 pt-6"
          >
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col gap-1">
                <dt className="order-2 text-xs uppercase tracking-wide text-haze/70">
                  {s.label}
                </dt>
                <dd className="order-1 font-display text-2xl font-bold text-white md:text-3xl">
                  {s.value}
                </dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>
      </div>

      {/* Scroll cue */}
      {!reduce && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 md:block"
        >
          <div className="flex h-9 w-5 items-start justify-center rounded-full border border-white/20 p-1">
            <motion.span
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="h-1.5 w-1.5 rounded-full bg-accent-soft"
            />
          </div>
        </motion.div>
      )}
    </section>
  );
}
