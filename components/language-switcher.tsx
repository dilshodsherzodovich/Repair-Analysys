"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/button";

type Locale = "uz" | "ru";

function getInitialLocale(): Locale {
  if (typeof document === "undefined") return "uz";
  const match = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
  const value = match?.[1];
  if (value === "ru" || value === "uz") return value;
  return "uz";
}

export function LanguageSwitcher() {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>("uz");

  useEffect(() => {
    setLocale(getInitialLocale());
  }, []);

  const handleChange = (nextLocale: Locale) => {
    if (nextLocale === locale) return;

    const maxAge = 60 * 60 * 24 * 365; // 1 year
    document.cookie = `locale=${nextLocale}; path=/; max-age=${maxAge}`;
    setLocale(nextLocale);
    router.refresh();
  };

  const baseClasses =
    "h-8 px-3 text-xs font-medium rounded-full border transition-colors";

  return (
    <div className="flex items-center gap-1 mr-4">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={`${baseClasses} ${
          locale === "uz"
            ? "bg-sky-600 text-white border-sky-600 hover:bg-sky-700 hover:text-white"
            : "text-slate-600 border-slate-200 hover:bg-slate-100"
        }`}
        onClick={() => handleChange("uz")}
      >
        UZ
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={`${baseClasses} ${
          locale === "ru"
            ? "bg-sky-600 text-white border-sky-600 hover:bg-sky-700 hover:text-white"
            : "text-slate-600 border-slate-200 hover:bg-slate-100"
        }`}
        onClick={() => handleChange("ru")}
      >
        RU
      </Button>
    </div>
  );
}

