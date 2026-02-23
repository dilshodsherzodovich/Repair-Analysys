import type React from "react";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "./client-layout";
import { NextIntlClientProvider } from "next-intl";
import { cookies } from "next/headers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Elektron ta'mir tahlili tizimi",
  description:
    "Lokomotiv ta'mir tahlillarini elektron boshqarish va hisobot yuritish tizimi",
  generator: "Smart Depo",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("locale")?.value;
  const locale = rawLocale === "ru" ? "ru" : "uz";
  const messages = (await import(`../messages/${locale}.json`)).default;

  return (
    <html
      lang="uz"
      className={`${inter.variable} ${inter.className}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Suspense fallback={<div className="p-6">Yuklanmoqda...</div>}>
          <NextIntlClientProvider messages={messages} locale={locale}>
            <ClientLayout>{children}</ClientLayout>
          </NextIntlClientProvider>
        </Suspense>
      </body>
    </html>
  );
}
