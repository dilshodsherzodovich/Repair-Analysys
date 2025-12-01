"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { authService } from "@/api/services/auth.service";

interface AuthGuardProps {
  children: React.ReactNode;
  publicRoutes?: string[];
}

const DEFAULT_PUBLIC_ROUTES = ["/login"];

export function AuthGuard({ children, publicRoutes }: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  const safePublicRoutes = useMemo(
    () => publicRoutes || DEFAULT_PUBLIC_ROUTES,
    [publicRoutes]
  );
  const isLoginPage = pathname === "/login";
  const isPublicRoute = safePublicRoutes.includes(pathname);

  // Wait for client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only run redirect logic on client side
    if (!isClient) return;

    const isAuthenticated = authService.isAuthenticated();

    if (!isAuthenticated && !isPublicRoute) {
      // User is not authenticated and not on login page, redirect to login
      router.push("/login");
    } else if (isAuthenticated && isLoginPage) {
      // User is authenticated but on login page, redirect to home
      router.push("/");
    }
  }, [isClient, isLoginPage, isPublicRoute, router]);

  // Show loading state while initializing
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isPublicRoute && !authService.isAuthenticated()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (isLoginPage && authService.isAuthenticated()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
