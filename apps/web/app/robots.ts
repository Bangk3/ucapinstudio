import type { MetadataRoute } from "next";

// Individual wedding invitation pages (/[tenant]/u/*) carry their own
// `robots: noindex` in generateMetadata (see those page.tsx files) — path-based
// multi-tenancy means the tenant slug is unpredictable so it can't be globbed
// here. This file only blocks the app's known private/functional routes.
export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/*/dashboard", "/auth/", "/order/"],
    },
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
