import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Local-dev parity with the client-upload flow used for collection
  // videos and product/collection photos (src/app/admin/blob-upload/
  // route.ts) — raising this alone
  // does NOT make large uploads work in production, since Vercel
  // Serverless Functions enforce their own ~4.5MB platform-level request
  // cap that no Next.js config can raise. Real video uploads go through
  // @vercel/blob/client instead, bypassing this limit entirely; this
  // setting only matters for anyone testing against a raw Server Action.
  experimental: {
    serverActions: { bodySizeLimit: "20mb" },
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
