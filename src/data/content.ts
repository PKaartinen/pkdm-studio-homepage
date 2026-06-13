// Static copy for the homepage sections. Kept tight and on-brand.

export const services = [
  {
    title: "Strategy & UX Foundations",
    description:
      "We start with your business goals, your customers, and the action you want them to take — then map the site around it.",
  },
  {
    title: "Web Design & Webflow Development",
    description:
      "Custom design in Figma, built into clean, fast Webflow sites you can actually edit and grow.",
  },
  {
    title: "Conversion Landing Pages",
    description:
      "Focused pages built around one offer and one action — structured to turn traffic into leads and sales.",
  },
  {
    title: "Content Solutions",
    description:
      "Clear messaging and copy that explains your offer in plain language and pushes visitors to the next step.",
  },
  {
    title: "UI/UX Systems",
    description:
      "Reusable components and design systems so your site stays consistent and easy to scale.",
  },
  {
    title: "Maintenance & Growth",
    description:
      "Ongoing improvements, performance tuning, and analytics so your site keeps getting better after launch.",
  },
];

export const pillars = [
  {
    title: "Trust-First Design",
    description:
      "Clean, professional UI with real social proof and no jank — so visitors feel safe taking the next step.",
  },
  {
    title: "Strategic Clarity",
    description:
      "Sharp positioning, simple navigation, and obvious CTAs. People understand your offer in seconds, not minutes.",
  },
  {
    title: "Reliable Webflow Systems",
    description:
      "Stable, maintainable builds that load fast and stay easy to update long after launch day.",
  },
];

export type Insight = {
  slug: string;
  title: string;
  tag: string;
  excerpt: string;
  readTime: string;
  body: string[];
};

export const insights: Insight[] = [
  {
    slug: "webflow-seo-performance-checklist",
    title: "The Webflow SEO & Performance Checklist",
    tag: "Performance",
    excerpt:
      "The technical and on-page essentials we ship on every build so sites rank and load fast.",
    readTime: "6 min read",
    body: [
      "A fast site isn't a nice-to-have — it's the baseline for ranking and converting. Here's the checklist we run on every Webflow build before launch.",
      "Performance: compress and serve modern image formats, lazy-load below-the-fold media, keep third-party scripts to a minimum, and avoid layout shift by reserving space for media. On Webflow that means clean structure, sensible interactions, and no bloated embeds.",
      "On-page SEO: a single clear H1 per page, descriptive titles and meta descriptions, semantic headings, alt text on every meaningful image, clean slugs, and Open Graph tags so links look right when shared.",
      "Technical: a valid sitemap and robots file, canonical URLs, fast server response, and structured data where it helps. Get these right and you've removed most of the reasons a good site underperforms.",
    ],
  },
  {
    slug: "conversion-focused-landing-page-framework",
    title: "A Framework for Conversion-Focused Landing Pages",
    tag: "Conversion",
    excerpt:
      "How we structure a landing page around one offer and one action to turn visitors into customers.",
    readTime: "5 min read",
    body: [
      "A landing page should do one job. The moment it tries to do five, it does none of them well. Our framework starts by naming the single action we want a visitor to take.",
      "Above the fold: a clear promise, a supporting line that explains the value, and one obvious call to action. No clever headlines that hide what you actually do.",
      "Then we earn trust: proof, results, and objection-handling in the order a real visitor would ask their questions. Every section moves them one step closer to acting.",
      "Finally, we remove friction. Short forms, fast loads, and a single path to the goal. Conversion isn't a trick — it's clarity plus momentum.",
    ],
  },
  {
    slug: "designing-websites-that-build-trust",
    title: "Designing Websites That Build Trust",
    tag: "Design",
    excerpt:
      "The design and content decisions that make first-time visitors feel confident enough to reach out.",
    readTime: "4 min read",
    body: [
      "Most visitors decide whether they trust you in seconds — long before they read your copy. Trust is built through craft, clarity, and consistency.",
      "Craft: clean typography, generous spacing, considered colour, and zero jank. A site that feels well-built signals a business that is well-run.",
      "Clarity: say what you do in plain language, show real proof, and make the next step obvious. Confusion is the fastest way to lose a lead.",
      "Consistency: a coherent visual system across every page tells visitors you pay attention to detail — which is exactly what they're hoping a partner will do.",
    ],
  },
];

export function getInsight(slug: string) {
  return insights.find((i) => i.slug === slug);
}

export const processSteps = [
  {
    title: "Goal Alignment Session",
    description:
      "A focused call to understand your business, audience, and what a successful site actually looks like for you.",
  },
  {
    title: "Research & Proposal",
    description:
      "We research your market and competitors, then send a clear written proposal with scope and milestones.",
  },
  {
    title: "Design Process",
    description:
      "Custom design in Figma, shaped around your goals — reviewed together until it feels right.",
  },
  {
    title: "Webflow Build",
    description:
      "We turn the design into a fast, responsive, easy-to-edit Webflow site with the integrations you need.",
  },
  {
    title: "Launch & Support",
    description:
      "We launch, test everything, and stay on hand for maintenance and improvements as you grow.",
  },
];

export const testimonials = [
  {
    name: "Jonathan K.",
    role: "Founder, SaaS",
    quote:
      "Pietu understood the business goals immediately. The new site is faster, clearer, and converting noticeably better.",
  },
  {
    name: "Monica Reyes",
    role: "Marketing Lead",
    quote:
      "Communication was excellent the whole way through. Every design decision was explained and tied back to results.",
  },
  {
    name: "Sarah Lin",
    role: "DTC Brand Owner",
    quote:
      "Our landing page finally feels like us — and the conversion rate jumped within the first month.",
  },
  {
    name: "Lena Patel",
    role: "Agency Director",
    quote:
      "Reliable, organized, and genuinely talented. The Webflow build is clean and easy for our team to update.",
  },
  {
    name: "Marcello Russo",
    role: "Co-Founder",
    quote:
      "Founder-led made all the difference. We talked directly to the person doing the work, with zero friction.",
  },
  {
    name: "Emily Zhang",
    role: "Product Manager",
    quote:
      "Thoughtful design, no buzzwords, no jank. Exactly the kind of partner we wanted for our redesign.",
  },
];

export const stats = [
  { value: "97%", label: "Client Success" },
  { value: "24h", label: "Response Time" },
  { value: "100%", label: "Custom Builds" },
];
