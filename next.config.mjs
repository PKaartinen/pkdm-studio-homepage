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
    ];
  },
};

export default nextConfig;
