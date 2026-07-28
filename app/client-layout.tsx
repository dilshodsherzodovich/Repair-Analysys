"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { SnackbarProvider } from "@/providers/snackbar-provider";
import { MainLayout } from "@/layout/main-layout";
import { StandaloneLayout } from "@/layout/standalone-layout";
import { QueryProvider } from "@/api/providers/QueryProvider";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { usePathname, useSearchParams } from "next/navigation";

const PASSPORT_ROUTE = /^\/depo\/[^/]+\/locomotive\/[^/]+\/?$/;

/**
 * Whether a page renders full-bleed: no header, no sidebar, just the page.
 * Unlike `publicRoutes` these stay behind `AuthGuard` — they drop the chrome,
 * not the authentication.
 *
 * Only the passport's dashboard design (`?design=new`) is chrome-less; the
 * classic design is an ordinary page with the usual header and sidebar.
 */
function isChromeless(pathname: string, design: string | null) {
  return PASSPORT_ROUTE.test(pathname) && design === "new";
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const publicRoutes = ["/login", "/defective-works/create", "/auth/callback"];
  const isPublicRoute = publicRoutes.includes(pathname);

  const Layout = isChromeless(pathname, searchParams.get("design"))
    ? StandaloneLayout
    : MainLayout;

  return (
    <QueryProvider>
      <SnackbarProvider>
        <AuthGuard publicRoutes={publicRoutes}>
          {isPublicRoute ? children : <Layout>{children}</Layout>}
        </AuthGuard>
      </SnackbarProvider>

      <ReactQueryDevtools initialIsOpen={false} />
    </QueryProvider>
  );
}
