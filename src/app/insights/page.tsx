import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/ui/Reveal";
import CTASection from "@/components/CTASection";
import { ArrowUpRight } from "@/components/ui/icons";
import { insights } from "@/data/content";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "Practical thinking on web design, conversion, and modern web development from PKDM Studio — no fluff.",
  alternates: { canonical: "/insights" },
};

export default function InsightsPage() {
  return (
    <main id="main">
      <PageHero
        eyebrow="Insights"
        title={
          <>
            Notes on building{" "}
            <span className="text-glow">sites that perform</span>.
          </>
        }
        description="Practical thinking on design, conversion, and modern web development — written for business owners, not just designers."
      />

      <section className="shell pb-8">
        <div className="grid gap-5 md:grid-cols-3">
          {insights.map((post, i) => (
            <Reveal key={post.slug} delay={i * 0.07}>
              <Link
                href={`/insights/${post.slug}`}
                className="group flex h-full flex-col justify-between gap-8 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-7 transition-colors duration-300 hover:border-accent/25"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="inline-block rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-medium uppercase tracking-wide text-accent">
                      {post.tag}
                    </span>
                    <span className="text-xs text-haze/60">{post.readTime}</span>
                  </div>
                  <h2 className="mt-5 text-lg font-semibold leading-snug tracking-tight text-white">
                    {post.title}
                  </h2>
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
      </section>

      <CTASection />
    </main>
  );
}
