export type ProjectImage = { src: string; width: number; height: number };

export type Project = {
  slug: string;
  name: string;
  category: string;
  // Card / hero image
  image: ProjectImage;
  // Additional screenshots shown on the project detail page
  gallery: ProjectImage[];
  summary: string;
  description: string;
  services: string[];
  // Live URL — leave "" to render WITHOUT an outbound link (no dead links).
  url: string;
  featured: boolean;
};

const img = (src: string, width: number, height: number): ProjectImage => ({
  src,
  width,
  height,
});

// ---------------------------------------------------------------------------
// PROJECT LIVE URLS
// ---------------------------------------------------------------------------
// To link a card/detail page to the live site, set `url` to the full https://
// address. An empty string ("") hides the outbound link for that project.
// ---------------------------------------------------------------------------
export const projects: Project[] = [
  {
    slug: "skillful-traders",
    name: "Skillful Traders",
    category: "Prop Trading Firm",
    image: img("/projects/skillful-traders-1.png", 1400, 787),
    gallery: [
      img("/projects/skillful-traders-2.png", 1400, 787),
      img("/projects/skillful-traders-3.png", 1600, 900),
    ],
    summary:
      "A high-trust marketing site for a proprietary trading firm, built to turn cautious visitors into funded traders.",
    description:
      "Skillful Traders needed a site that felt credible from the first scroll. We led with clear proof, structured the funding offer around a single obvious action, and kept the interface fast and distraction-free so visitors move straight from interest to sign-up.",
    services: ["Strategy & UX", "Web Design", "Web Development"],
    url: "",
    featured: true,
  },
  {
    slug: "privatebyright-vpn",
    name: "PrivateByRight VPN",
    category: "VPN Website",
    image: img("/projects/privatebyright-1.png", 1400, 766),
    gallery: [
      img("/projects/privatebyright-2.png", 1400, 766),
      img("/projects/privatebyright-3.png", 1600, 875),
      img("/projects/privatebyright-4.png", 1600, 875),
    ],
    summary:
      "A privacy-first product site for a censorship-resistant VPN, balancing bold messaging with hard reassurance.",
    description:
      "For PrivateByRight we built a site that sells freedom without feeling vague. Sharp positioning up top, clear platform options, and trust signals throughout — all wrapped in a dark, confident interface that matches the product's mission.",
    services: ["Web Design", "Web Development", "Content"],
    url: "",
    featured: true,
  },
  {
    slug: "breakthrough-capital",
    name: "Breakthrough Capital",
    category: "Financial Services",
    image: img("/projects/breakthrough-1.png", 1400, 699),
    gallery: [
      img("/projects/breakthrough-2.png", 1400, 699),
      img("/projects/breakthrough-3.png", 1600, 800),
      img("/projects/breakthrough-4.png", 1600, 800),
    ],
    summary:
      "A polished financial-services site designed to communicate authority and make the next step obvious.",
    description:
      "Breakthrough Capital operates in a space where trust is everything. We gave them a refined, modern site with a clear narrative, strong hierarchy, and conversion paths that guide prospects toward a conversation.",
    services: ["Strategy & UX", "Web Design", "Web Development"],
    url: "",
    featured: true,
  },
  {
    slug: "unifolio",
    name: "Unifolio",
    category: "University Matching Quiz",
    image: img("/projects/unifolio-1.png", 1400, 1189),
    gallery: [
      img("/projects/unifolio-2.png", 1600, 1359),
      img("/projects/unifolio-3.png", 1600, 1359),
      img("/projects/unifolio-4.png", 1600, 1359),
    ],
    summary:
      "A friendly, guided product experience that helps students find the right university match.",
    description:
      "Unifolio turns a complex decision into a simple, guided quiz. We designed an approachable interface that keeps students moving through each step, with clear progress and a payoff that feels worth the effort.",
    services: ["UI/UX Systems", "Web Design", "Web Development"],
    url: "",
    featured: true,
  },
  {
    slug: "clearpen",
    name: "ClearPen",
    category: "SaaS Marketing Site",
    image: img("/projects/clearpen-1.png", 1400, 698),
    gallery: [
      img("/projects/clearpen-2.png", 1400, 698),
      img("/projects/clearpen-3.png", 1600, 800),
      img("/projects/clearpen-4.png", 1600, 800),
    ],
    summary:
      "A clean SaaS marketing site that explains the product fast and pushes visitors to try it.",
    description:
      "ClearPen needed to make a software product feel simple. We focused the messaging, built a clear feature story, and designed a calm, modern interface that lets the product do the talking.",
    services: ["Strategy & UX", "Web Design", "Content"],
    url: "",
    featured: true,
  },
  {
    slug: "ecommerce-lander",
    name: "eCommerce Lander",
    category: "Conversion Landing Page",
    image: img("/projects/ecom-lander-1.png", 1400, 817),
    gallery: [
      img("/projects/ecom-lander-2.png", 1600, 934),
      img("/projects/ecom-lander-3.png", 1600, 934),
    ],
    summary:
      "A focused product landing page engineered around a single offer and a single action.",
    description:
      "This landing page exists to do one thing: convert traffic into purchases. We structured it around the offer, layered in proof and objection-handling, and kept the path to checkout short and frictionless.",
    services: ["Conversion Landing Page", "Web Design", "Web Development"],
    url: "",
    featured: true,
  },
  {
    slug: "arctic-lab",
    name: "Arctic Lab",
    category: "Brand & Product Site",
    image: img("/projects/arctic-lab.png", 1400, 840),
    gallery: [],
    summary: "A crisp brand and product site with a clean, modern identity.",
    description:
      "Arctic Lab wanted a site that felt as precise as their product. We built a clean, confident interface with strong typography and clear product storytelling.",
    services: ["Web Design", "Web Development"],
    url: "",
    featured: false,
  },
  {
    slug: "legacy-academy",
    name: "Legacy Academy",
    category: "Education Platform",
    image: img("/projects/legacy-academy.png", 1400, 840),
    gallery: [],
    summary:
      "An education platform site built to inform, reassure, and drive enrolment.",
    description:
      "Legacy Academy needed to explain their programs clearly and build confidence with prospective students. We designed a structured, trustworthy site with obvious next steps.",
    services: ["Strategy & UX", "Web Design"],
    url: "",
    featured: false,
  },
  {
    slug: "cable-killer",
    name: "Cable Killer",
    category: "Product Landing Page",
    image: img("/projects/cable-killer-1.png", 1400, 772),
    gallery: [img("/projects/cable-killer-2.png", 1600, 882)],
    summary: "A punchy product landing page built to convert cold traffic.",
    description:
      "Cable Killer needed a landing page that grabs attention and closes fast. We led with a strong hook, made the value obvious, and drove everything toward a single call to action.",
    services: ["Conversion Landing Page", "Web Design"],
    url: "",
    featured: false,
  },
  {
    slug: "yeti-blue",
    name: "Yeti Blue",
    category: "Product Landing Page",
    image: img("/projects/yeti-blue-1.png", 1400, 812),
    gallery: [],
    summary: "A bold product landing page with a clear, single-minded offer.",
    description:
      "Yeti Blue needed a focused page that sells one product well. We built a clean, high-contrast layout that keeps attention on the offer and the action.",
    services: ["Conversion Landing Page", "Web Design"],
    url: "",
    featured: false,
  },
];

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
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
