import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [45, 60, 75],
    // Product & collection photos can be uploaded (Vercel Blob) or pasted
    // from any image host in /admin, so allow any HTTPS source. next/image
    // only fetches and re-encodes remote images, never executes them.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default withNextIntl(nextConfig);
