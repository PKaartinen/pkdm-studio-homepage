// ---------------------------------------------------------------------------
// PROJECTS — the single source for every project card, the 3D work panels and
// each /projects/[slug] case study.
//
// Rules:
//   - Facts only. Every number here comes from the project's own code, docs or
//     live site (see the per-project notes). No invented clients/metrics.
//   - NO PKDM pricing anywhere (hard brand rule). A client product's own price
//     may appear inside its screenshots, never in our copy.
//   - `url: ""` renders a project WITHOUT an outbound link (no dead links).
//   - `featured: true` projects drive the six 3D homepage panels, in source
//     order (panels-manifest.ts verifies the manifest against this list).
//   - Screenshots live in public/work/<slug>/ (captured 2026-11-10 from the
//     live sites). Desktop shots are 2400×1500 (1440×900 @ ~1.67x), phone shots
//     780×1688 (390×844 @2x), full pages 1440 wide.
// ---------------------------------------------------------------------------

export type Shot = {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
};

export type FlowColumn = {
  title: string;
  nodes: { label: string; sub?: string; accent?: boolean }[];
};

/** Visual blocks used by case-study chapters. */
export type Media =
  | { type: "browser"; shot: Shot; url?: string }
  | { type: "duo"; back: Shot; front: Shot; url?: string }
  | { type: "device"; desktop: Shot; mobile: Shot; url?: string }
  | { type: "phones"; shots: Shot[] }
  | { type: "phoneVideo"; src: string; poster: Shot; label?: string }
  | {
      type: "pipeline";
      steps: { label: string; title: string; body: string }[];
    }
  | { type: "flow"; columns: FlowColumn[]; footnote?: string };

export type Chapter = {
  eyebrow: string;
  title: string;
  body: string[];
  bullets?: string[];
  media: Media;
  /** Media spans the full width under the copy instead of sitting beside it. */
  wide?: boolean;
};

export type Project = {
  slug: string;
  name: string;
  /** Short label used in tags and the 3D panel tag (`name — category`). */
  category: string;
  kind: "Own product" | "Client project" | "Own venture";
  year: string;
  status: "Live" | "In preview" | "Archive";
  role: string;
  /** One-line hook for cards. */
  summary: string;
  /** Longer intro paragraph for the case-study header. */
  description: string;
  services: string[];
  stack: string[];
  /** Live URL — "" renders no outbound link. */
  url: string;
  /** Brand colour of the client product — used for subtle glows/accents. */
  accent: string;
  /** Card / hero image (desktop viewport capture). */
  image: Shot;
  /** Mobile hero capture (phone frame). */
  mobile?: Shot;
  /** Full-page capture for the scroll-through browser. */
  full?: Shot;
  stats?: { value: string; label: string }[];
  scope?: { title: string; description: string }[];
  challenge?: string;
  approach?: string[];
  outcome?: string;
  chapters?: Chapter[];
  highlights?: { title: string; body: string }[];
  gallery: Shot[];
  phones?: Shot[];
  featured: boolean;
  /** Homepage/projects hero project (exactly one). */
  hero?: boolean;
};

const D = 2400;
const DH = 1500;
const M = 780;
const MH = 1688;

const d = (src: string, alt: string, caption?: string): Shot => ({
  src,
  width: D,
  height: DH,
  alt,
  caption,
});
const m = (src: string, alt: string, caption?: string): Shot => ({
  src,
  width: M,
  height: MH,
  alt,
  caption,
});
const img = (
  src: string,
  width: number,
  height: number,
  alt: string,
  caption?: string
): Shot => ({ src, width, height, alt, caption });

