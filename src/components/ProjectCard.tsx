import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "./ui/icons";
import { displayUrl, type Project } from "@/data/projects";
import { BrowserBar } from "./work/Frames";

/**
 * Project card used on the homepage, /projects and "next project" rails.
 *
 * Details that reward a hover (desktop): the screenshot glides down to peek
 * below the fold, the project's own brand colour glows behind the card, and
 * the phone capture rises in from the corner. On touch the card is a clean,
 * fully-legible tile — nothing important is hover-only.
 */
export default function ProjectCard({
  project,
  priority = false,
  showSummary = true,
  index,
}: {
  project: Project;
  priority?: boolean;
  showSummary?: boolean;
  index?: number;
}) {
  const hasLink = project.url.trim() !== "";
  const host = hasLink ? displayUrl(project.url) : undefined;

  return (
    <article
      className="project-card group relative h-full"
      style={{ "--card-accent": project.accent } as React.CSSProperties}
    >
      {/* Brand-colour glow (sits behind the card, fades in on hover) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-[1.35rem] opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-100"
        style={{ background: `radial-gradient(60% 50% at 50% 40%, ${project.accent}33, transparent 70%)` }}
      />

      <div className="relative flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-white/[0.08] bg-ink-900/70 transition-colors duration-500 group-hover:border-white/[0.16]">
        <Link
          href={`/projects/${project.slug}`}
          className="relative block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
          aria-label={`${project.name} — read the case study`}
        >
          <BrowserBar url={host} compact />
          <div className="relative aspect-[16/10] overflow-hidden bg-ink-800">
            <Image
              src={project.image.src}
              alt={project.image.alt}
              width={project.image.width}
              height={project.image.height}
              priority={priority}
              sizes="(max-width: 768px) 100vw, (max-width: 1240px) 50vw, 600px"
              className="h-full w-full object-cover object-top transition-transform duration-[1600ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-y-[-3%] group-hover:scale-[1.04]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/50 via-transparent to-transparent" />

            {/* Phone peek (desktop hover) */}
            {project.mobile && (
              <div className="pointer-events-none absolute -bottom-6 right-5 hidden w-[22%] translate-y-[40%] rotate-[4deg] opacity-0 transition-all duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-y-0 group-hover:rotate-0 group-hover:opacity-100 md:block">
                <div className="rounded-[1.1rem] border border-white/20 bg-black p-[3px] shadow-2xl">
                  <div className="relative aspect-[390/844] overflow-hidden rounded-[0.9rem]">
                    <Image
                      src={project.mobile.src}
                      alt=""
                      fill
                      sizes="140px"
                      className="object-cover object-top"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Status / kind chips */}
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
              <StatusChip status={project.status} />
              {project.hero && (
                <span className="rounded-full border border-accent/30 bg-ink-950/75 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent backdrop-blur">
                  Featured case study
                </span>
              )}
            </div>
          </div>
        </Link>

        <div className="flex flex-1 flex-col gap-3 p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <Link href={`/projects/${project.slug}`} className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-haze/60">
                {typeof index === "number" && (
                  <span className="mr-2 text-accent-soft/80">{String(index + 1).padStart(2, "0")}</span>
                )}
                {project.kind} · {project.year}
              </p>
              <h3 className="mt-1.5 truncate text-lg font-semibold tracking-tight text-white md:text-xl">
                {project.name}
              </h3>
              <p className="truncate text-sm text-haze">{project.category}</p>
            </Link>

            <div className="flex shrink-0 items-center gap-2">
              {hasLink && (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit ${project.name} live site (opens in a new tab)`}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/80 transition-all duration-300 hover:border-accent/60 hover:bg-accent hover:text-ink-950"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              )}
              <Link
                href={`/projects/${project.slug}`}
                tabIndex={-1}
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-white transition-all duration-300 group-hover:bg-white group-hover:text-ink-950"
              >
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {showSummary && (
            <p className="line-clamp-2 text-sm leading-relaxed text-haze/90">
              {project.summary}
            </p>
          )}

          <ul className="mt-auto flex flex-wrap gap-1.5 pt-1">
            {project.services.slice(0, 3).map((s) => (
              <li
                key={s}
                className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[11px] text-haze/90"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

export function StatusChip({ status }: { status: Project["status"] }) {
  if (status === "Archive") return null;
  const live = status === "Live";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-ink-950/75 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/90 backdrop-blur">
      <span className="relative flex h-1.5 w-1.5">
        {live && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
        )}
        <span
          className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
            live ? "bg-emerald-400" : "bg-amber-300"
          }`}
        />
      </span>
      {status}
    </span>
  );
}
