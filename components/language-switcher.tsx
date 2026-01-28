"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

type Locale = "uz" | "ru";

const LOCALES: { code: Locale; label: string; name: string; flag: string }[] = [
  { code: "uz", label: "UZ", name: "Oʻzbek", flag: "🇺🇿" },
  { code: "ru", label: "RU", name: "Русский", flag: "🇷🇺" },
];

function getInitialLocale(): Locale {
  if (typeof document === "undefined") return "uz";
  const match = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
  const value = match?.[1];
  if (value === "uz" || value === "ru") return value;
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

    // Force a full reload so all server components
    // pick up the new locale immediately
    if (typeof window !== "undefined") {
      window.location.reload();
    } else {
      router.refresh();
    }
  };

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <div className="mr-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-2 rounded-full border-slate-300 bg-white px-3 py-1 text-xs font-medium shadow-sm hover:bg-slate-50"
          >
            <span className="text-base leading-none">{current.flag}</span>
            <span>{current.label}</span>
            <ChevronDown className="h-3 w-3 text-slate-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[140px]">
          {LOCALES.map((item) => (
            <DropdownMenuItem
              key={item.code}
              onClick={() => handleChange(item.code)}
              className="flex items-center gap-2 text-sm"
            >
              <span className="text-base leading-none">{item.flag}</span>
              <span className="font-medium">{item.label}</span>
              <span className="ml-auto text-[11px] text-slate-500">
                {item.name}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

