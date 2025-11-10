"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthGuard } from "@/components/auth/auth-guard";
import { SnackbarProvider } from "@/providers/snackbar-provider";
import { MainLayout } from "@/layout/main-layout";
import { useState } from "react";
import { QueryProvider } from "@/api/providers/QueryProvider";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { usePathname } from "next/navigation";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isLoginPage = usePathname() === "/login";

  return (
    <QueryProvider>
      <SnackbarProvider>
        <AuthGuard>
          {isLoginPage ? children : <MainLayout>{children}</MainLayout>}
        </AuthGuard>
      </SnackbarProvider>

      <ReactQueryDevtools initialIsOpen={false} />
    </QueryProvider>
  );
}
