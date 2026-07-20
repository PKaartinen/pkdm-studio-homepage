import type { Metadata } from "next";
import Hero from "@/components/sections/Hero";
import Marquee from "@/components/sections/Marquee";
import Services from "@/components/sections/Services";
import Projects from "@/components/sections/Projects";
import Pillars from "@/components/sections/Pillars";
import Process from "@/components/sections/Process";
import Insights from "@/components/sections/Insights";
import Testimonials from "@/components/sections/Testimonials";
import Contact from "@/components/sections/Contact";
import OldHomeTour from "@/components/OldHomeTour";

// ---------------------------------------------------------------------------
// Preview of the retired homepage (the pre-"The Click" design), kept live at a
// stable route for a before/after comparison against the current 3D homepage.
// It reuses the original section stack (Hero → … → Contact) that still ships
// in src/components/sections/. Add ?tour=1 to auto-scroll it top→bottom over
// the same duration as the new homepage's ?tour=1 (OldHomeTour + the shared
// showcase/tour-timing), so a split-screen recording lines up start-to-finish.
// Noindex — it's an internal preview, not canonical content.
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Old Homepage Preview",
  description:
    "Preview of the previous PKDM Studio homepage design, kept for a before/after comparison against the current homepage.",
  alternates: { canonical: "/old-homepage-preview" },
  robots: { index: false, follow: false },
};

export default function OldHomepagePreview() {
  return (
    <>
      <OldHomeTour />
      <main id="main">
        <Hero />
        <Marquee />
        <Services />
        <Projects />
        <Pillars />
        <Process />
        <Insights />
        <Testimonials />
        <Contact />
      </main>
    </>
  );
}
