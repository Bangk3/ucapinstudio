"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const LOCALES = ["id", "en"] as const;
type Locale = (typeof LOCALES)[number];

function readLocaleCookie(): Locale {
  if (typeof document === "undefined") return "id";
  const match = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
  const val = match?.[1];
  return val === "en" ? "en" : "id";
}

export function LanguageSwitcher() {
  const [locale, setLocale] = useState<Locale>("id");
  const router = useRouter();

  // Read cookie on mount (avoids SSR mismatch)
  useEffect(() => {
    setLocale(readLocaleCookie());
  }, []);

  function switchLocale(newLocale: Locale) {
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    setLocale(newLocale);
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
