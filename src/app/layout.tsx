import type { Metadata, Viewport } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { site } from "@/data/site";
import SmoothScroll from "@/components/SmoothScroll";
import Background from "@/components/Background";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import HideOnAdmin from "@/components/HideOnAdmin";
import Tracker from "@/components/Tracker";

// DM Sans — body copy. Warm, readable, matches the live PKDM Studio site.
const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

// Space Grotesk — headings. Geometric, techy character for a stronger, premium feel.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const title = "PKDM Studio — Websites Built to Convert";
const description =
  "PKDM Studio is a founder-led web design & development studio. We build unique, conversion-focused websites — from marketing sites to AI web apps, marketplaces, and eCommerce — that build trust and are built to sell.";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: title,
    template: "%s · PKDM Studio",
  },
  description,
  applicationName: "PKDM Studio",
  keywords: [
    "web design studio",
    "web development studio",
    "conversion-focused websites",
    "landing page design",
    "eCommerce development",
    "AI web apps",
    "web development Europe",
    "Tallinn web design",
  ],
  authors: [{ name: "Pietari Kaartinen" }],
  creator: "PKDM Studio",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: site.url,
    siteName: "PKDM Studio",
    title,
    description,
    images: [{ url: "/og.png", width: 2400, height: 1260, alt: "PKDM Studio" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#04060f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans antialiased">
        <HideOnAdmin>
          <SmoothScroll />
          <Background />
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-ink-950"
          >
            Skip to content
          </a>
          <Nav />
        </HideOnAdmin>
        {children}
        <HideOnAdmin>
          <Footer />
        </HideOnAdmin>
        <Tracker />
        <Analytics />
      </body>
    </html>
  );
}
