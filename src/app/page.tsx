import { headers } from "next/headers";
import { DM_Mono } from "next/font/google";
import ShowcaseDeviceGate from "@/components/showcase/device-gate";
import ShowcaseStaticPage from "@/components/showcase/static-page";
import { site } from "@/data/site";

// ---------------------------------------------------------------------------
// The homepage IS the 3D showcase ("The Click") — promoted from /showcase per
// founder decision F-3 (2026-07-18). /showcase now permanently redirects here
// (see next.config.mjs), so shared links and ?tour=1 keep working.
// ---------------------------------------------------------------------------

// DM Mono — showcase annotations + loader counter (founder-confirmed F-5).
// next/font self-hosts at build time; scoped via the .showcase-root wrapper.
const dmMono = DM_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500"],
  variable: "--font-mono",
});

// Two-stage gate, stage 1 (server UA hint, v6 canon): mobile UAs get the pure
// Server Component static page, so a phone's tree never references any 3D
// client code. iPad is deliberately NOT matched here — iPadOS reports a macOS
// UA; stage 2 (device-gate.tsx: reduced-motion / max-width 767px / hover:none
// / pointer:coarse) catches it on the client.
const MOBILE_UA =
  /iPhone|iPod|Windows Phone|IEMobile|Opera Mini|BlackBerry|webOS|Android.+Mobile/i;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "PKDM Studio",
  legalName: "PKDM Services OÜ",
  description:
    "Founder-led web design & development studio building unique, conversion-focused websites — from marketing sites to AI web apps, marketplaces, and eCommerce.",
  url: site.url,
  email: site.email,
  image: `${site.url}/og.png`,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Juhkentali tn 8",
    postalCode: "10132",
    addressLocality: "Tallinn",
    addressCountry: "EE",
  },
  areaServed: "Europe",
  founder: { "@type": "Person", name: "Pietari Kaartinen" },
};

export default async function Home() {
  const ua = (await headers()).get("user-agent") ?? "";
  const content = MOBILE_UA.test(ua) ? (
    <ShowcaseStaticPage />
  ) : (
    <ShowcaseDeviceGate />
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className={`showcase-root ${dmMono.variable}`}>{content}</div>
    </>
  );
}
