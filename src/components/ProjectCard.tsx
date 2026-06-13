import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "./ui/icons";
import type { Project } from "@/data/projects";

/**
 * Shared project card used on the homepage teaser and the /projects page.
 *
 * The thumbnail uses a wide aspect ratio with `object-top`, so the full width
 * of every screenshot is preserved (no side cropping) and only the lower
 * portion is trimmed — keeping each site's hero in view.
 */
export default function ProjectCard({
  project,
  priority = false,
}: {
  project: Project;
  priority?: boolean;
}) {
  const hasLink = project.url.trim() !== "";

  return (
    <article className="group relative h-full overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-800/40 transition-all duration-300 hover:border-accent/30">
      <Link
        href={`/projects/${project.slug}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
        aria-label={`View ${project.name} case study`}
      >
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image
            src={project.image.src}
            alt={`${project.name} — ${project.category}`}
            width={project.image.width}
            height={project.image.height}
            priority={priority}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="h-full w-full object-cover object-top transition-transform duration-[1200ms] ease-out will-change-transform group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent" />
        </div>
      </Link>

      <div className="flex items-center justify-between gap-3 p-5">
        <Link href={`/projects/${project.slug}`} className="min-w-0">
          <h3 className="truncate text-base font-semibold tracking-tight text-white md:text-lg">
            {project.name}
          </h3>
          <p className="truncate text-sm text-haze">{project.category}</p>
        </Link>

        {hasLink && (
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visit ${project.name} live site (opens in a new tab)`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/80 transition-all duration-300 hover:border-accent/60 hover:bg-accent hover:text-ink-950"
          >
            <ArrowUpRight className="h-4 w-4" />
          </a>
        )}
      </div>
    </article>
  );
}
