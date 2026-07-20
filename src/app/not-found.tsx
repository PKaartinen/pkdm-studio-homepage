import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

// Branded 404 — people occasionally arrive on old/mistyped URLs; give them
// an obvious way back instead of the default bare Next.js screen.
export default function NotFound() {
  return (
    <main id="main" className="shell flex min-h-[100svh] flex-col items-start justify-center py-32">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">
        404 — Page not found
      </p>
      <h1 className="display mt-5 max-w-2xl font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
        This page doesn&apos;t exist — or it moved.
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-haze">
        The link you followed may be outdated. Everything we&apos;ve shipped is
        still here — just one step away.
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-ink-950 shadow-[0_8px_30px_-8px_rgba(105,237,254,0.65)] transition-colors duration-300 hover:bg-accent-soft"
        >
          Back to the homepage
        </Link>
        <Link
          href="/projects"
          className="text-sm font-semibold text-haze transition-colors hover:text-white"
        >
          View our work →
        </Link>
        <Link
          href="/contact"
          className="text-sm font-semibold text-haze transition-colors hover:text-white"
        >
          Contact us →
        </Link>
      </div>
    </main>
  );
}
