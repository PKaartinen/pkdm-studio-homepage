import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/ui/Reveal";
import MagneticButton from "@/components/ui/MagneticButton";
import CTASection from "@/components/CTASection";
import ProjectCard, { StatusChip } from "@/components/ProjectCard";
import { ArrowUpRight, ArrowRight } from "@/components/ui/icons";
import { BrowserFrame, PhoneFrame } from "@/components/work/Frames";
import ScrollShot from "@/components/work/ScrollShot";
import Gallery from "@/components/work/Gallery";
import ChapterMedia from "@/components/work/ChapterMedia";
import CaseNav from "@/components/work/CaseNav";
import CountUp from "@/components/work/CountUp";
import { projects, getProject, displayUrl } from "@/data/projects";
import { site } from "@/data/site";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return { title: "Project not found" };
  return {
    title: `${project.name}: ${project.category} case study`,
    description: project.summary,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      title: `${project.name}, a PKDM Studio case study`,
      description: project.summary,
      images: [{ url: project.image.src, width: project.image.width, height: project.image.height }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.name}, a PKDM Studio case study`,
      description: project.summary,
      images: [project.image.src],
    },
  };
}

function SectionLabel({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-haze/70">
      <span className="text-accent-soft">{n}</span>
      <span className="h-px w-8 bg-white/15" />
      {children}
    </p>
  );
}

export default async function ProjectPage({ params }: Params) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const p = project;
  const hasLink = p.url.trim() !== "";
  const host = hasLink ? displayUrl(p.url) : undefined;
  const idx = projects.findIndex((x) => x.slug === p.slug);
  // Prev/next cycle within the same group (recent work vs earlier work)
  const group = projects.filter((x) => x.featured === p.featured);
  const gi = group.findIndex((x) => x.slug === p.slug);
  const next = group[(gi + 1) % group.length];
  const prev = group[(gi - 1 + group.length) % group.length];
  const related = projects
    .filter((x) => x.slug !== p.slug && x.featured)
    .slice(0, 3);

  // Section index (only sections that exist for this project)
  const nav = [
    { id: "overview", label: "Overview" },
    ...(p.scope ? [{ id: "scope", label: "What we built" }] : []),
    ...(p.chapters?.length ? [{ id: "story", label: "The build" }] : []),
    ...(p.full ? [{ id: "full-page", label: "Full page" }] : []),
    ...(p.phones?.length ? [{ id: "mobile", label: "Mobile" }] : []),
    ...(p.gallery.length ? [{ id: "screens", label: "Screens" }] : []),
    ...(p.highlights?.length ? [{ id: "engineering", label: "Under the hood" }] : []),
    ...(p.stack.length ? [{ id: "stack", label: "Stack" }] : []),
  ];

  let sectionNo = 0;
  const no = () => String(++sectionNo).padStart(2, "0");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: `${p.name}: ${p.category}`,
    description: p.summary,
    image: `${site.url}${p.image.src}`,
    url: `${site.url}/projects/${p.slug}`,
    creator: { "@type": "Organization", name: "PKDM Studio", url: site.url },
    dateCreated: p.year,
    keywords: p.services.join(", "),
    ...(hasLink ? { sameAs: p.url } : {}),
  };

  return (
    <main id="main" style={{ "--accent-project": p.accent } as React.CSSProperties}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ------------------------------------------------------------ Header */}
      <header className="relative">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute left-1/2 top-0 h-[38rem] w-[70rem] -translate-x-1/2 rounded-full opacity-60 blur-[140px]"
            style={{ background: `radial-gradient(50% 50% at 50% 50%, ${p.accent}2e, transparent 70%)` }}
          />
        </div>
        <div className="shell relative pb-12 pt-32 md:pb-16 md:pt-40">
          <Reveal>
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-haze">
              <Link href="/projects" className="inline-flex items-center gap-1.5 transition-colors hover:text-white">
                <ArrowRight className="h-4 w-4 rotate-180" />
                All projects
              </Link>
              <span className="text-white/20">/</span>
              <span className="text-white/80">{p.name}</span>
              <span className="ml-auto hidden font-mono text-xs text-haze/50 sm:inline">
                {String(idx + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
              </span>
            </nav>
          </Reveal>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <Reveal>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip status={p.status} />
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-haze">
                    {p.kind}
                  </span>
                  {p.hero && (
                    <span className="rounded-full border border-accent/30 bg-accent/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
                      Featured case study
                    </span>
                  )}
                </div>
              </Reveal>
              <Reveal delay={0.05}>
                <h1 className="display mt-5 font-display text-5xl font-bold leading-[1] tracking-tight text-white sm:text-6xl md:text-7xl">
                  {p.name}
                </h1>
              </Reveal>
              <Reveal delay={0.08}>
                <p className="mt-4 text-xl font-medium text-white/80 md:text-2xl">{p.category}</p>
              </Reveal>
              <Reveal delay={0.12}>
                <p className="mt-6 max-w-2xl text-base leading-relaxed text-haze md:text-lg">
                  {p.summary}
                </p>
              </Reveal>
            </div>

            <Reveal delay={0.1}>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 text-sm">
                <div className="col-span-2 flex flex-col gap-1">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-haze/60">Role</dt>
                  <dd className="text-white">{p.role}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-haze/60">Year</dt>
                  <dd className="text-white">{p.year}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-haze/60">Type</dt>
                  <dd className="text-white">{p.kind}</dd>
                </div>
                {hasLink && (
                  <div className="col-span-2 flex flex-col gap-3 border-t border-white/[0.06] pt-5">
                    <MagneticButton
                      href={p.url}
                      ariaLabel={`Visit ${p.name} live site (opens in a new tab)`}
                      className="self-start"
                    >
                      {p.status === "In preview" ? "Open the preview" : `Visit ${host}`}
                      <ArrowUpRight className="h-4 w-4" />
                    </MagneticButton>
                  </div>
                )}
              </dl>
            </Reveal>
          </div>
        </div>

        {/* Device hero */}
        <div className="shell relative pb-6">
          <Reveal>
            <div className="relative pb-[6%] pr-0 md:pr-[9%]">
              <BrowserFrame url={host} shot={p.image} priority sizes="(max-width: 1240px) 100vw, 1100px" />
              {p.mobile && (
                <div className="absolute -bottom-2 right-0 hidden w-[19%] md:block">
                  <PhoneFrame shot={p.mobile} priority sizes="220px" />
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </header>

      {nav.length > 2 && <CaseNav items={nav} accent={p.accent} />}

      {/* ------------------------------------------------------------ Stats */}
      {p.stats && (
        <section aria-label="Key numbers" className="shell pt-14 md:pt-20">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.06] lg:grid-cols-4">
            {p.stats.map((s, i) => (
              <Reveal
                key={s.label}
                delay={i * 0.05}
                className="flex h-full flex-col-reverse justify-end gap-2 bg-ink-950 bg-gradient-to-b from-white/[0.03] to-transparent px-5 py-7 md:px-8 md:py-9"
              >
                <dt className="text-xs uppercase tracking-[0.14em] text-haze/80">{s.label}</dt>
                <dd className="font-display text-3xl font-bold text-white md:text-5xl">
                  <CountUp value={s.value} />
                </dd>
              </Reveal>
            ))}
          </dl>
        </section>
      )}

      {/* ------------------------------------------------------------ Overview */}
      <section id="overview" className="shell scroll-mt-40 py-20 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div className="lg:sticky lg:top-44 lg:self-start">
            <SectionLabel n={no()}>Overview</SectionLabel>
            <Reveal>
              <h2 className="display mt-5 font-display text-3xl font-bold leading-tight text-white md:text-4xl">
                The brief, the build and where it landed.
              </h2>
            </Reveal>
            <Reveal delay={0.05}>
              <ul className="mt-8 flex flex-wrap gap-2">
                {p.services.map((s) => (
                  <li key={s} className="rounded-full border border-white/[0.09] bg-white/[0.02] px-3 py-1.5 text-xs text-white/85">
                    {s}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <div className="flex flex-col gap-10">
            <Reveal>
              <p className="text-xl leading-relaxed text-white/90 md:text-2xl md:leading-relaxed">
                {p.description}
              </p>
            </Reveal>
            {[
              { k: "The challenge", v: p.challenge ? [p.challenge] : [] },
              { k: "The approach", v: p.approach ?? [] },
              { k: "The outcome", v: p.outcome ? [p.outcome] : [] },
            ]
              .filter((b) => b.v.length)
              .map((b, i) => (
                <Reveal key={b.k} delay={i * 0.04}>
                  <div className="grid gap-3 border-t border-white/[0.07] pt-7 md:grid-cols-[11rem_1fr] md:gap-8">
                    <h3 className="flex items-center gap-2 self-start pt-1 text-sm font-semibold text-white">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.accent }} />
                      {b.k}
                    </h3>
                    <div className="flex flex-col gap-4">
                      {b.v.map((para) => (
                        <p key={para.slice(0, 32)} className="leading-relaxed text-haze">
                          {para}
                        </p>
                      ))}
                    </div>
                  </div>
                </Reveal>
              ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Scope */}
      {p.scope && (
        <section id="scope" className="scroll-mt-40 border-y border-white/[0.05] bg-white/[0.012] py-20 md:py-28">
          <div className="shell">
            <SectionLabel n={no()}>What we built</SectionLabel>
            <Reveal>
              <h2 className="display mt-5 max-w-3xl font-display text-3xl font-bold leading-tight text-white md:text-4xl">
                {p.hero ? "Every layer, from the first pixel to the last API call." : "The full scope, end to end."}
              </h2>
            </Reveal>
            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {p.scope.map((s, i) => (
                <Reveal as="li" key={s.title} delay={(i % 3) * 0.05}>
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-900/60 p-6 transition-colors duration-500 hover:border-white/[0.16]">
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100"
                      style={{ background: `${p.accent}40` }}
                    />
                    <span className="font-mono text-[11px] text-haze/60">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="mt-4 text-lg font-semibold text-white">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-haze">{s.description}</p>
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ Chapters */}
      {p.chapters?.length ? (
        <section id="story" className="scroll-mt-40 py-20 md:py-28">
          <div className="shell">
            <SectionLabel n={no()}>The build</SectionLabel>
          </div>
          <div className="mt-6 flex flex-col gap-24 md:gap-32">
            {p.chapters.map((c, i) => {
              const flip = i % 2 === 1;
              const copy = (
                <div className={c.wide ? "max-w-3xl" : ""}>
                  <Reveal>
                    <p className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: p.accent }}>
                      {c.eyebrow}
                    </p>
                  </Reveal>
                  <Reveal delay={0.04}>
                    <h3 className="display mt-4 font-display text-2xl font-bold leading-tight text-white md:text-[2.1rem]">
                      {c.title}
                    </h3>
                  </Reveal>
                  {c.body.map((para, j) => (
                    <Reveal key={j} delay={0.08 + j * 0.03}>
                      <p className="mt-5 leading-relaxed text-haze md:text-[17px]">{para}</p>
                    </Reveal>
                  ))}
                  {c.bullets && (
                    <Reveal delay={0.12}>
                      <ul className="mt-7 flex flex-col gap-3">
                        {c.bullets.map((b) => (
                          <li key={b} className="flex items-start gap-3 text-sm text-white/85">
                            <svg viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true">
                              <path d="m3.5 8.5 3 3 6-7" fill="none" stroke={p.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {b}
                          </li>
                        ))}
                      </ul>
                    </Reveal>
                  )}
                </div>
              );
              return (
                <article key={c.title} className="shell">
                  {c.wide ? (
                    <div className="flex flex-col gap-10 md:gap-14">
                      {copy}
                      <Reveal delay={0.06}>
                        <ChapterMedia media={c.media} accent={p.accent} />
                      </Reveal>
                    </div>
                  ) : (
                    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                      <div className={flip ? "lg:order-2" : ""}>{copy}</div>
                      <Reveal delay={0.06} className={flip ? "lg:order-1" : ""}>
                        <ChapterMedia media={c.media} accent={p.accent} />
                      </Reveal>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------------------ Full page */}
      {p.full && (
        <section id="full-page" className="shell scroll-mt-40 py-20 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.6fr_1.4fr] lg:items-center lg:gap-16">
            <div>
              <SectionLabel n={no()}>Full page</SectionLabel>
              <Reveal>
                <h2 className="display mt-5 font-display text-3xl font-bold leading-tight text-white md:text-4xl">
                  The whole homepage, in one scroll.
                </h2>
              </Reveal>
              <Reveal delay={0.05}>
                <p className="mt-5 leading-relaxed text-haze">
                  Hover the window (or swipe inside it on a phone) to glide from
                  the hero to the footer: every section, exactly as it ships today.
                </p>
              </Reveal>
              <Reveal delay={0.08}>
                <p className="mt-6 font-mono text-xs text-haze/60">
                  {p.full.width} × {p.full.height.toLocaleString("en-US")} px · captured Nov 2026
                </p>
              </Reveal>
            </div>
            <Reveal delay={0.05}>
              <ScrollShot shot={p.full} url={host} />
            </Reveal>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ Mobile */}
      {p.phones?.length ? (
        <section id="mobile" className="scroll-mt-40 overflow-hidden py-20 md:py-28">
          <div className="shell">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <SectionLabel n={no()}>Mobile</SectionLabel>
                <Reveal>
                  <h2 className="display mt-5 font-display text-3xl font-bold leading-tight text-white md:text-4xl">
                    Designed for the phone first.
                  </h2>
                </Reveal>
              </div>
              <Reveal delay={0.05}>
                <p className="max-w-sm text-sm leading-relaxed text-haze">
                  Real captures at 390 px, the width most visitors actually arrive on.
                </p>
              </Reveal>
            </div>
            <div className="relative mt-14">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-[10%] top-1/3 h-1/2 rounded-full opacity-50 blur-[110px]"
                style={{ background: `${p.accent}33` }}
              />
              <div className="no-scrollbar relative -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 sm:mx-0 sm:grid sm:snap-none sm:gap-6 sm:overflow-visible sm:px-0"
                style={{ gridTemplateColumns: `repeat(${p.phones.length}, minmax(0, 1fr))` }}
              >
                {p.phones.map((s, i) => (
                  <Reveal key={s.src} delay={i * 0.07} className={`w-[64%] shrink-0 snap-center sm:w-auto ${i % 2 === 1 ? "sm:mt-12" : ""}`}>
                    <PhoneFrame shot={s} sizes="(max-width: 640px) 64vw, 280px" />
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------------------ Gallery */}
      {p.gallery.length > 0 && (
        <section id="screens" className="shell scroll-mt-40 py-20 md:py-24">
          <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <SectionLabel n={no()}>Screens</SectionLabel>
              <Reveal>
                <h2 className="display mt-5 font-display text-3xl font-bold leading-tight text-white md:text-4xl">
                  {p.featured ? "More from the build." : "Selected screens."}
                </h2>
              </Reveal>
            </div>
            <p className="text-sm text-haze/70">Click any screen to enlarge.</p>
          </div>
          <Gallery shots={p.gallery} url={host} />
        </section>
      )}

      {/* ------------------------------------------------------------ Engineering */}
      {p.highlights?.length ? (
        <section id="engineering" className="scroll-mt-40 border-y border-white/[0.05] bg-white/[0.012] py-20 md:py-28">
          <div className="shell">
            <SectionLabel n={no()}>Under the hood</SectionLabel>
            <Reveal>
              <h2 className="display mt-5 max-w-3xl font-display text-3xl font-bold leading-tight text-white md:text-4xl">
                The details nobody sees, and everybody feels.
              </h2>
            </Reveal>
            <div className="mt-12 grid gap-4 md:grid-cols-2">
              {p.highlights.map((h, i) => (
                <Reveal key={h.title} delay={(i % 2) * 0.05}>
                  <div className="flex h-full gap-5 rounded-2xl border border-white/[0.07] bg-ink-900/60 p-6 md:p-7">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border font-mono text-xs text-white"
                      style={{ borderColor: `${p.accent}55`, background: `${p.accent}14` }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="font-semibold text-white">{h.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-haze">{h.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------------------ Stack */}
      {p.stack.length > 0 && (
      <section id="stack" className="shell scroll-mt-40 py-20 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <SectionLabel n={no()}>Stack</SectionLabel>
            <Reveal>
              <h2 className="display mt-5 font-display text-3xl font-bold leading-tight text-white md:text-4xl">
                Built with
              </h2>
            </Reveal>
            <Reveal delay={0.05}>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-haze">
                The right tools for this job, chosen per project, never by habit.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.05}>
            <ul className="flex flex-wrap gap-2.5">
              {p.stack.map((s) => (
                <li
                  key={s}
                  className="rounded-xl border border-white/[0.09] bg-white/[0.025] px-4 py-2.5 text-sm text-white/90 transition-colors duration-300 hover:border-white/25"
                >
                  {s}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>
      )}

      {/* ------------------------------------------------------------ Hire us for this */}
      {p.hero && (
        <section className="shell pb-8">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-r from-accent/[0.07] via-ink-900 to-ink-900 p-8 md:p-12">
              <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
                    Available for a few projects a year
                  </p>
                  <h2 className="display mt-4 font-display text-2xl font-bold text-white md:text-3xl">
                    Want a product like this, built for you?
                  </h2>
                  <p className="mt-3 max-w-2xl leading-relaxed text-haze">
                    Full product builds covering design, members area, payments, funnels and AI pipelines, taken on selectively for founders
                    who need it done properly. Tell us what you&apos;re building.
                  </p>
                </div>
                <MagneticButton href="/contact">
                  Start the conversation
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </MagneticButton>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* ------------------------------------------------------------ Prev / next */}
      <section className="shell py-16">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { dir: "Previous", proj: prev },
            { dir: "Next", proj: next },
          ].map(({ dir, proj }) => (
            <Link
              key={dir}
              href={`/projects/${proj.slug}`}
              className={`group flex items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 transition-colors hover:border-white/20 md:p-8 ${
                dir === "Previous" ? "flex-row-reverse text-right md:flex-row-reverse" : ""
              }`}
            >
              <div className="min-w-0">
                <span className="text-xs uppercase tracking-[0.18em] text-haze/60">{dir} project</span>
                <h2 className="mt-2 truncate text-xl font-semibold tracking-tight text-white md:text-2xl">
                  {proj.name}
                </h2>
                <p className="truncate text-sm text-haze">{proj.category}</p>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 text-white transition-all group-hover:border-accent/60 group-hover:bg-accent group-hover:text-ink-950">
                <ArrowRight className={`h-5 w-5 ${dir === "Previous" ? "rotate-180" : ""}`} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ More work */}
      <section className="shell pb-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="display font-display text-2xl font-bold text-white md:text-3xl">More work</h2>
          <Link href="/projects" className="group inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent-soft">
            All projects
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {related.map((r) => (
            <Reveal key={r.slug}>
              <ProjectCard project={r} showSummary={false} />
            </Reveal>
          ))}
        </div>
      </section>

      <CTASection />
    </main>
  );
}
