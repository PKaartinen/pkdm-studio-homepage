import Image from "next/image";
import Link from "next/link";
import { navLinks, socialLinks, site } from "@/data/site";
import { featuredWork } from "@/data/projects";
import { socialIcons } from "./ui/icons";
import { BackToTop, LocalTime } from "./FooterExtras";

// Only keep social entries that have a real, non-empty http(s) URL.
function validSocials() {
  return socialLinks.filter((s) => {
    const href = s.href?.trim();
    if (!href) return false;
    try {
      const u = new URL(href);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  });
}

function ColTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-haze/50">
      {children}
    </h2>
  );
}

export default function Footer() {
  const socials = validSocials();

  return (
    <footer className="relative overflow-hidden border-t border-white/5 pt-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-accent-deep/10 blur-[120px]"
      />
      <div className="shell relative">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_1fr_1.1fr]">
          {/* Brand */}
          <div className="max-w-sm">
            <Image
              src="/logo/wordmark.svg"
              alt="PKDM Studio"
              width={150}
              height={54}
              className="h-9 w-auto"
            />
            <p className="mt-5 text-sm leading-relaxed text-haze">
              A founder-led web design & development studio. We build unique,
              conversion-focused websites and products, from marketing sites
              to AI web apps, members areas and payment funnels.
            </p>
            <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-white/85">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Taking on new projects
            </p>

            {/* Social row renders ONLY when valid links exist */}
            {socials.length > 0 && (
              <ul className="mt-6 flex items-center gap-3">
                {socials.map((s) => {
                  const Icon = socialIcons[s.platform];
                  if (!Icon) return null;
                  return (
                    <li key={s.platform}>
                      <a
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`PKDM Studio on ${s.platform}`}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-haze transition-colors hover:border-accent-soft/40 hover:text-white"
                      >
                        <Icon />
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <nav aria-label="Footer">
            <ColTitle>Navigate</ColTitle>
            <ul className="mt-5 flex flex-col gap-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-haze transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/contact" className="text-sm text-haze transition-colors hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <ColTitle>Recent work</ColTitle>
            <ul className="mt-5 flex flex-col gap-3">
              {featuredWork.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/projects/${p.slug}`}
                    className="group inline-flex items-center gap-2.5 text-sm text-haze transition-colors hover:text-white"
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full opacity-70 transition-opacity group-hover:opacity-100"
                      style={{ background: p.accent }}
                    />
                    {p.name}
                    <span className="text-xs text-haze/40">{p.category}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <ColTitle>Studio</ColTitle>
            <address className="mt-5 flex flex-col gap-3 text-sm not-italic text-haze">
              <a
                href={`mailto:${site.email}`}
                className="text-white transition-colors hover:text-accent-soft"
              >
                {site.email}
              </a>
              <span>{site.address}</span>
              <span className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-haze/60" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                Local time <LocalTime /> (EET)
              </span>
              <span className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-haze/60" fill="none" aria-hidden="true">
                  <path d="M4 6h16v10H8l-4 4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                </svg>
                Replies within 24 hours
              </span>
            </address>
          </div>
        </div>

        {/* Big wordmark line */}
        <p
          aria-hidden="true"
          className="display mt-20 select-none bg-gradient-to-b from-white/[0.09] to-transparent bg-clip-text text-center font-display text-[17vw] font-bold leading-[0.8] tracking-tight text-transparent lg:text-[13.5rem]"
        >
          PKDM Studio
        </p>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/5 py-8 text-xs text-haze/60 sm:flex-row">
          <p>© 2026 {site.legalEntity}. All rights reserved.</p>
          <p className="hidden md:block">Designed & built by PKDM Studio.</p>
          <BackToTop />
        </div>
      </div>
    </footer>
  );
}
