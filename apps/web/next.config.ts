import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const config: NextConfig = {
  output: "standalone",
  transpilePackages: [
    "@invyte/ai",
    "@invyte/ui",
    "@invyte/shared",
    "@invyte/db",
    "@invyte/templates",
    "@invyte/storage",
    "@invyte/messaging",
  ],
  turbopack: {
    root: "../../",
  },
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.minio.local",
      },
    ],
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default withNextIntl(config);
