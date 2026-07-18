import Link from "next/link";
import SectionHeading from "../ui/SectionHeading";
import Reveal from "../ui/Reveal";
import { ArrowUpRight } from "../ui/icons";
import { insights } from "@/data/content";

export default function Insights() {
  return (
    <section id="insights" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="shell">
        <SectionHeading
          eyebrow="Insights"
          title={
            <>
              Notes on building{" "}
              <span className="text-glow">sites that perform</span>.
            </>
          }
          description="Practical thinking on design, conversion, and modern web development — no fluff."
        />

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {insights.map((post, i) => (
            <Reveal key={post.slug} delay={i * 0.07}>
              <Link
                href={`/insights/${post.slug}`}
                className="group flex h-full flex-col justify-between gap-8 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-7 transition-colors duration-300 hover:border-accent/25"
              >
                <div>
                  <span className="inline-block rounded-full border border-accent-soft/20 bg-accent/5 px-3 py-1 text-xs font-medium uppercase tracking-wide text-accent-soft">
                    {post.tag}
                  </span>
                  <h3 className="mt-5 font-display text-lg font-semibold leading-snug text-white">
                    {post.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-haze">
                    {post.excerpt}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                  Read more
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
