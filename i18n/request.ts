import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

const locales = ["uz", "ru"] as const;
type Locale = (typeof locales)[number];

export default getRequestConfig(async () => {
  const store = await cookies();
  const rawLocale = store.get("locale")?.value;

  let locale: Locale;
  if (rawLocale === "uz" || rawLocale === "ru") {
    locale = rawLocale;
  } else {
    locale = "uz";
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});

