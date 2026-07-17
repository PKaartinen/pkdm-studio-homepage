// ---------------------------------------------------------------------------
// /showcase canonical copy config — SINGLE SOURCE for every string the
// showcase renders. Spec: project-specs/pkdm-3d-showcase-spec.md §2c.
//
// Rules (binding):
//   - Components NEVER type copy strings; they import from here.
//   - Everything that exists in src/data/* is RE-EXPORTED (no duplication).
//   - Lines whose source of truth is outside the repo (voice.md / Brand & Ops
//     Manual / live-site section headings) are defined ONCE here, verbatim,
//     with their source noted. This file is their in-repo canonical home.
//   - NO pricing. NO invented metrics/clients/testimonials.
// ---------------------------------------------------------------------------

import { pillars, stats } from "@/data/content";
import { projects } from "@/data/projects";
import { site, socialLinks } from "@/data/site";

// Re-exports from src/data/* (canonical sources — do not duplicate)
export { pillars, stats, projects, site, socialLinks };

const pillarByTitle = (title: string) => {
  const p = pillars.find((p) => p.title === title);
  if (!p) throw new Error(`Canonical pillar missing: ${title}`);
  return p;
};

/** The six featured projects, equal treatment (F-6). Tags are `name — category` verbatim. */
export const featuredProjects = projects.filter((p) => p.featured);
export const panelTag = (p: { name: string; category: string }) =>
  `${p.name} — ${p.category}`;

// --- Hero (source: Hero.tsx / voice.md) ------------------------------------
export const hero = {
  /** H1, two lines: "Websites built / to convert." */
  h1Line1: "Websites built",
  h1Line2: "to convert.",
  /** The word that refracts through the glass (exact trailing word of the H1). */
  refractedWord: "convert.",
  sub: "Your website should do more than look pretty. We design and build unique, conversion-focused Webflow sites that build trust and turn visitors into customers.",
  eyebrow: "Founder-led web design & Webflow studio",
  reassurance:
    "Get a reply within 24 hours — straight from the person doing the work.",
  cta: "Let's talk about your website",
} as const;

// Mono annotations pinned to the 3D object (spec §3.1 — derived from hero lines)
export const heroAnnotations = {
  founderLed: "FOUNDER-LED — WEB DESIGN & WEBFLOW STUDIO",
  reply: "REPLY — WITHIN 24 HOURS",
} as const;

// --- Act 1 — Focus (source: Brand & Ops Manual / voice.md + content.ts pillars)
export const act1 = {
  headline:
    "Your website shouldn't just look good — it should answer 'why you?' in under 5 seconds.",
  /** In-canvas focus phrase — exact substring of the headline. */
  focusPhrase: "why you?",
  pillar: pillarByTitle("Strategic Clarity"),
  annotation: "UNDER 5 SECONDS",
} as const;

// --- Act 2 — The Work (source: Projects.tsx SectionHeading + projects.ts)
export const act2 = {
  headline: "Sites we've designed and shipped.",
  subline:
    "A selection of real client projects — each built around the customer journey and a clear business goal.",
  /** ClearPen panel outbound link — always the homepage (F-4). */
  clearpenUrl: "https://clearpen.ai",
} as const;

// --- Act 3 — The Build (source: content.ts pillars + stats + company.md)
export const act3 = {
  pillar: pillarByTitle("Reliable Webflow Systems"),
  stats,
  /** Exact substring of the core belief line (company.md). */
  annotation: "A 24/7 SALES REP",
} as const;

// --- Finale — The Click (source: Contact.tsx SectionHeading + content.ts + hero)
export const finale = {
  headline: "Need to start a project?",
  pillar: pillarByTitle("Trust-First Design"),
  reassurance: hero.reassurance,
  cta: hero.cta,
} as const;
