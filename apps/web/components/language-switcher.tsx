"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

const LOCALES = ["id", "en"] as const;
type Locale = (typeof LOCALES)[number];

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  function switchLocale(newLocale: Locale) {
    // The request config reads the "locale" cookie (see i18n/request.ts).
    // Write it and refresh so Server Components pick up the new value.
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1">
      {LOCALES.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => switchLocale(loc)}
          className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
            locale === loc
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-label={loc === "id" ? "Bahasa Indonesia" : "English"}
          aria-pressed={locale === loc}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
