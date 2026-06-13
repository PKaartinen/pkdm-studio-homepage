import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import { site } from "@/data/site";
import SmoothScroll from "@/components/SmoothScroll";
import Background from "@/components/Background";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const sora = Sora({
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
});

const title = "PKDM Studio — Websites Built to Convert";
const description =
  "PKDM Studio is a founder-led web design & Webflow development studio. We build unique, conversion-focused websites that build trust and are built to sell.";

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
    "Webflow developer",
    "conversion-focused websites",
    "landing page design",
    "Webflow development Europe",
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
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <body className="font-sans antialiased">
        <SmoothScroll />
        <Background />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
