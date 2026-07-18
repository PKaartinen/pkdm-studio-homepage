import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/ui/Reveal";
import ProjectCard from "@/components/ProjectCard";
import CTASection from "@/components/CTASection";
import { projects } from "@/data/projects";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Real client work from PKDM Studio — conversion-focused websites and landing pages, designed and engineered end to end.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  return (
    <main id="main">
      <PageHero
        eyebrow="Projects"
        title={
          <>
            Real work, <span className="text-glow">real results</span>.
          </>
        }
        description="Every project starts with a business goal and ends with a site built to reach it. Here's a selection of recent client work."
      />

      <section className="shell pb-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => (
            <Reveal key={project.slug} delay={(i % 3) * 0.05}>
              <ProjectCard project={project} priority={i < 3} />
            </Reveal>
          ))}
        </div>
      </section>

      <CTASection />
    </main>
  );
}
