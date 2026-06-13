import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/ui/Reveal";
import CTASection from "@/components/CTASection";
import { ArrowRight } from "@/components/ui/icons";
import { insights, getInsight } from "@/data/content";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return insights.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = getInsight(slug);
  if (!post) return { title: "Article not found" };
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/insights/${post.slug}` },
  };
}

export default async function InsightPage({ params }: Params) {
  const { slug } = await params;
  const post = getInsight(slug);
  if (!post) notFound();

  return (
    <main id="main">
      <article className="shell pt-36 pb-10 md:pt-44">
        <Reveal>
          <Link
            href="/insights"
            className="inline-flex items-center gap-1.5 text-sm text-haze transition-colors hover:text-white"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            All insights
          </Link>
        </Reveal>

        <div className="mt-8 max-w-3xl">
          <Reveal>
            <div className="flex items-center gap-3">
              <span className="inline-block rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-medium uppercase tracking-wide text-accent">
                {post.tag}
              </span>
              <span className="text-xs text-haze/60">{post.readTime}</span>
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl">
              {post.title}
            </h1>
          </Reveal>

          <div className="mt-10 flex flex-col gap-6">
            {post.body.map((para, i) => (
              <Reveal key={i} delay={0.02 * i}>
                <p className="text-lg leading-relaxed text-haze">{para}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </article>

      <CTASection title="Want this done for your site?" description="We bake all of this into every build. Tell us about your project — reply within 24 hours." />
    </main>
  );
}
