import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["id", "en"],
  defaultLocale: "id",
  // Only show locale prefix for non-default locales (e.g. /en/..., not /id/...)
  localePrefix: "as-needed",
});
