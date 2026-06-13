import SectionHeading from "../ui/SectionHeading";
import Reveal from "../ui/Reveal";
import MagneticButton from "../ui/MagneticButton";
import ProjectCard from "../ProjectCard";
import { ArrowRight } from "../ui/icons";
import { projects } from "@/data/projects";

export default function Projects() {
  const featured = projects.filter((p) => p.featured).slice(0, 6);

  return (
    <section id="projects" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="shell">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Recent work"
            title={
              <>
                Sites we&apos;ve designed{" "}
                <span className="text-glow">and shipped</span>.
              </>
            }
            description="A selection of real client projects — each built around the customer journey and a clear business goal."
          />
          <Reveal>
            <MagneticButton href="/projects" variant="ghost">
              View all projects
              <ArrowRight className="h-4 w-4" />
            </MagneticButton>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {featured.map((project, i) => (
            <Reveal key={project.slug} delay={(i % 2) * 0.06}>
              <ProjectCard project={project} priority={i < 2} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
