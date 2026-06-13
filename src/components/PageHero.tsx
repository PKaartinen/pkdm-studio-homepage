import Reveal from "./ui/Reveal";

/**
 * Standard hero header for inner pages. Includes top padding to clear the
 * fixed nav.
 */
export default function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
}) {
  return (
    <header className="shell pt-36 pb-10 md:pt-44 md:pb-16">
      <Reveal>
        <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          {eyebrow}
        </span>
      </Reveal>
      <Reveal delay={0.05}>
        <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
          {title}
        </h1>
      </Reveal>
      {description && (
        <Reveal delay={0.1}>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-haze">
            {description}
          </p>
        </Reveal>
      )}
    </header>
  );
}
