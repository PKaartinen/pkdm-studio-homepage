export type Project = {
  name: string;
  category: string;
  image: string;
  width: number;
  height: number;
  // Live URL — leave "" to render the card WITHOUT an outbound link.
  // Fill these in to link each card to the client's live site.
  url: string;
  featured: boolean;
};

// ---------------------------------------------------------------------------
// PROJECT LIVE URLS
// ---------------------------------------------------------------------------
// To link a card to its live site, set `url` to the full https:// address.
// An empty string ("") renders the card with no outbound link (no dead links).
// ---------------------------------------------------------------------------
export const projects: Project[] = [
  {
    name: "Skillful Traders",
    category: "Prop Trading Firm",
    image: "/projects/skillful-traders-1.png",
    width: 1400,
    height: 787,
    url: "",
    featured: true,
  },
  {
    name: "PrivateByRight VPN",
    category: "VPN Website",
    image: "/projects/privatebyright-1.png",
    width: 1400,
    height: 766,
    url: "",
    featured: true,
  },
  {
    name: "Breakthrough Capital",
    category: "Financial Services",
    image: "/projects/breakthrough-1.png",
    width: 1400,
    height: 699,
    url: "",
    featured: true,
  },
  {
    name: "Unifolio",
    category: "University Matching Quiz",
    image: "/projects/unifolio-1.png",
    width: 1400,
    height: 1189,
    url: "",
    featured: true,
  },
  {
    name: "ClearPen",
    category: "SaaS Marketing Site",
    image: "/projects/clearpen-1.png",
    width: 1400,
    height: 698,
    url: "",
    featured: true,
  },
  {
    name: "eCommerce Lander",
    category: "Conversion Landing Page",
    image: "/projects/ecom-lander-1.png",
    width: 1400,
    height: 817,
    url: "",
    featured: true,
  },
  // --- Secondary row ---
  {
    name: "Arctic Lab",
    category: "Brand & Product Site",
    image: "/projects/arctic-lab.png",
    width: 1400,
    height: 840,
    url: "",
    featured: false,
  },
  {
    name: "Legacy Academy",
    category: "Education Platform",
    image: "/projects/legacy-academy.png",
    width: 1400,
    height: 840,
    url: "",
    featured: false,
  },
  {
    name: "Cable Killer",
    category: "Product Landing Page",
    image: "/projects/cable-killer-1.png",
    width: 1400,
    height: 772,
    url: "",
    featured: false,
  },
  {
    name: "Yeti Blue",
    category: "Product Landing Page",
    image: "/projects/yeti-blue-1.png",
    width: 1400,
    height: 812,
    url: "",
    featured: false,
  },
];

export const clientLogos = [
  { name: "ClearPen", src: "/clients/clearpen.svg" },
  { name: "CLICKPLAY", src: "/clients/clickplay.svg" },
  { name: "MBP", src: "/clients/mbp.svg" },
  { name: "Secureflex.uk", src: "/clients/secureflex.svg" },
  { name: "SkinLabLED", src: "/clients/skinlabled.svg" },
  { name: "SneakValue", src: "/clients/sneakvalue.svg" },
  { name: "Unifolio", src: "/clients/unifolio.svg" },
];
