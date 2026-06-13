import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/ui/Reveal";
import MagneticButton from "@/components/ui/MagneticButton";
import CTASection from "@/components/CTASection";
import { ArrowUpRight, ArrowRight } from "@/components/ui/icons";
import { projects, getProject } from "@/data/projects";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return { title: "Project not found" };
  return {
    title: `${project.name} — ${project.category}`,
    description: project.summary,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      title: `${project.name} — PKDM Studio`,
      description: project.summary,
      images: [{ url: project.image.src }],
    },
  };
}

export default async function ProjectPage({ params }: Params) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const hasLink = project.url.trim() !== "";
  const idx = projects.findIndex((p) => p.slug === project.slug);
  const next = projects[(idx + 1) % projects.length];

  return (
    <main id="main">
      <header className="shell pt-36 pb-10 md:pt-44 md:pb-14">
        <Reveal>
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-sm text-haze transition-colors hover:text-white"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            All projects
          </Link>
        </Reveal>

        <div className="mt-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Reveal>
              <span className="text-sm font-medium uppercase tracking-[0.18em] text-accent">
                {project.category}
              </span>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
                {project.name}
              </h1>
            </Reveal>
          </div>
          {hasLink && (
            <Reveal delay={0.1}>
              <MagneticButton
                href={project.url}
                ariaLabel={`Visit ${project.name} live site (opens in a new tab)`}
              >
                Visit live site
                <ArrowUpRight className="h-4 w-4" />
              </MagneticButton>
            </Reveal>
          )}
        </div>
      </header>

      {/* Hero image */}
      <section className="shell">
        <Reveal>
          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-800/40">
            <Image
              src={project.image.src}
              alt={`${project.name} — ${project.category}`}
              width={project.image.width}
              height={project.image.height}
              priority
              sizes="(max-width: 1240px) 100vw, 1200px"
              className="h-auto w-full"
            />
          </div>
        </Reveal>
      </section>

      {/* Overview */}
      <section className="shell py-16 md:py-20">
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr]">
          <div>
            <Reveal>
              <p className="text-xl font-medium leading-relaxed text-white md:text-2xl">
                {project.summary}
              </p>
            </Reveal>
            <Reveal delay={0.06}>
              <p className="mt-6 leading-relaxed text-haze">
                {project.description}
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-7">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-haze/60">
                What we did
              </h2>
              <ul className="mt-4 flex flex-col gap-3">
                {project.services.map((s) => (
                  <li key={s} className="flex items-center gap-3 text-sm text-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Gallery */}
      {project.gallery.length > 0 && (
        <section className="shell pb-8">
          <div className="flex flex-col gap-5">
            {project.gallery.map((g, i) => (
              <Reveal key={g.src} delay={(i % 2) * 0.05}>
                <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-800/40">
                  <Image
                    src={g.src}
                    alt={`${project.name} screenshot ${i + 2}`}
                    width={g.width}
                    height={g.height}
                    loading="lazy"
                    sizes="(max-width: 1240px) 100vw, 1200px"
                    className="h-auto w-full"
                  />
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Next project */}
      <section className="shell py-16">
        <Link
          href={`/projects/${next.slug}`}
          className="group flex items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 transition-colors hover:border-accent/25 md:p-8"
        >
          <div>
            <span className="text-xs uppercase tracking-[0.18em] text-haze/60">
              Next project
            </span>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-white md:text-2xl">
              {next.name}
            </h2>
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 text-white transition-all group-hover:border-accent/60 group-hover:bg-accent group-hover:text-ink-950">
            <ArrowRight className="h-5 w-5" />
          </span>
        </Link>
      </section>

      <CTASection />
    </main>
  );
}
