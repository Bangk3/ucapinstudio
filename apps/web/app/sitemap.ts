import type { MetadataRoute } from "next";

// Intentionally just the marketing homepage. This is a multi-tenant app —
// individual wedding invitations under /[tenant]/u/* are private content
// (see their own `robots: noindex`), not something to enumerate here.
export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return [
    {
      url: appUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
