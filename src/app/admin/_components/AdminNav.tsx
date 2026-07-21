"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const groups: { label: string; links: { href: string; label: string }[] }[] = [
  {
    label: "Analytics",
    links: [
      { href: "/admin", label: "Overview" },
      { href: "/admin/pages", label: "Pages & scroll" },
      { href: "/admin/heatmap", label: "Heatmap" },
      { href: "/admin/journeys", label: "Journeys" },
    ],
  },
  {
    label: "Business",
    links: [
      { href: "/admin/leads", label: "Leads" },
      { href: "/admin/clients", label: "Clients" },
      { href: "/admin/projects", label: "Projects" },
      { href: "/admin/work", label: "Work board" },
    ],
  },
];

function TrackingToggle() {
  const [excluded, setExcluded] = useState(false);
  useEffect(() => {
    try {
      setExcluded(localStorage.getItem("pkdm_no_track") === "1");
    } catch {}
  }, []);
  const toggle = () => {
    try {
      const next = !excluded;
      if (next) localStorage.setItem("pkdm_no_track", "1");
      else localStorage.removeItem("pkdm_no_track");
      setExcluded(next);
    } catch {}
  };
  return (
    <button
      onClick={toggle}
      className="w-full rounded-lg border border-white/10 px-3 py-2 text-left text-xs text-haze transition-colors hover:text-white"
      title="When excluded, your visits from this browser are not recorded in analytics."
    >
      <span
        className={`mr-2 inline-block h-2 w-2 rounded-full ${
          excluded ? "bg-emerald-400" : "bg-yellow-400"
        }`}
      />
      {excluded ? "My visits excluded" : "Exclude my visits"}
    </button>
  );
}

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") return null;

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <aside className="flex w-full shrink-0 flex-col gap-6 border-b border-white/[0.06] p-5 lg:min-h-screen lg:w-60 lg:border-b-0 lg:border-r">
      <Link href="/admin" className="font-display text-lg font-semibold text-white">
        PKDM <span className="text-accent">Admin</span>
      </Link>

      <nav className="flex flex-1 flex-row flex-wrap gap-6 lg:flex-col">
        {groups.map((g) => (
          <div key={g.label}>
            <p className="mb-2 text-[11px] uppercase tracking-widest text-haze/60">
              {g.label}
            </p>
            <ul className="space-y-0.5">
              {g.links.map((l) => {
                const active =
                  l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                        active
                          ? "bg-accent/10 text-accent"
                          : "text-haze hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      {l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-2">
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
            className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-haze transition-colors hover:border-red-400/40 hover:text-red-300"
          >
            Log out
          </button>
        </div>
      </div>
    </aside>
  );
}
