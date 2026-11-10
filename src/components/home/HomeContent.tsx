import Link from "next/link";
import Image from "next/image";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";
import ProjectCard from "@/components/ProjectCard";
import FeaturedCaseStudy from "@/components/work/FeaturedCaseStudy";
import Marquee from "@/components/sections/Marquee";
import Process from "@/components/sections/Process";
import CTASection from "@/components/CTASection";
import Capabilities from "./Capabilities";
import { ArrowRight } from "@/components/ui/icons";
import { featuredWork, heroProject, projects } from "@/data/projects";

// Tools we reach for most — chosen per project (scrolling stack ribbon).
const STACK = [
  "Next.js",
  "React",
  "TypeScript",
  "Tailwind CSS",
  "Astro",
  "Vite",
  "Stripe",
  "Clerk",
  "Neon Postgres",
  "Drizzle ORM",
  "Vercel",
  "Hetzner",
  "Resend",
  "GraphQL",
  "hls.js",
  "Framer Motion",
  "Three.js",
  "Claude API",
  "Shopify",
];

/**
 * The homepage's content half — shared by the desktop 3D homepage (it follows
 * the "Click" finale) and the static mobile homepage. Server-rendered; the
 * only client islands are the reveal/count-up/spotlight details.
 */
export default function HomeContent({ id = "work" }: { id?: string }) {
  const rest = featuredWork.filter((p) => p.slug !== heroProject.slug);

  return (
    <div id={id} className="relative">
      {/* ---------------------------------------------------- Featured case study */}
      <section aria-label="Featured case study" className="shell scroll-mt-24 pb-16 pt-6 md:pb-24">
        <FeaturedCaseStudy />
      </section>

      {/* ---------------------------------------------------- Clients */}
      <Marquee />

      {/* ---------------------------------------------------- Selected work */}
      <section aria-labelledby="selected-work" className="py-24 md:py-32">
        <div className="shell">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div id="selected-work">
              <SectionHeading
                eyebrow="Selected work"
                title={
                  <>
                    More recent builds, <span className="text-glow">live today</span>.
                  </>
                }
                description="Streaming platforms, product sites and launches, each built around a clear business goal, then engineered to hold up."
              />
            </div>
            <Reveal delay={0.1}>
              <Link
                href="/projects"
                className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-accent transition-colors hover:text-accent-soft"
              >
                All {projects.length} projects
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Reveal>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 md:gap-6">
            {rest.map((p, i) => (
              <Reveal key={p.slug} delay={(i % 2) * 0.06}>
                <ProjectCard project={p} index={i + 1} />
              </Reveal>
            ))}
            {/* Closing tile → the full archive */}
            <Reveal delay={0.06}>
              <Link
                href="/projects"
                className="group relative flex h-full min-h-[18rem] flex-col justify-between overflow-hidden rounded-[1.25rem] border border-dashed border-white/[0.14] bg-white/[0.015] p-7 transition-colors duration-500 hover:border-accent/40 md:p-9"
              >
                <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(60%_60%_at_80%_20%,#000,transparent)]" />
                <div className="relative flex -space-x-3">
                  {projects.slice(0, 6).map((p) => (
                    <span
                      key={p.slug}
                      className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-ink-950 bg-ink-800"
                    >
                      <Image src={p.image.src} alt="" fill sizes="48px" className="object-cover object-top" />
                    </span>
                  ))}
                </div>
                <div className="relative">
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-haze/60">
                    The full archive
                  </p>
                  <p className="display mt-3 font-display text-2xl font-bold text-white md:text-3xl">
                    See all {projects.length} projects
                  </p>
                  <p className="mt-2 max-w-sm text-sm text-haze">
                    Products, platforms, launch sites and landing pages, with deep case studies for the recent work.
                  </p>
                  <span className="mt-6 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white transition-all duration-300 group-hover:border-accent group-hover:bg-accent group-hover:text-ink-950">
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </div>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- Capabilities */}
      <section aria-labelledby="capabilities" className="border-y border-white/[0.05] bg-white/[0.012] py-24 md:py-32">
        <div className="shell">
          <div id="capabilities">
            <SectionHeading
              eyebrow="What we build"
              title={
                <>
                  From a landing page to a{" "}
                  <span className="text-glow">whole product</span>.
                </>
              }
              description="Design and engineering as one system, and every capability below is backed by something live you can open today."
            />
          </div>
          <div className="mt-14">
            <Capabilities />
          </div>
        </div>

        {/* Stack ribbon */}
        <div className="mt-16 md:mt-20" aria-label="Tools we use">
          <p className="shell mb-6 font-mono text-[11px] uppercase tracking-[0.22em] text-haze/50">
            The stack, chosen per project
          </p>
          <div className="group relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
            <ul className="flex shrink-0 animate-marquee items-center gap-3 pr-3 [--marquee-duration:60s] group-hover:[animation-play-state:paused] motion-reduce:animate-none">
              {[...STACK, ...STACK].map((s, i) => (
                <li
                  key={`${s}-${i}`}
                  aria-hidden={i >= STACK.length}
                  className="whitespace-nowrap rounded-full border border-white/[0.08] bg-ink-900/60 px-4 py-2 text-sm text-white/80"
                >
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- Process */}
      <Process />

      {/* ---------------------------------------------------- CTA */}
      <CTASection />
    </div>
  );
}
