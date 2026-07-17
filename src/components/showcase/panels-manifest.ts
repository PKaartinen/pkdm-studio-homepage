// ---------------------------------------------------------------------------
// T-310 integration — the SINGLE in-app source for Act 2 work-panel assets.
// The manifest (public/showcase/panels/manifest.json, committed in T-310) is
// script-generated from src/data/projects.ts: tags are verbatim
// `name — category`, textures ≤1024px longest edge, GPU budget logged.
//
// This module imports that manifest and VERIFIES it against the canonical
// projects data (config.featuredProjects) — a mismatch throws at module
// evaluation, so tags can never silently drift from projects.ts
// (script-diffed, not eyeballed).
// ---------------------------------------------------------------------------

import manifest from "../../../public/showcase/panels/manifest.json";
import { featuredProjects, panelTag } from "./config";

export type PanelAsset = {
  slug: string;
  tag: string;
  name: string;
  category: string;
  file: string;
  width: number;
  height: number;
};

const panels: PanelAsset[] = manifest.panels;

// --- Verification against canonical projects.ts (F-6: the six featured) ----
if (panels.length !== featuredProjects.length) {
  throw new Error(
    `Panel manifest count ${panels.length} != featured projects ${featuredProjects.length}`
  );
}
for (const p of panels) {
  const project = featuredProjects.find((f) => f.slug === p.slug);
  if (!project) throw new Error(`Panel manifest slug not featured: ${p.slug}`);
  const expected = panelTag(project);
  if (p.tag !== expected) {
    throw new Error(
      `Panel tag drift for ${p.slug}: manifest "${p.tag}" != projects.ts "${expected}"`
    );
  }
  if (Math.max(p.width, p.height) > 1024) {
    throw new Error(`Panel texture over 1024px: ${p.slug} (${p.width}x${p.height})`);
  }
}

/** The six featured-project panels, manifest (== projects.ts) order. */
export const PANELS: readonly PanelAsset[] = panels;

/** Slug of the one panel with an outbound link (F-4). */
export const CLEARPEN_SLUG = "clearpen";
