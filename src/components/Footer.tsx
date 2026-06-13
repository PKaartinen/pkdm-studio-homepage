import Image from "next/image";
import Link from "next/link";
import { navLinks, socialLinks, site } from "@/data/site";
import { socialIcons } from "./ui/icons";

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

export default function Footer() {
  const socials = validSocials();

  return (
    <footer className="relative border-t border-white/5 py-16">
      <div className="shell">
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <Image
              src="/logo/wordmark.svg"
              alt="PKDM Studio"
              width={150}
              height={54}
              className="h-9 w-auto"
            />
            <p className="mt-5 text-sm leading-relaxed text-haze">
              A founder-led web design & Webflow development studio. We build
              unique, conversion-focused websites that build trust and are built
              to sell.
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
                        aria-label={s.platform}
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
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-haze/60">
              Navigate
            </h2>
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
            </ul>
          </nav>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-haze/60">
              Studio
            </h2>
            <address className="mt-5 flex flex-col gap-3 text-sm not-italic text-haze">
              <a
                href={`mailto:${site.email}`}
                className="transition-colors hover:text-white"
              >
                {site.email}
              </a>
              <span>{site.address}</span>
            </address>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-xs text-haze/60 sm:flex-row">
          <p>© 2026 PKDM Services. All rights reserved.</p>
          <p>Designed & built by PKDM Studio.</p>
        </div>
      </div>
    </footer>
  );
}
