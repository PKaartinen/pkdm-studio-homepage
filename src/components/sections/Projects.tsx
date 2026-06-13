"use client";

import Image from "next/image";
import SectionHeading from "../ui/SectionHeading";
import Reveal from "../ui/Reveal";
import MagneticButton from "../ui/MagneticButton";
import { ArrowUpRight, ArrowRight } from "../ui/icons";
import { projects, type Project } from "@/data/projects";

export default function Projects() {
  const featured = projects.filter((p) => p.featured);
  const secondary = projects.filter((p) => !p.featured);

  return (
    <section id="projects" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="shell">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Recent work"
            title={
              <>
                Sites we&apos;ve designed{" "}
                <span className="text-glow">and shipped</span>.
              </>
            }
            description="A selection of real client projects — each built around the customer journey and a clear business goal."
          />
          <Reveal>
            <MagneticButton href="#projects" variant="ghost">
              View all projects
              <ArrowRight className="h-4 w-4" />
            </MagneticButton>
          </Reveal>
        </div>

        {/* Featured */}
        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {featured.map((project, i) => (
            <Reveal key={project.name} delay={(i % 2) * 0.06}>
              <ProjectCard project={project} priority={i < 2} />
            </Reveal>
          ))}
        </div>

        {/* Secondary row */}
        {secondary.length > 0 && (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {secondary.map((project, i) => (
              <Reveal key={project.name} delay={(i % 4) * 0.05}>
                <ProjectCard project={project} compact />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ProjectCard({
  project,
  priority = false,
  compact = false,
}: {
  project: Project;
  priority?: boolean;
  compact?: boolean;
}) {
  const hasLink = project.url.trim() !== "";

  const inner = (
    <div className="group relative h-full overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-800/40 transition-all duration-300 hover:border-accent-soft/30">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={project.image}
          alt={`${project.name} — ${project.category}`}
          width={project.width}
          height={project.height}
          priority={priority}
          sizes={
            compact
              ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              : "(max-width: 768px) 100vw, 50vw"
          }
          className="h-full w-full object-cover object-top transition-transform duration-700 ease-out will-change-transform group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/10 to-transparent" />
      </div>

      <div className="flex items-center justify-between gap-3 p-5">
        <div className="min-w-0">
          <h3 className="truncate font-display text-base font-semibold text-white md:text-lg">
            {project.name}
          </h3>
          <p className="truncate text-sm text-haze/80">{project.category}</p>
        </div>
        {hasLink && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/80 transition-all duration-300 group-hover:border-accent-soft/50 group-hover:bg-accent group-hover:text-white">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </div>
  );

  if (hasLink) {
    return (
      <a
        href={project.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Visit ${project.name} (opens in a new tab)`}
        className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 rounded-2xl"
      >
        {inner}
      </a>
    );
  }

  return inner;
}
