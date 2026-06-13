import Image from "next/image";
import { clientLogos } from "@/data/projects";

/**
 * Infinite logo marquee. Uses a pure CSS transform animation on a duplicated
 * track (translateX 0 -> -50%), which is GPU-composited and jank-free — no
 * JS scroll handlers, no layout thrash.
 */
export default function Marquee() {
  const logos = [...clientLogos, ...clientLogos];

  return (
    <section className="relative border-y border-white/5 py-12">
      <div className="shell">
        <p className="mb-8 text-center text-xs font-medium uppercase tracking-[0.22em] text-haze/60">
          Trusted by businesses across Europe
        </p>
      </div>

      <div
        className="group relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]"
        aria-label="Client logos"
      >
        <div className="flex shrink-0 animate-marquee items-center gap-16 pr-16 group-hover:[animation-play-state:paused] motion-reduce:animate-none motion-reduce:overflow-x-auto">
          {logos.map((logo, i) => (
            <Image
              key={`${logo.name}-${i}`}
              src={logo.src}
              alt={logo.name}
              width={150}
              height={44}
              aria-hidden={i >= clientLogos.length}
              className="logo-mono h-8 w-auto shrink-0 md:h-9"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
