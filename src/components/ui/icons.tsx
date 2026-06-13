// Inline SVG icons. Lightweight, no icon-library dependency.
import type { ReactElement } from "react";

type IconProps = { className?: string };

export const ArrowRight = ({ className = "h-4 w-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M5 12h14M13 6l6 6-6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ArrowUpRight = ({ className = "h-4 w-4" }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M7 17 17 7M8 7h9v9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// --- Social icons keyed by platform ---
export const socialIcons: Record<string, (p: IconProps) => ReactElement> = {
  linkedin: ({ className = "h-5 w-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.3 0-2.95-1.8-2.95s-2.08 1.4-2.08 2.85V21H9V9Z" />
    </svg>
  ),
  instagram: ({ className = "h-5 w-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  ),
  x: ({ className = "h-5 w-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.79l-5.32-6.96L4.3 22H1.04l8.02-9.17L1.5 2h6.96l4.81 6.36L18.244 2Zm-1.19 18h1.83L7.04 3.9H5.07L17.054 20Z" />
    </svg>
  ),
  dribbble: ({ className = "h-5 w-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M5 8c4 1 9 1.5 14 0M3.5 14c4-1.5 9-1 12 2M9 3c3 4 5 9 5.5 18" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  behance: ({ className = "h-5 w-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 7H3v10h5.2c2.2 0 3.8-1.1 3.8-3 0-1.3-.8-2.2-1.9-2.5 1-.4 1.5-1.2 1.5-2.2C11.6 7.6 10.2 7 8 7Zm-.3 4H5V9h2.6c.9 0 1.4.4 1.4 1s-.5 1-1.3 1Zm.2 4H5v-2.2h2.8c1 0 1.6.4 1.6 1.1 0 .8-.6 1.1-1.5 1.1ZM21 13.4c0-2.3-1.4-4-3.8-4-2.3 0-4 1.7-4 4.1 0 2.4 1.6 4 4 4 1.9 0 3.3-.9 3.7-2.4h-2c-.2.5-.7.8-1.5.8-1 0-1.7-.6-1.8-1.6h5.3c.1-.3.1-.6.1-.9Zm-5.4-.9c.1-.9.7-1.5 1.6-1.5s1.5.6 1.6 1.5h-3.2ZM15 7.5h4V9h-4z" />
    </svg>
  ),
  github: ({ className = "h-5 w-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.94.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  ),
};
