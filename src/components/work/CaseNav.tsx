"use client";

import { useEffect, useRef, useState } from "react";

type LenisLike = {
  scrollTo: (t: HTMLElement, o?: { offset?: number }) => void;
};

/**
 * Sticky in-page index for long case studies: highlights the section being
 * read, scrolls smoothly to a section on click, and draws a reading-progress
 * hairline. Desktop shows it under the main nav; on phones it's a swipeable
 * pill row. Purely additive — every section is reachable without it.
 */
export default function CaseNav({
  items,
  accent,
}: {
  items: { id: string; label: string }[];
  accent: string;
}) {
  const [active, setActive] = useState(items[0]?.id);
  const barRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const sections = items
      .map((i) => document.getElementById(i.id))
      .filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    sections.forEach((s) => io.observe(s));

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [items]);

  // Keep the active pill in view on narrow screens
  useEffect(() => {
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (!list || !el) return;
    const left = el.offsetLeft - list.clientWidth / 2 + el.clientWidth / 2;
    list.scrollTo({ left, behavior: "smooth" });
  }, [active]);

  const go = (id: string) => (e: React.MouseEvent) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const lenis = (window as unknown as { __pkdmLenis?: LenisLike }).__pkdmLenis;
    if (lenis) lenis.scrollTo(el, { offset: -140 });
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 140, behavior: "smooth" });
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <nav
      aria-label="Case study sections"
      className="sticky top-16 z-40 border-y border-white/[0.06] bg-ink-950/80 backdrop-blur-xl md:top-20"
    >
      <div className="shell flex items-center gap-4">
        <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.22em] text-haze/50 lg:block">
          On this page
        </span>
        <ul
          ref={listRef}
          className="no-scrollbar flex flex-1 gap-1 overflow-x-auto py-2.5"
        >
          {items.map((i) => {
            const on = i.id === active;
            return (
              <li key={i.id} data-id={i.id} className="shrink-0">
                <a
                  href={`#${i.id}`}
                  onClick={go(i.id)}
                  aria-current={on ? "true" : undefined}
                  className={`block rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-300 ${
                    on
                      ? "bg-white/[0.08] text-white"
                      : "text-haze hover:text-white"
                  }`}
                >
                  {i.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
      <div
        ref={barRef}
        aria-hidden="true"
        className="absolute inset-x-0 -bottom-px h-px origin-left"
        style={{ transform: "scaleX(0)", background: `linear-gradient(90deg, ${accent}, #69edfe)` }}
      />
    </nav>
  );
}
