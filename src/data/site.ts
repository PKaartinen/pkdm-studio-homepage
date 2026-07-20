// ---------------------------------------------------------------------------
// Central site configuration. Edit this file to update nav, contact details,
// and social links without touching component code.
// ---------------------------------------------------------------------------

export const site = {
  name: "PKDM Studio",
  descriptor: "Web Design & Development Studio",
  url: "https://www.pkdmstudio.com",
  // Inboxes that receive contact-form submissions (handled in ContactForm.tsx)
  email: "hello@pkdmstudio.com",
  address: "Juhkentali tn 8, 10132 Tallinn, Estonia",
  legalEntity: "PKDM Services OÜ",
} as const;

export const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Projects", href: "/projects" },
  { label: "Services", href: "/services" },
  { label: "Insights", href: "/insights" },
] as const;

// ---------------------------------------------------------------------------
// SOCIAL LINKS
// ---------------------------------------------------------------------------
// The studio's social profiles. Each entry only renders if `href` is a
// non-empty, valid URL. Leave this array empty (or leave an href blank) and
// NO social row is shown — no placeholder/dead links.
//
//   Supported `platform` values (used to pick the icon):
//   "linkedin" | "instagram" | "x" | "dribbble" | "behance" | "github" |
//   "youtube" | "tiktok"
//
// Example:
//   { platform: "linkedin", href: "https://linkedin.com/in/your-handle" },
// ---------------------------------------------------------------------------
// Founder-confirmed accounts (decision F-2, 2026-07-17):
export const socialLinks: { platform: string; href: string }[] = [
  { platform: "youtube", href: "https://www.youtube.com/@pkdmstudio" },
  { platform: "tiktok", href: "https://www.tiktok.com/@pkdmstudio.com" },
  { platform: "instagram", href: "https://www.instagram.com/pkdmstudio/" },
];
