"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useToast } from "./Toaster";
import { Spinner } from "./ActionForm";

export type NavBadges = { leads?: number; leadsUrgent?: boolean; work?: number };

type NavLink = { href: string; label: string; icon: React.ReactNode; badge?: keyof NavBadges };

const I = (d: React.ReactNode) => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);

const groups: { label: string; links: NavLink[] }[] = [
  {
    label: "Business",
    links: [
      { href: "/admin", label: "Overview", icon: I(<><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>) },
      { href: "/admin/leads", label: "Leads", badge: "leads", icon: I(<><path d="M4 6h16v12H4z" /><path d="m4 7 8 6 8-6" /></>) },
      { href: "/admin/clients", label: "Clients", icon: I(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6" /></>) },
      { href: "/admin/projects", label: "Projects", icon: I(<><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></>) },
      { href: "/admin/work", label: "Work board", badge: "work", icon: I(<><rect x="3" y="4" width="5" height="16" rx="1.5" /><rect x="10" y="4" width="5" height="10" rx="1.5" /><rect x="17" y="4" width="4" height="13" rx="1.5" /></>) },
    ],
  },
  {
    label: "Analytics",
    links: [
      { href: "/admin/pages", label: "Pages & scroll", icon: I(<><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v4h4M9 12h7M9 16h5" /></>) },
      { href: "/admin/heatmap", label: "Heatmap", icon: I(<><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="7" opacity=".6" /><circle cx="12" cy="12" r="10" opacity=".3" /></>) },
      { href: "/admin/journeys", label: "Journeys", icon: I(<><circle cx="5" cy="18" r="2" /><circle cx="19" cy="6" r="2" /><path d="M7 18h6a4 4 0 0 0 0-8h-2a4 4 0 0 1 0-8h6" /></>) },
    ],
  },
];

function TrackingToggle() {
  const toast = useToast();
  const [excluded, setExcluded] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      setExcluded(localStorage.getItem("pkdm_no_track") === "1");
    } catch {
      setExcluded(false);
    }
  }, []);
  const toggle = () => {
    try {
      const next = !excluded;
      if (next) localStorage.setItem("pkdm_no_track", "1");
      else localStorage.removeItem("pkdm_no_track");
      setExcluded(next);
      toast({
        tone: "info",
        title: next ? "Your visits are now excluded" : "Your visits will be tracked again",
        description: next
          ? "Browsing the site from this browser won't show up in analytics."
          : "Use this when you want to test tracking yourself.",
      });
    } catch {
      toast({ tone: "error", title: "This browser blocks local storage, so the setting can't be saved." });
    }
  };
  return (
    <button
      onClick={toggle}
      role="switch"
      aria-checked={!!excluded}
      className="flex w-full items-center gap-2.5 rounded-lg border border-white/10 px-3 py-2 text-left text-xs text-haze transition-colors hover:text-white"
      title="When on, your visits from this browser are not recorded in analytics."
    >
      <span className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${excluded ? "bg-emerald-400/70" : "bg-white/15"}`}>
        <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${excluded ? "left-3.5" : "left-0.5"}`} />
      </span>
      {excluded === null ? "Checking…" : excluded ? "My visits excluded" : "Exclude my visits"}
    </button>
  );
}

function Badge({ n, urgent }: { n: number; urgent?: boolean }) {
  if (!n) return null;
  return (
    <span
      className={`ml-auto min-w-[1.25rem] rounded-full px-1.5 py-px text-center text-[10px] font-semibold tabular-nums ${
        urgent ? "bg-red-400/90 text-ink-950" : "bg-accent text-ink-950"
      }`}
    >
      {n > 99 ? "99+" : n}
    </span>
  );
}

export default function AdminNav({ badges = {} }: { badges?: NavBadges }) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [leaving, start] = useTransition();

  if (pathname === "/admin/login") return null;

  const logout = () =>
    start(async () => {
      try {
        await fetch("/api/admin/logout", { method: "POST" });
        router.push("/admin/login");
        router.refresh();
      } catch {
        toast({ tone: "error", title: "Couldn't log out. Check your connection." });
      }
    });

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  const badgeFor = (l: NavLink) =>
    l.badge === "leads" ? (
      <Badge n={badges.leads ?? 0} urgent={badges.leadsUrgent} />
    ) : l.badge === "work" ? (
      <Badge n={badges.work ?? 0} urgent />
    ) : null;

  return (
    <aside className="relative z-30 flex lg:sticky lg:top-0 w-full shrink-0 flex-col border-b border-white/[0.06] bg-ink-950/90 backdrop-blur-md lg:h-screen lg:w-60 lg:gap-6 lg:border-b-0 lg:border-r lg:bg-transparent lg:p-5 lg:backdrop-blur-none">
      <div className="flex items-center justify-between px-5 pt-4 lg:p-0">
        <Link href="/admin" className="font-display text-lg font-semibold text-white">
          PKDM <span className="text-accent">Admin</span>
        </Link>
        <div className="flex gap-2 lg:hidden">
          <Link href="/" className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-haze">
            Site
          </Link>
          <button onClick={logout} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-haze">
            {leaving ? <Spinner className="h-3 w-3" /> : "Log out"}
          </button>
        </div>
      </div>

      {/* Mobile: one scrolling row */}
      <nav className="no-scrollbar flex gap-1 overflow-x-auto px-4 pb-3 pt-3 lg:hidden" aria-label="Admin">
        {groups.flatMap((g) => g.links).map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors ${
              isActive(l.href) ? "bg-accent/15 text-accent" : "text-haze hover:text-white"
            }`}
          >
            {l.label}
            {badgeFor(l)}
          </Link>
        ))}
      </nav>

      {/* Desktop: grouped sidebar */}
      <nav className="hidden flex-1 flex-col gap-6 lg:flex" aria-label="Admin">
        {groups.map((g) => (
          <div key={g.label}>
            <p className="mb-2 px-3 text-[11px] uppercase tracking-widest text-haze/60">{g.label}</p>
            <ul className="space-y-0.5">
              {g.links.map((l) => {
                const active = isActive(l.href);
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                        active ? "bg-accent/10 text-accent" : "text-haze hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      {l.icon}
                      {l.label}
                      {badgeFor(l)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="hidden space-y-2 lg:block">
        <TrackingToggle />
        <div className="flex gap-2">
          <Link
            href="/"
            className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-center text-xs text-haze transition-colors hover:text-white"
          >
            View site
          </Link>
          <button
            onClick={logout}
            disabled={leaving}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-haze transition-colors hover:border-red-400/40 hover:text-red-300"
          >
            {leaving ? <Spinner className="h-3 w-3" /> : null}
            Log out
          </button>
        </div>
      </div>
    </aside>
  );
}
