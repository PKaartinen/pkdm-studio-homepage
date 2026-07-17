import type { Metadata } from "next";
import { DM_Mono } from "next/font/google";
import { site, hero } from "@/components/showcase/config";

// DM Mono — annotations + loader counter (F-5 CONFIRMED by founder).
// next/font self-hosts the files at build time (no runtime Google request).
const dmMono = DM_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Showcase",
  description: hero.sub,
  // Route hygiene (spec §4): unlinked + noindex until founder decision F-3.
  robots: { index: false, follow: false },
  alternates: { canonical: `${site.url}/showcase` },
};

export default function ShowcaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`showcase-root ${dmMono.variable}`}>{children}</div>
  );
}