// ---------------------------------------------------------------------------
// PROJECT LIST (order = order on the site; featured six = 3D panels)
// ---------------------------------------------------------------------------
export const projects: Project[] = [
  // -------------------------------------------------------------------------
  // ClearPen — own product. Facts: company-os ClearPen index/product/
  // architecture/current-state (2026-11-03/06), ClearPen repo.
  // -------------------------------------------------------------------------
  {
    slug: "clearpen",
    name: "ClearPen",
    category: "AI SaaS Platform",
    kind: "Own product",
    year: "2026",
    status: "Live",
    role: "Product, brand, design, full-stack engineering & growth",
    summary:
      "An AI writing platform built from nothing: brand, marketing site, members area, payments, A/B funnels and a proprietary humanization engine.",
    description:
      "ClearPen refines AI-assisted drafts into natural, human-sounding prose and shows the detection score before and after, so writers can see exactly what changed and why. Every layer of it was designed and engineered in-house: the brand, the marketing site and SEO pages, the members area, Stripe billing, the paid-traffic funnels, the admin and analytics stack, and the multi-stage NLP engine that does the actual work.",
    services: [
      "Product strategy",
      "Brand & UI design",
      "Full-stack engineering",
      "AI / NLP pipeline",
      "Payments & funnels",
      "Growth & analytics",
    ],
    stack: [
      "Next.js 16",
      "React 19",
      "TypeScript",
      "Tailwind v4",
      "Clerk",
      "Neon Postgres",
      "Drizzle ORM",
      "Stripe",
      "Upstash Redis",
      "Resend",
      "Vercel",
      "Hetzner",
      "Claude API",
      "Self-hosted NLP models",
    ],
    url: "https://www.clearpen.ai",
    accent: "#19c39c",
    image: d("/work/clearpen/hero.webp", "ClearPen homepage: Writing that reads like you"),
    mobile: m("/work/clearpen/m-hero.webp", "ClearPen homepage on mobile"),
    full: img(
      "/work/clearpen/full.webp",
      1440,
      7590,
      "The full ClearPen homepage, top to bottom"
    ),
    stats: [
      { value: "680+", label: "Registered users" },
      { value: "6", label: "Stage humanization engine" },
      { value: "2", label: "A/B checkout funnels" },
      { value: "100%", label: "Built in-house" },
    ],
    scope: [
      {
        title: "Brand & marketing site",
        description:
          "Identity, homepage, use-case and SEO landing pages, an MDX blog, plus a WebGL 3D homepage experiment.",
      },
      {
        title: "Members area",
        description:
          "Two-pane humanizer with tone and strength controls, live before/after scores, sentence highlighting, history, citations and an onboarding tour.",
      },
      {
        title: "Payments & billing",
        description:
          "Stripe subscriptions on monthly and annual plans, free trials, word packs, usage metering and a self-serve billing portal.",
      },
      {
        title: "Funnels for paid & affiliate traffic",
        description:
          "Sell-first and direct-to-trial checkouts behind a sticky 50/50 splitter, with multiple offers, wallets and one-tap Google sign-up.",
      },
      {
        title: "Humanization engine",
        description:
          "A proprietary multi-stage NLP pipeline, built from scratch; the core IP the whole product stands on.",
      },
      {
        title: "Admin, email & analytics",
        description:
          "Self-hosted event analytics, funnel dashboards, user management and a lifecycle email system with frequency caps.",
      },
    ],
    challenge:
      "AI detectors are unreliable, and the people they misjudge most are often the ones writing honestly: non-native speakers, formal writers, anyone a little too clean. Most tools in the category hand back text and say nothing. ClearPen had to do the opposite: rewrite for natural rhythm while preserving meaning, citations and structure, then show its work.",
    approach: [
      "I treated it as a product, not a page. The engine came first: months of benchmarking showed that no single LLM rewrite holds up on long documents, so the pipeline splits text into flow-preserving blocks and layers several specialised passes, each gated on meaning similarity.",
      "Around it sits a complete SaaS: Clerk auth synced to Postgres, Stripe billing with trials and packs, request history, citations, an onboarding tour, lifecycle email, and an admin stack that reads every funnel step from first-party events.",
      "Growth was engineered in, too. Two checkout funnels run side by side for paid and affiliate traffic, every offer is compliance-reviewed, and the marketing site is copy-tested against real usage data.",
    ],
    outcome:
      "ClearPen is live at clearpen.ai with 680+ registered users, paying subscribers on monthly and annual plans, and a release cadence of improvements every week. It is the clearest proof of what this studio does: take a product from a blank page to a business.",
    chapters: [
      {
        eyebrow: "01 · The engine",
        title: "A humanization engine, built from the ground up.",
        body: [
          "The heart of ClearPen is not a prompt. It is a multi-stage pipeline that works block by block, scores every sentence, rewrites only what needs it and verifies the result before anything reaches the user.",
          "Long documents stream back with heartbeats so nothing times out, the input is scored in seconds before the run starts, and a guard returns the original if a rewrite would ever score worse.",
        ],
        media: {
          type: "pipeline",
          steps: [
            {
              label: "Split",
              title: "Flow-preserving blocks",
              body: "~250-word blocks, never cut mid-sentence. Headings pass through; the rejoin is byte-for-byte lossless.",
            },
            {
              label: "Score",
              title: "Sentence-level scoring",
              body: "Every sentence is scored first, so only the ones that need work get touched.",
            },
            {
              label: "Restructure",
              title: "Rhythm & structure",
              body: "Sentence shape and burstiness are reworked per block to read like a person wrote it.",
            },
            {
              label: "Rewrite",
              title: "Selective paraphrase",
              body: "A self-hosted model reworks flagged sentences only, gated on meaning similarity.",
            },
            {
              label: "Proofread",
              title: "Minimal-edit repair",
              body: "An LLM pass fixes grammar and artefacts without flattening the writer's voice.",
            },
            {
              label: "Verify",
              title: "Quality gates",
              body: "Blocks rejoin, grammar is polished, and parallel retries escalate on hard inputs.",
            },
          ],
        },
        wide: true,
      },
      {
        eyebrow: "02 · The members area",
        title: "A dashboard people actually finish a task in.",
        body: [
          "Paste, pick a tone and strength, and watch the run stream in: reading, restructuring, polishing, then a before/after score with every changed sentence highlighted.",
          "Built mobile-first, with history, citations, billing, settings and a first-run tour that demos each feature before the user spends a single word.",
        ],
        bullets: [
          "Streaming progress with live stage labels",
          "Before / after scores and sentence highlighting",
          "Tone, strength and US/UK spelling controls",
          "History, citations, billing and onboarding",
        ],
        media: {
          type: "phoneVideo",
          src: "/work/clearpen/humanize.mp4",
          poster: img(
            "/work/clearpen/humanize-poster.webp",
            576,
            1024,
            "ClearPen humanizer on mobile showing a before and after score"
          ),
          label: "Screen recording · members area",
        },
      },
      {
        eyebrow: "03 · Funnels",
        title: "Multiple funnels, multiple offers, one source of truth.",
        body: [
          "Paid and affiliate traffic lands on a splitter that assigns visitors to a sell-first or a direct-to-trial funnel and keeps them there. Both run headless sign-up and a custom Stripe flow on a single screen, with Apple Pay, Google Pay and one-tap Google accounts.",
          "Every step fires first-party events, so the admin dashboard compares funnels on real conversion, not guesses; trial disclosures, renewal dates and one-click cancellation keep the payment account healthy.",
        ],
        media: {
          type: "flow",
          columns: [
            {
              title: "Traffic",
              nodes: [
                { label: "Paid social", sub: "Click IDs captured" },
                { label: "Affiliates", sub: "Partner offers" },
                { label: "Email", sub: "Warm trial offers" },
              ],
            },
            {
              title: "Split",
              nodes: [
                {
                  label: "/go splitter",
                  sub: "Sticky 50/50 A/B",
                  accent: true,
                },
              ],
            },
            {
              title: "Funnels",
              nodes: [
                { label: "A · Sell-first", sub: "Plan select → checkout" },
                { label: "B · Direct-to-trial", sub: "One step" },
              ],
            },
            {
              title: "Checkout",
              nodes: [
                { label: "Headless sign-up", sub: "Google one-tap" },
                {
                  label: "Stripe on one screen",
                  sub: "Apple & Google Pay",
                  accent: true,
                },
              ],
            },
            {
              title: "After",
              nodes: [
                { label: "Webhooks", sub: "trial_started · subscribed" },
                { label: "Lifecycle email" },
                { label: "Funnel dashboard" },
              ],
            },
          ],
          footnote:
            "Funnel A and Funnel B share one checkout core; each offer is a config, not a fork.",
        },
        wide: true,
      },
      {
        eyebrow: "04 · Checkout",
        title: "Two checkouts, designed to be compared.",
        body: [
          "Funnel A sells first: a plan picker with the recommended trial pre-selected and every disclosure next to the button. Funnel B goes straight to a pre-loaded trial with account and card on one screen.",
        ],
        media: {
          type: "phones",
          shots: [
            m("/work/clearpen/m-start.webp", "Funnel A: sell-first plan picker", "Funnel A · sell-first"),
            m("/work/clearpen/m-trial.webp", "Funnel B: direct-to-trial checkout", "Funnel B · direct-to-trial"),
            m("/work/clearpen/m-pricing.webp", "ClearPen pricing on mobile", "Pricing"),
          ],
        },
      },
      {
        eyebrow: "05 · The marketing site",
        title: "A calm, honest site that explains the product in seconds.",
        body: [
          "The site leads with the false-positive problem, shows a real before/after, and keeps every claim provable. Use-case pages, a free detector and a blog do the SEO work; the pricing page does the converting.",
        ],
        media: {
          type: "duo",
          back: d("/work/clearpen/changed.webp", "ClearPen: See exactly what changed"),
          front: d("/work/clearpen/pricing.webp", "ClearPen pricing page"),
          url: "clearpen.ai",
        },
      },
      {
        eyebrow: "06 · Experiments",
        title: "And when it called for it: a 3D homepage.",
        body: [
          "For launch content we built a WebGL “Liquid Clarity” homepage, a glass drop that refracts the headline, on the same engineering canon that later powered this studio's own 3D homepage.",
        ],
        media: {
          type: "browser",
          shot: d("/work/clearpen/v6.webp", "ClearPen 3D Liquid Clarity homepage"),
          url: "clearpen.ai/v6",
        },
      },
    ],
    highlights: [
      {
        title: "Streaming long jobs",
        body: "Rewrites stream back as NDJSON with heartbeats, so multi-thousand-word documents never drop behind a proxy.",
      },
      {
        title: "Score-first runs",
        body: "Input is scored in seconds before the pipeline starts; text that already reads as human stops early, free of charge.",
      },
      {
        title: "Retries with a safety net",
        body: "Hard inputs escalate to parallel attempts; an input-protection guard means the output never scores worse than the input.",
      },
      {
        title: "Payment-safe by design",
        body: "Clear trial disclosures, renewal emails and one-click cancellation, engineered to keep the Stripe account healthy.",
      },
    ],
    gallery: [
      d("/work/clearpen/superpowers.webp", "ClearPen: Four superpowers", "Feature story: four tools, one tap"),
      d("/work/clearpen/compare.webp", "ClearPen: comparison table", "Honest comparison, no vague claims"),
      d("/work/clearpen/funnel-start.webp", "ClearPen funnel A, sell-first", "Funnel A: sell-first checkout"),
      d("/work/clearpen/detector.webp", "ClearPen free AI detector", "Free detector: the policy-safe top of funnel"),
      d("/work/clearpen/checked.webp", "ClearPen: Built to be checked", "Trust section: billing rules in plain words"),
      d("/work/clearpen/humanizer-landing.webp", "ClearPen AI humanizer landing page", "SEO landing page"),
    ],
    phones: [
      m("/work/clearpen/m-hero.webp", "ClearPen mobile homepage"),
      m("/work/clearpen/m-changed.webp", "ClearPen mobile before and after"),
      m("/work/clearpen/m-compare.webp", "ClearPen mobile comparison"),
      m("/work/clearpen/m-detector.webp", "ClearPen mobile detector"),
    ],
    featured: true,
    hero: true,
  },

  // -------------------------------------------------------------------------
  // Liveside — client project. Facts: branded_sites/sites/liveside.tv
  // (members/README.md, homepage build), live site.
  // -------------------------------------------------------------------------
  {
    slug: "liveside",
    name: "Liveside",
    category: "Sports Streaming Platform",
    kind: "Client project",
    year: "2026",
    status: "Live",
    role: "Design and build of the marketing site, members area, payments and live data",
    summary:
      "Live scores for 11 sports and 2,000+ leagues, 7 live TV channels and a full members area, designed and built end to end.",
    description:
      "Liveside is a sports platform: live scores, match data, league tables and live TV channels in the browser. We built all of it: a conversion-led marketing site that runs on real live data, a React members app with a match centre and HLS video, and the sign-up and checkout flow that turns visitors into members.",
    services: [
      "Product design",
      "Marketing site",
      "Members area",
      "Payments",
      "Live data engineering",
    ],
    stack: [
      "Astro",
      "React 19",
      "TypeScript",
      "Vite",
      "TanStack Query",
      "React Router",
      "hls.js",
      "GraphQL",
      "Card iframe + 3-D Secure",
      "S3 / Bunny CDN",
    ],
    url: "https://liveside.tv",
    accent: "#2fd96b",
    image: d("/work/liveside/hero.webp", "Liveside homepage: Every sport. Every league. Live."),
    mobile: m("/work/liveside/m-hero.webp", "Liveside homepage on mobile"),
    full: img(
      "/work/liveside/full.webp",
      1440,
      12013,
      "The full Liveside homepage, top to bottom"
    ),
    stats: [
      { value: "11", label: "Sports, live" },
      { value: "2,000+", label: "Leagues & cups" },
      { value: "7", label: "Live TV channels" },
      { value: "~18 KB", label: "Live-data bundle (gzip)" },
    ],
    scope: [
      {
        title: "Marketing site",
        description:
          "A static Astro homepage that fills itself with real data: a live match tracker, live counts per sport, a league explorer and featured match analytics.",
      },
      {
        title: "Members app",
        description:
          "Live scores for 11 sports, match centre, standings, head-to-heads, game alerts, events and account; a React SPA on the same origin.",
      },
      {
        title: "Live TV",
        description:
          "Seven channels streamed in the browser with adaptive HLS playback: light hls.js where it's needed, native on Safari.",
      },
      {
        title: "Sign-up & checkout",
        description:
          "Two-step sign-up into an embedded card form with 3-D Secure, session refresh and remembered charges, so a retry never double-bills.",
      },
      {
        title: "Live data layer",
        description:
          "One client normalises 11 sports APIs, caches aggressively and only polls while data is on screen, built to respect a shared daily quota.",
      },
      {
        title: "Static deploy",
        description:
          "Everything ships as static files to a bucket and CDN: route stubs make every app URL work without a server.",
      },
    ],
    challenge:
      "Sports fans want every league and every score, right now, and they decide in seconds whether a site is worth paying for. The product had to feel alive from the first frame, run on a static host, and stay inside a strict API budget shared across brands.",
    approach: [
      "We designed one dark, high-contrast system for both surfaces, so the marketing page already looks and behaves like the product: the hero is a real live match tracker, not a mock-up.",
      "Under it, a single sports client normalises eleven different APIs into one shape, caches in the browser, refreshes every 60 seconds only while a section is visible, and backs off politely when it hits a limit.",
      "The members app reuses the same modules, adds the match centre and live TV, and hands off to a two-step sign-up and card checkout with 3-D Secure.",
    ],
    outcome:
      "Liveside is live at liveside.tv: one static origin serving the marketing site and the full members app, with real data on the homepage and a checkout ready to sell memberships.",
    chapters: [
      {
        eyebrow: "01 · A homepage that's actually live",
        title: "The hero isn't a mock-up. It's the product.",
        body: [
          "A ~18 KB script turns the static homepage into a live surface: real games per sport, a live count, goal and kick-off toasts, a ticker, live badges on every sport tile and a featured match with form, head-to-head and the league table.",
          "If the first load ever fails, the original static hero quietly comes back, so visitors never see a broken page.",
        ],
        media: {
          type: "device",
          desktop: d("/work/liveside/tracker.webp", "Liveside league explorer"),
          mobile: m("/work/liveside/m-sports.webp", "Liveside sports on mobile"),
          url: "liveside.tv",
        },
      },
      {
        eyebrow: "02 · Data architecture",
        title: "Eleven sports, one shape, one budget.",
        body: [
          "Every sport API answers differently. One normalising client turns them into a single model the homepage and the app both read, and it's built to switch to a caching proxy with a one-line config change.",
        ],
        media: {
          type: "flow",
          columns: [
            {
              title: "Sources",
              nodes: [
                { label: "Sports APIs", sub: "11 sports" },
                { label: "Member API", sub: "GraphQL" },
                { label: "Stream API", sub: "Live TV" },
              ],
            },
            {
              title: "Client layer",
              nodes: [
                { label: "Normalising client", sub: "One model", accent: true },
                { label: "Query cache", sub: "Visibility-aware" },
                { label: "Local cache", sub: "Warm starts" },
              ],
            },
            {
              title: "Surfaces",
              nodes: [
                { label: "Homepage", sub: "Live tracker" },
                { label: "Members app", sub: "Match centre" },
                { label: "Live TV", sub: "HLS player", accent: true },
              ],
            },
          ],
          footnote:
            "Polling runs every 60 s only while a section is on screen, stops after 20 minutes, and pauses on rate limits.",
        },
        wide: true,
      },
      {
        eyebrow: "03 · Live TV",
        title: "Seven channels in the browser. No box, no app.",
        body: [
          "Channels play with adaptive HLS behind the same member session as the scores: a light player where Media Source Extensions exist, native playback on Safari.",
        ],
        media: {
          type: "browser",
          shot: d("/work/liveside/channels.webp", "Liveside live TV channels"),
          url: "liveside.tv",
        },
      },
      {
        eyebrow: "04 · Members area",
        title: "From the marketing page to the match centre in one origin.",
        body: [
          "The members app lives beside the marketing page on the same static origin. Log in once and the header swaps to “Open Liveside”; 163 deep links from the homepage land on the right league after sign-in.",
        ],
        media: {
          type: "phones",
          shots: [
            m("/work/liveside/m-login.webp", "Liveside members log in", "Members log in"),
            m("/work/liveside/m-channels.webp", "Liveside live channels on mobile", "Live TV"),
            m("/work/liveside/m-match.webp", "Liveside match data on mobile", "Match data & alerts"),
          ],
        },
      },
    ],
    highlights: [
      {
        title: "Data on a budget",
        body: "Refresh only while visible, stop after 20 minutes idle, back off 30 s or 2 min on limits, so a shared 7,500-a-day quota goes a long way.",
      },
      {
        title: "Charges that can't double",
        body: "A remembered charge per member and price means a failed membership grant retries without charging the card again.",
      },
      {
        title: "Serverless by construction",
        body: "The build writes a real index.html for every app route, so a plain bucket and CDN serve the whole product.",
      },
      {
        title: "Graceful failure",
        body: "Quota out? “Live data is taking a breather.” First load failed? The static hero returns. Nothing ever looks broken.",
      },
    ],
    gallery: [
      d("/work/liveside/everything.webp", "Liveside: Everything live in one place", "One membership, five products"),
      d("/work/liveside/sports.webp", "Liveside: 11 sports, 2,000+ leagues", "Sport tiles with live counts"),
      d("/work/liveside/matchdata.webp", "Liveside: match data and game alerts", "Match data & game alerts"),
      d("/work/liveside/events.webp", "Liveside: beyond the scoreboard", "Events coverage"),
      d("/work/liveside/steps.webp", "Liveside: live in three steps", "Onboarding in three steps"),
      d("/work/liveside/login.webp", "Liveside members log in", "Members area: log in"),
    ],
    phones: [
      m("/work/liveside/m-hero.webp", "Liveside mobile homepage"),
      m("/work/liveside/m-sports.webp", "Liveside mobile sports"),
      m("/work/liveside/m-channels.webp", "Liveside mobile live TV"),
      m("/work/liveside/m-match.webp", "Liveside mobile match data"),
    ],
    featured: true,
  },

  // -------------------------------------------------------------------------
  // Watchshort — client project, in preview. Facts: Shorts Streaming Project
  // brief/spec (2026-10-29), live preview.
  // -------------------------------------------------------------------------
  {
    slug: "watchshort",
    name: "Watchshort",
    category: "Short-Drama Streaming",
    kind: "Client project",
    year: "2026",
    status: "In preview",
    role: "Product design, front-end & platform architecture",
    summary:
      "A premium home for vertical micro-dramas: cinematic browsing, a binge-ready player and one clear paywall, without the category's coin-store clutter.",
    description:
      "Short-drama apps taught a huge audience a simple loop: a series opens free, a later episode locks, you pay once and keep watching. Watchshort keeps the loop and raises the standard of everything around it: type, motion, a dark cinematic field and a fast first frame, so the story is the screen.",
    services: [
      "Product strategy",
      "UI/UX design",
      "Front-end engineering",
      "Platform architecture",
    ],
    stack: [
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "Static-first site",
      "Members JSON API",
      "Vercel (preview)",
    ],
    url: "https://watchshorttv.vercel.app",
    accent: "#e63946",
    image: d("/work/watchshort/hero.webp", "Watchshort homepage: Midnight Contract"),
    mobile: m("/work/watchshort/m-hero.webp", "Watchshort homepage on mobile"),
    full: img(
      "/work/watchshort/full.webp",
      1440,
      7133,
      "The full Watchshort homepage, top to bottom"
    ),
    stats: [
      { value: "< 2.5 s", label: "LCP target on 4G" },
      { value: "AA", label: "WCAG target" },
      { value: "1", label: "Clear paywall step" },
      { value: "0", label: "Coin-store badges" },
    ],
    scope: [
      {
        title: "Cinematic homepage",
        description:
          "One featured series, editorial rails, a Top 10 and a compact trope taxonomy; posters, a title and one trope per card.",
      },
      {
        title: "Browse & search",
        description:
          "Rails and an instant client-side search over the catalogue, with vertical and widescreen formats side by side.",
      },
      {
        title: "Series & player",
        description:
          "Episode lists with free and locked states visible before play, autoplay through the free run, speed controls and progress that follows the account.",
      },
      {
        title: "Paywall & members",
        description:
          "One clear offer at the first locked episode; accounts, entitlements, continue-watching and billing in a separate members area.",
      },
    ],
    challenge:
      "The category's leaders wrap every story in a storefront: coin balances, reward centres, countdowns and sticker badges on every card. It works, but it feels cheap, and it buries the one thing people came for.",
    approach: [
      "We wrote the premium rules down before drawing anything: titles set as real type, one trope per card in sentence case, motion that settles instead of begging for taps, and one accent colour reserved for the primary action and the paywall.",
      "The public site is static and fast, free episodes play without an account, and the paywall is a single, honest step when the free run ends.",
    ],
    outcome:
      "The preview is live and close to the final product: homepage, browse, series pages and pricing, ready for catalogue and payments to plug in.",
    chapters: [
      {
        eyebrow: "01 · Browse",
        title: "Rails that sell the story, not the store.",
        body: [
          "Editorial shelves by trope, a Top 10 with oversized numerals, and posters that carry all the colour; the interface stays near-black and gets out of the way.",
        ],
        media: {
          type: "duo",
          back: d("/work/watchshort/rails.webp", "Watchshort editorial rails"),
          front: d("/work/watchshort/top10.webp", "Watchshort Top 10 today"),
          url: "watchshorttv.vercel.app",
        },
      },
      {
        eyebrow: "02 · Mobile first",
        title: "Built for a spare minute on a phone.",
        body: [
          "The category's viewer is an adult on a phone. Every screen was designed at phone width first: thumb-reachable actions, a fast first frame and the next episode already queued.",
        ],
        media: {
          type: "phones",
          shots: [
            m("/work/watchshort/m-hero.webp", "Watchshort mobile hero", "Featured series"),
            m("/work/watchshort/m-browse.webp", "Watchshort mobile browse", "Browse"),
            m("/work/watchshort/m-pricing.webp", "Watchshort mobile pricing", "One subscription"),
          ],
        },
      },
    ],
    highlights: [
      {
        title: "Free run, no account",
        body: "Free episodes start without sign-up; progress lives on the device and merges into the account at sign-in.",
      },
      {
        title: "One entitlement call",
        body: "Locked playback waits on a single entitlement check, then starts, with no spinners stacked on spinners.",
      },
    ],
    gallery: [
      d("/work/watchshort/browse.webp", "Watchshort browse page", "Browse: spotlight + filters"),
      d("/work/watchshort/pricing.webp", "Watchshort subscription", "One subscription, plainly priced"),
      d("/work/watchshort/apps.webp", "Watchshort apps", "Take the drama with you"),
    ],
    phones: [
      m("/work/watchshort/m-hero.webp", "Watchshort mobile hero"),
      m("/work/watchshort/m-rails.webp", "Watchshort mobile rails"),
      m("/work/watchshort/m-browse.webp", "Watchshort mobile browse"),
      m("/work/watchshort/m-pricing.webp", "Watchshort mobile pricing"),
    ],
    featured: true,
  },

  // -------------------------------------------------------------------------
  // PrivateByRight — client project. Facts: branded_sites/sites/
  // privatebyright.com (static Next.js build), PBR members portal + funnels
  // repos (Desktop/PrivateByRight VPN), live site.
  // -------------------------------------------------------------------------
  {
    slug: "privatebyright-vpn",
    name: "PrivateByRight",
    category: "VPN Product Site",
    kind: "Client project",
    year: "2026",
    status: "Live",
    role: "Homepage redesign, members portal & checkout funnels",
    summary:
      "A calm, editorial redesign for a privacy VPN: warm daylight instead of hacker-dark clichés, plain language, and a pricing story people trust.",
    description:
      "VPN sites tend to look the same: neon on black, padlocks and fear. PrivateByRight's new homepage goes the other way: a family-friendly, daylight design with editorial type, real product UI and plain-language privacy promises. Alongside it we built the members portal and the checkout funnels that sell the plans.",
    services: [
      "Homepage redesign",
      "UI/UX design",
      "Web development",
      "Members portal",
      "Checkout funnels",
    ],
    stack: [
      "Next.js",
      "React",
      "TypeScript",
      "Tailwind CSS",
      "Vite",
      "Stripe",
      "Drizzle ORM",
      "Static S3 deploy",
    ],
    url: "https://privatebyright.com",
    accent: "#2f6b4f",
    image: d("/work/privatebyright/hero.webp", "PrivateByRight homepage: Protect your privacy."),
    mobile: m("/work/privatebyright/m-hero.webp", "PrivateByRight homepage on mobile"),
    full: img(
      "/work/privatebyright/full.webp",
      1440,
      7369,
      "The full PrivateByRight homepage, top to bottom"
    ),
    stats: [
      { value: "5", label: "Platforms: 3 live, 2 coming" },
      { value: "4", label: "Plan lengths, one price story" },
      { value: "30-day", label: "Money-back promise up front" },
      { value: "100%", label: "Static, CDN-served" },
    ],
    scope: [
      {
        title: "Homepage redesign",
        description:
          "A new visual direction with editorial serif headlines, soft daylight photography and the real app UI, which makes privacy feel everyday, not scary.",
      },
      {
        title: "Pricing that explains itself",
        description:
          "A plan-length selector, renewal terms in plain words next to the button, and the money-back promise where people look for it.",
      },
      {
        title: "Apps, giving back & resources",
        description:
          "Platform availability, an impact section for the causes the subscription supports, a blog and a help-centre FAQ.",
      },
      {
        title: "Members portal & funnels",
        description:
          "A React members portal and Stripe-powered checkout funnels for buying, managing and renewing plans.",
      },
    ],
    challenge:
      "Most people who need a VPN aren't technical. The category's old look is dark, aggressive and full of jargon; it speaks to the wrong crowd and makes a privacy product feel like something to be wary of.",
    approach: [
      "We rebuilt the homepage around reassurance: a warm, light palette, serif headlines with personality, and short, honest lines about what the app does and doesn't do.",
      "Pricing got the most care. Every plan states today's price and the renewal price side by side, so the deal reads as trustworthy rather than tricky.",
    ],
    outcome:
      "The redesigned homepage is live at privatebyright.com as a fully static build, with Android, Windows and macOS apps available and the members portal behind it.",
    chapters: [
      {
        eyebrow: "01 · The new direction",
        title: "Privacy that feels like a sunny morning.",
        body: [
          "Instead of padlocks on black, we show the product in a lived-in setting with real UI, and let short sentences do the reassuring.",
        ],
        media: {
          type: "device",
          desktop: d("/work/privatebyright/browsing.webp", "PrivateByRight: everyday browsing"),
          mobile: m("/work/privatebyright/m-browsing.webp", "PrivateByRight mobile"),
          url: "privatebyright.com",
        },
      },
      {
        eyebrow: "02 · Pricing",
        title: "A deal you can read in one glance.",
        body: [
          "Plan lengths on a single switch, today's price and the renewal price next to each other, and the money-back guarantee beside the button; no small-print surprises.",
        ],
        media: {
          type: "phones",
          shots: [
            m("/work/privatebyright/m-hero.webp", "PrivateByRight mobile hero", "Homepage"),
            m("/work/privatebyright/m-devices.webp", "PrivateByRight mobile apps", "One account, every device"),
            m("/work/privatebyright/m-pricing.webp", "PrivateByRight mobile pricing", "Pricing"),
          ],
        },
      },
    ],
    gallery: [
      d("/work/privatebyright/devices.webp", "PrivateByRight: one account, unlimited devices", "Apps: available now and in development"),
      d("/work/privatebyright/pricing.webp", "PrivateByRight pricing", "Pricing with renewal terms up front"),
      d("/work/privatebyright/giving.webp", "PrivateByRight: your VPN with purpose", "Giving back"),
      d("/work/privatebyright/reviews.webp", "PrivateByRight reviews and blog", "Reviews & resources"),
    ],
    phones: [
      m("/work/privatebyright/m-hero.webp", "PrivateByRight mobile hero"),
      m("/work/privatebyright/m-browsing.webp", "PrivateByRight mobile features"),
      m("/work/privatebyright/m-devices.webp", "PrivateByRight mobile apps"),
      m("/work/privatebyright/m-pricing.webp", "PrivateByRight mobile pricing"),
    ],
    featured: true,
  },

  // -------------------------------------------------------------------------
  // SPRAY — own venture. Facts: PKDM Studio/clients/spray (PROJECT.md, brief,
  // spec), live site.
  // -------------------------------------------------------------------------
  {
    slug: "spray",
    name: "SPRAY",
    category: "Brand Launch Site",
    kind: "Own venture",
    year: "2026",
    status: "Live",
    role: "Brand identity, product renders, site design & build",
    summary:
      "A new nightlife brand, perfume machines for London clubs, launched with a showroom-style site: one machine, one price, one clear ask.",
    description:
      "SPRAY puts a premium perfume machine in nightclubs: choose a scent, tap your card, get a spray. We created the brand from a blank page: wordmark, product renders of the real machine, and a minimalist, product-as-hero website that speaks to venues first, with a layer for guests and perfume houses.",
    services: [
      "Brand identity",
      "Art direction",
      "Web design",
      "Web development",
      "Launch",
    ],
    stack: [
      "Next.js App Router",
      "TypeScript",
      "Tailwind CSS 4",
      "shadcn/ui",
      "Resend",
      "Vercel Analytics",
      "Vercel",
    ],
    url: "https://www.getspray.co.uk",
    accent: "#d8c3a5",
    image: d("/work/spray/hero.webp", "SPRAY homepage: £1.50 a spray"),
    mobile: m("/work/spray/m-hero.webp", "SPRAY homepage on mobile"),
    full: img(
      "/work/spray/full.webp",
      1440,
      7082,
      "The full SPRAY homepage, top to bottom"
    ),
    stats: [
      { value: "3", label: "Audiences: venues, guests, brands" },
      { value: "7", label: "Routes, launched in days" },
      { value: "5", label: "Scents per machine" },
      { value: "1", label: "Clear ask per page" },
    ],
    scope: [
      {
        title: "Brand identity",
        description:
          "An original wide-tracked wordmark and a black-and-white system where only the perfume glass carries colour.",
      },
      {
        title: "Product renders",
        description:
          "Clean, brand-free renders of the real wall-mounted unit, lit like a product launch.",
      },
      {
        title: "Showroom homepage",
        description:
          "Full-viewport product sections, a scroll-scrubbed “Choose. Pay. Spray.” sequence and the price set large.",
      },
      {
        title: "Venues, locations & brands",
        description:
          "Dedicated pages and enquiry forms for each audience, delivered straight to the inbox.",
      },
    ],
    challenge:
      "Nightclub perfume machines exist, but they're coin-op and unbranded. SPRAY needed to look like a premium consumer brand on day one, and convince venue owners to install a machine before a single one was live.",
    approach: [
      "We borrowed the discipline of premium product launches: one product per screen, almost no body copy, numbers set large. Then we built an original identity on top of it.",
      "The site leads with the venue enquiry, keeps a short guest layer (what it is, where to find it) and gives perfume houses one section of their own.",
    ],
    outcome:
      "getspray.co.uk is live, indexable and collecting venue enquiries ahead of the first London placements.",
    chapters: [
      {
        eyebrow: "01 · Choose. Pay. Spray.",
        title: "Three steps, told by scrolling.",
        body: [
          "The machine stays centre stage while the steps advance with the scroll; the whole product explained without a paragraph.",
        ],
        media: {
          type: "duo",
          back: d("/work/spray/steps.webp", "SPRAY: Choose. Pay. Spray."),
          front: d("/work/spray/scents.webp", "SPRAY: five scents, one spray"),
          url: "getspray.co.uk",
        },
      },
      {
        eyebrow: "02 · Every screen",
        title: "Designed to work under club lighting, on a phone.",
        body: [
          "Big type, high contrast and buttons you can hit with one thumb, because the guest layer is read standing next to the machine.",
        ],
        media: {
          type: "phones",
          shots: [
            m("/work/spray/m-hero.webp", "SPRAY mobile hero", "Homepage"),
            m("/work/spray/m-steps.webp", "SPRAY mobile steps", "How it works"),
            m("/work/spray/m-venues.webp", "SPRAY mobile venues page", "For venues"),
          ],
        },
      },
    ],
    gallery: [
      d("/work/spray/venue.webp", "SPRAY: for your venue", "The venue pitch"),
      d("/work/spray/venues.webp", "SPRAY venues page", "Venues: a fresh scent on demand"),
    ],
    phones: [
      m("/work/spray/m-hero.webp", "SPRAY mobile hero"),
      m("/work/spray/m-steps.webp", "SPRAY mobile steps"),
      m("/work/spray/m-venue.webp", "SPRAY mobile venue section"),
      m("/work/spray/m-venues.webp", "SPRAY mobile venues page"),
    ],
    featured: true,
  },

  // -------------------------------------------------------------------------
  // Unifolio — own product (Unifolio OÜ). Facts: Desktop/Unifolio/repo
  // README, company-os, live site.
  // -------------------------------------------------------------------------
  {
    slug: "unifolio",
    name: "Unifolio",
    category: "University Matching Platform",
    kind: "Own product",
    year: "2026",
    status: "Live",
    role: "Product, design & full-stack build",
    summary:
      "A college finder for US high-school seniors: 2,500+ universities, a fit quiz with an explainable ranking engine, and an AI advisor.",
    description:
      "Choosing a university is one of the biggest decisions a teenager makes, and most tools bury them in filters. Unifolio turns it into a short, friendly quiz, ranks real options with reasons a student can understand, and lets them explore admissions, cost and outcome data for every school.",
    services: [
      "Product design",
      "UI/UX systems",
      "Full-stack engineering",
      "AI features",
    ],
    stack: [
      "React 19",
      "TypeScript",
      "Vite",
      "Tailwind CSS",
      "Drizzle ORM",
      "Stripe",
      "LLM advisor",
    ],
    url: "https://unifolio.io",
    accent: "#3b82f6",
    image: d("/work/unifolio/hero.webp", "Unifolio homepage: Every university. One search."),
    mobile: m("/work/unifolio/m-hero.webp", "Unifolio homepage on mobile"),
    full: img(
      "/work/unifolio/full.webp",
      1440,
      5343,
      "The full Unifolio homepage, top to bottom"
    ),
    stats: [
      { value: "2,500+", label: "US universities" },
      { value: "5", label: "Step fit quiz" },
      { value: "7", label: "Ranking dimensions" },
      { value: "0–100", label: "Explainable match score" },
    ],
    scope: [
      {
        title: "Fit quiz",
        description:
          "Five friendly steps covering location, budget, interests, campus vibe and priorities, with autosave and a guest mode.",
      },
      {
        title: "Ranking engine",
        description:
          "Hard filters, then weighted scoring across seven dimensions, with reasons, trade-offs and reach/match/safety labels.",
      },
      {
        title: "University search",
        description:
          "Detailed admissions, cost and outcome data for every school, browsable by state, budget and category.",
      },
      {
        title: "AI advisor & counsellor tools",
        description:
          "A context-aware advisor chat, plus organisation dashboards, shareable quiz links and roster export for schools.",
      },
    ],
    gallery: [
      d("/work/unifolio/search.webp", "Unifolio university search", "Curated university search"),
      d("/work/unifolio/categories.webp", "Unifolio browse by category", "Browse by category"),
      d("/work/unifolio/how.webp", "Unifolio how it works", "How it works"),
    ],
    phones: [
      m("/work/unifolio/m-hero.webp", "Unifolio mobile hero"),
      m("/work/unifolio/m-matches.webp", "Unifolio mobile matches"),
      m("/work/unifolio/m-search.webp", "Unifolio mobile search"),
    ],
    featured: true,
  },

  // -------------------------------------------------------------------------
  // Earlier work (screenshots from the original portfolio set).
  // -------------------------------------------------------------------------
  {
    slug: "breakthrough-capital",
    name: "Breakthrough Capital",
    category: "Financial Services",
    kind: "Client project",
    year: "Earlier",
    status: "Archive",
    role: "Strategy, design & development",
    summary:
      "A polished financial-services site designed to communicate authority and make the next step obvious.",
    description:
      "Breakthrough Capital operates in a space where trust is everything. We gave them a refined, modern site with a clear narrative, strong hierarchy, and conversion paths that guide prospects toward a conversation.",
    services: ["Strategy & UX", "Web Design", "Web Development"],
    stack: [],
    url: "",
    accent: "#c9a227",
    image: img("/projects/breakthrough-1.png", 1400, 699, "Breakthrough Capital homepage"),
    gallery: [
      img("/projects/breakthrough-2.png", 1400, 699, "Breakthrough Capital section"),
      img("/projects/breakthrough-3.png", 1600, 800, "Breakthrough Capital section"),
      img("/projects/breakthrough-4.png", 1600, 800, "Breakthrough Capital section"),
    ],
    featured: false,
  },
  {
    slug: "arctic-lab",
    name: "Arctic Lab",
    category: "Brand & Product Site",
    kind: "Client project",
    year: "Earlier",
    status: "Archive",
    role: "Design & development",
    summary: "A crisp brand and product site with a clean, modern identity.",
    description:
      "Arctic Lab wanted a site that felt as precise as their product. We built a clean, confident interface with strong typography and clear product storytelling.",
    services: ["Web Design", "Web Development"],
    stack: [],
    url: "",
    accent: "#7dd3fc",
    image: img("/projects/arctic-lab.png", 1400, 840, "Arctic Lab homepage"),
    gallery: [],
    featured: false,
  },
  {
    slug: "legacy-academy",
    name: "Legacy Academy",
    category: "Education Platform",
    kind: "Client project",
    year: "Earlier",
    status: "Archive",
    role: "Strategy & design",
    summary:
      "An education platform site built to inform, reassure, and drive enrolment.",
    description:
      "Legacy Academy needed to explain their programs clearly and build confidence with prospective students. We designed a structured, trustworthy site with obvious next steps.",
    services: ["Strategy & UX", "Web Design"],
    stack: [],
    url: "",
    accent: "#f59e0b",
    image: img("/projects/legacy-academy.png", 1400, 840, "Legacy Academy homepage"),
    gallery: [],
    featured: false,
  },
  {
    slug: "cable-killer",
    name: "Cable Killer",
    category: "Product Landing Page",
    kind: "Client project",
    year: "Earlier",
    status: "Archive",
    role: "Landing page design",
    summary: "A punchy product landing page built to convert cold traffic.",
    description:
      "Cable Killer needed a landing page that grabs attention and closes fast. We led with a strong hook, made the value obvious, and drove everything toward a single call to action.",
    services: ["Conversion Landing Page", "Web Design"],
    stack: [],
    url: "",
    accent: "#ef4444",
    image: img("/projects/cable-killer-1.png", 1400, 772, "Cable Killer landing page"),
    gallery: [img("/projects/cable-killer-2.png", 1600, 882, "Cable Killer section")],
    featured: false,
  },
  {
    slug: "yeti-blue",
    name: "Yeti Blue",
    category: "Product Landing Page",
    kind: "Client project",
    year: "Earlier",
    status: "Archive",
    role: "Landing page design",
    summary: "A bold product landing page with a clear, single-minded offer.",
    description:
      "Yeti Blue needed a focused page that sells one product well. We built a clean, high-contrast layout that keeps attention on the offer and the action.",
    services: ["Conversion Landing Page", "Web Design"],
    stack: [],
    url: "",
    accent: "#38bdf8",
    image: img("/projects/yeti-blue-1.png", 1400, 812, "Yeti Blue landing page"),
    gallery: [],
    featured: false,
  },
];

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}

/** The one hero project (ClearPen). */
export const heroProject = projects.find((p) => p.hero) ?? projects[0];

/** Featured (current) work, in source order. */
export const featuredWork = projects.filter((p) => p.featured);

/** Earlier work (archive). */
export const earlierWork = projects.filter((p) => !p.featured);

/** Bare host for display ("clearpen.ai"). */
export function displayUrl(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export const clientLogos = [
  { name: "ClearPen", src: "/clients/clearpen.svg" },
  { name: "CLICKPLAY", src: "/clients/clickplay.svg" },
  { name: "MBP", src: "/clients/mbp.svg" },
  { name: "Secureflex.uk", src: "/clients/secureflex.svg" },
  { name: "SkinLabLED", src: "/clients/skinlabled.svg" },
  { name: "SneakValue", src: "/clients/sneakvalue.svg" },
  { name: "Unifolio", src: "/clients/unifolio.svg" },
];
