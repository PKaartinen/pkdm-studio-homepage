/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      // "The Click" showcase was promoted to the homepage (founder decision
      // F-3, 2026-07-18). Permanent redirect preserves query strings, so
      // shared /showcase?tour=1 links keep working.
      {
        source: "/showcase",
        destination: "/",
        permanent: true,
      },
      // Legacy / commonly-guessed paths people still land on from old links —
      // route them to the current equivalents instead of a 404.
      { source: "/home", destination: "/", permanent: true },
      { source: "/work", destination: "/projects", permanent: true },
      { source: "/work/:slug", destination: "/projects/:slug", permanent: true },
      { source: "/portfolio", destination: "/projects", permanent: true },
      { source: "/blog", destination: "/insights", permanent: true },
      { source: "/blog/:slug", destination: "/insights/:slug", permanent: true },
      { source: "/articles", destination: "/insights", permanent: true },
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/contact-us", destination: "/contact", permanent: true },
    ];
  },
};

export default nextConfig;
