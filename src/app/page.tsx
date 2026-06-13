import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Hero from "@/components/sections/Hero";
import Marquee from "@/components/sections/Marquee";
import Services from "@/components/sections/Services";
import Projects from "@/components/sections/Projects";
import Pillars from "@/components/sections/Pillars";
import Insights from "@/components/sections/Insights";
import Process from "@/components/sections/Process";
import Testimonials from "@/components/sections/Testimonials";
import Contact from "@/components/sections/Contact";
import { site } from "@/data/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "PKDM Studio",
  legalName: "PKDM Services OÜ",
  description:
    "Founder-led web design & Webflow development studio building unique, conversion-focused websites.",
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

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav />
      <main id="main">
        <Hero />
        <Marquee />
        <Services />
        <Projects />
        <Pillars />
        <Process />
        <Insights />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
