import type { MetadataRoute } from "next";
import { site } from "@/data/site";
import { projects } from "@/data/projects";
import { insights } from "@/data/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = [
    "",
    "/about",
    "/services",
    "/projects",
    "/insights",
    "/contact",
  ].map((path) => ({
    url: `${site.url}${path}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const projectRoutes = projects.map((p) => ({
    url: `${site.url}/projects/${p.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const insightRoutes = insights.map((i) => ({
    url: `${site.url}/insights/${i.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...projectRoutes, ...insightRoutes];
}
