import Reveal from "./Reveal";

type Props = {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  align?: "left" | "center";
};

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: Props) {
  const alignment =
    align === "center" ? "items-center text-center mx-auto" : "items-start";
  return (
    <div className={`flex max-w-2xl flex-col gap-4 ${alignment}`}>
      <Reveal>
        <span className="inline-flex items-center gap-2 rounded-full border border-accent-soft/20 bg-accent/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-accent-soft">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-soft" />
          {eyebrow}
        </span>
      </Reveal>
      <Reveal delay={0.05}>
        <h2 className="font-display text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-[2.75rem]">
          {title}
        </h2>
      </Reveal>
      {description && (
        <Reveal delay={0.1}>
          <p className="text-base leading-relaxed text-haze sm:text-lg">
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
}
