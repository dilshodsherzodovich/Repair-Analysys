"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { SnackbarProvider } from "@/providers/snackbar-provider";
import { MainLayout } from "@/layout/main-layout";
import { QueryProvider } from "@/api/providers/QueryProvider";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { usePathname } from "next/navigation";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const publicRoutes = ["/login", "/defective-works/create"];
  const isPublicRoute = publicRoutes.includes(pathname);

  return (
    <QueryProvider>
      <SnackbarProvider>
        <AuthGuard publicRoutes={publicRoutes}>
          {isPublicRoute ? children : <MainLayout>{children}</MainLayout>}
        </AuthGuard>
      </SnackbarProvider>

      <ReactQueryDevtools initialIsOpen={false} />
    </QueryProvider>
  );
}
