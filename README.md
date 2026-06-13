# PKDM Studio — Website

A fast, motion-rich website for **PKDM Studio**, a founder-led web design &
Webflow development studio. Signature deep near-black `#000206` background,
electric-cyan brand accent, DM Sans typography, a lightweight animated
background, light/responsive smooth scrolling, and tasteful micro-interactions —
built to load fast and stay smooth.

## Pages

A true multi-page site (App Router):

| Route | Description |
|---|---|
| `/` | Homepage — hero, clients, services, featured work, process, insights, testimonials, contact |
| `/about` | Founder story, beliefs, pillars, process |
| `/services` | Full services + process |
| `/projects` | All projects |
| `/projects/[slug]` | Per-project case study (hero, overview, gallery, live link, next project) |
| `/insights` | Article list |
| `/insights/[slug]` | Article page |
| `/contact` | Contact form |

Project and insight detail pages are statically generated via
`generateStaticParams`. Add a new project/insight by editing
`src/data/projects.ts` / `src/data/content.ts` — its page is created
automatically.

## Tech stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS** for styling
- **Framer Motion** for animation/interaction
- **Lenis** for smooth scrolling
- Custom **canvas** particle/constellation background (GPU-cheap; auto-disabled
  on mobile, `prefers-reduced-motion`, and when the tab is hidden)
- Self-hosted fonts via `next/font` (Inter + Sora)
- Optimized images via `next/image` (AVIF/WebP)

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build    # production build
npm run start    # serve the production build
```

The build succeeds with **zero configuration** and **no environment variables**
required (the contact form simply shows a "email us directly" message until a
Web3Forms key is added — see below).

## Deploy to Vercel (zero-config)

1. Push this repo to GitHub (already on the **`PKaartinen`** account).
2. Go to [vercel.com/new](https://vercel.com/new) and **Import** the repo.
3. Vercel auto-detects **Next.js** — no build settings to change. Click
   **Deploy**.
4. (Optional but recommended) add the Web3Forms env vars in
   **Project → Settings → Environment Variables**, then redeploy so the contact
   form delivers email.

## Contact form (Web3Forms)

The contact form uses [Web3Forms](https://web3forms.com) (free, no backend).
Every submission must reach **both** inboxes:

- `madebypietu@gmail.com`
- `webco.owners@gmail.com`

### How delivery works

On Web3Forms' **free tier**, one access key delivers to exactly **one** inbox.
So the site fires **one submission per access key** — one per inbox — meaning
both inboxes receive every message. As an extra safety net it also passes the
`ccemail` field (a Web3Forms **PRO** feature, ignored on free tier) pointing at
the *other* inbox, so a single PRO key would still copy the second address.

### Set it up

1. Go to [web3forms.com](https://web3forms.com), enter **madebypietu@gmail.com**,
   and copy the access key → set it as `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY`.
2. Repeat with **webco.owners@gmail.com** → set it as
   `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY_2`.

**Locally:** copy `.env.example` to `.env.local` and paste the keys.

```bash
cp .env.example .env.local
```

**On Vercel:** add the same two variables under
**Project → Settings → Environment Variables**, then redeploy.

> If you upgrade to Web3Forms PRO, a single key + the built-in `ccemail`
> fallback already copies the second inbox, so the second key becomes optional.

The form includes a honeypot spam field, client-side validation, and clear
loading / success / error states.

## Editing content

All content lives in plain config/data files — no need to touch components:

| What | File |
|---|---|
| Site name, email, address, **nav links**, **social links** | `src/data/site.ts` |
| **Projects** (cards, slugs, galleries, **live URLs**), client logos | `src/data/projects.ts` |
| Services, pillars, **insights/articles**, process steps, testimonials, stats | `src/data/content.ts` |

### Project live URLs

Open `src/data/projects.ts` and set each project's `url` to its full
`https://…` address. An **empty string (`""`)** renders the card and case-study
page with **no outbound "Visit live site" link** (no broken/`#` links). Links
open in a new tab with `rel="noopener noreferrer"`.

### Social links

Social icons are driven by the `socialLinks` array in `src/data/site.ts`, which
is **empty by default**. Add entries like:

```ts
export const socialLinks = [
  { platform: "linkedin", href: "https://linkedin.com/in/your-handle" },
  { platform: "instagram", href: "https://instagram.com/your-handle" },
];
```

Supported `platform` values: `linkedin`, `instagram`, `x`, `dribbble`,
`behance`, `github`. Only entries with a valid, non-empty URL render — if the
array is empty, **no social row is shown at all** (no placeholders, no gap).

## Adding content

- **New project / case study:** add an entry to `projects` in
  `src/data/projects.ts` (with a unique `slug`, card `image`, optional
  `gallery`, and optional live `url`). Drop the screenshots in
  `public/projects/`. The `/projects/[slug]` page is generated automatically.
- **New article:** add an entry to `insights` in `src/data/content.ts` (unique
  `slug`, `body` paragraphs). The `/insights/[slug]` page is generated
  automatically.
- **Nav:** edit `navLinks` in `src/data/site.ts`.

## Performance & accessibility

- Lightweight canvas background, paused offscreen and disabled on mobile /
  reduced-motion.
- Transform-based marquees (no layout thrash), `will-change` only where needed.
- `next/image` with explicit dimensions → no layout shift.
- Semantic HTML, keyboard-navigable, visible focus states, aria labels, alt
  text, skip-to-content link, and full `prefers-reduced-motion` support.
- SEO: title/description, Open Graph + Twitter cards (`/public/og.png`),
  favicon, JSON-LD `ProfessionalService` schema, `robots.txt`, and `sitemap.xml`.

## Repository

This repository lives on the **`PKaartinen`** GitHub account (not the work
account). Confirm your active git/GitHub credentials point to `PKaartinen`
before pushing.

---

© 2026 PKDM Services. All rights reserved.
