import type { Metadata } from "next";
import Contact from "@/components/sections/Contact";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Tell PKDM Studio about your project. Get a thoughtful reply within 24 hours — straight from the founder.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main id="main" className="pt-20 md:pt-24">
      <Contact />
    </main>
  );
}
