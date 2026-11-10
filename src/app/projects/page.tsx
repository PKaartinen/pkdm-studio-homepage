import type { Metadata } from "next";
import Reveal from "@/components/ui/Reveal";
import ProjectCard from "@/components/ProjectCard";
import CTASection from "@/components/CTASection";
import FeaturedCaseStudy from "@/components/work/FeaturedCaseStudy";
import ProjectIndex from "@/components/work/ProjectIndex";
import CountUp from "@/components/work/CountUp";
import {
  projects,
  featuredWork,
  earlierWork,
  heroProject,
} from "@/data/projects";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Case studies from PKDM Studio: AI products, streaming platforms, members areas, payment funnels and launch sites, designed and engineered end to end.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  const recent = featuredWork.filter((p) => p.slug !== heroProject.slug);
  const live = projects.filter((p) => p.status === "Live").length;
  const own = projects.filter((p) => p.kind !== "Client project").length;

  const facts = [
    { value: String(projects.length), label: "Projects in the archive" },
    { value: String(live), label: "Live right now" },
    { value: String(own), label: "Own products & ventures" },
    { value: String(featuredWork.length), label: "Deep case studies" },
  ];

  return (
    <main id="main">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(60%_70%_at_50%_0%,#000,transparent)]" />
        <div className="shell relative pb-14 pt-36 md:pb-20 md:pt-44">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Projects
            </span>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="display mt-5 max-w-4xl font-display text-4xl font-bold leading-[1.04] tracking-tight text-white sm:text-5xl md:text-7xl">
              Products, platforms and sites,{" "}
              <span className="text-glow">shipped</span>.
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-haze">
              From a full AI product to streaming platforms, members areas and
              launch sites. Every project starts with a business goal, and every recent one has a deep case study showing how it was built.
            </p>
          </Reveal>
          <Reveal delay={0.14}>
            <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.06] md:grid-cols-4">
              {facts.map((f) => (
                <div key={f.label} className="flex flex-col-reverse justify-end gap-1 bg-ink-950/90 px-5 py-5 md:px-7">
                  <dt className="text-xs uppercase tracking-[0.14em] text-haze/80">{f.label}</dt>
                  <dd className="font-display text-3xl font-bold text-white">
                    <CountUp value={f.value} duration={900} />
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </header>

      {/* Featured case study */}
      <section aria-label="Featured case study" className="shell pb-20 md:pb-28">
        <FeaturedCaseStudy />
      </section>

      {/* Recent work */}
      <section aria-labelledby="recent" className="shell pb-20 md:pb-28">
        <div className="mb-10 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <Reveal>
            <h2 id="recent" className="display font-display text-3xl font-bold text-white md:text-4xl">
              Recent work
            </h2>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="max-w-md text-sm text-haze">
              Each card opens a full case study: scope, architecture, mobile
              screens and the whole page in one scroll.
            </p>
          </Reveal>
        </div>
        <div className="grid gap-5 md:grid-cols-2 md:gap-6">
          {recent.map((project, i) => (
            <Reveal key={project.slug} delay={(i % 2) * 0.05}>
              <ProjectCard project={project} priority={i < 2} index={i + 1} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Earlier work */}
      <section aria-labelledby="earlier" className="shell pb-20 md:pb-28">
        <div className="mb-10 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <Reveal>
            <h2 id="earlier" className="display font-display text-3xl font-bold text-white md:text-4xl">
              Earlier work
            </h2>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="max-w-md text-sm text-haze">
              Landing pages and brand sites from before the studio's move to a
              fully custom stack.
            </p>
          </Reveal>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {earlierWork.map((project, i) => (
            <Reveal key={project.slug} delay={(i % 3) * 0.05}>
              <ProjectCard project={project} showSummary={false} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Index */}
      <section aria-labelledby="index" className="shell pb-8">
        <Reveal>
          <h2 id="index" className="display mb-8 font-display text-3xl font-bold text-white md:text-4xl">
            The index
          </h2>
        </Reveal>
        <ProjectIndex
          rows={projects.map((p) => ({
            slug: p.slug,
            name: p.name,
            category: p.category,
            kind: p.kind,
            year: p.year,
            status: p.status,
            accent: p.accent,
            image: { src: p.image.src, width: p.image.width, height: p.image.height },
          }))}
        />
      </section>

      <CTASection />
    </main>
  );
}
