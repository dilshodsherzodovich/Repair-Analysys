"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { authService } from "@/api/services/auth.service";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import type { UserData } from "@/api/types/auth";

interface AuthGuardProps {
  children: React.ReactNode;
  publicRoutes?: string[];
}

const DEFAULT_PUBLIC_ROUTES = ["/login"];

// Get default route based on user role
function getDefaultRouteForRole(user: UserData | null): string {
  if (!user || !user.role) return "/";

  const role = user.role.toLowerCase();

  // sriv_moderator and sriv_admin should go to /delays
  if (role === "sriv_moderator" || role === "sriv_admin") {
    return "/delays";
  }

  // Default route for other roles
  return "/";
}

export function AuthGuard({ children, publicRoutes }: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const { getAllQueryValues } = useFilterParams();

  const { token, user, expires, refresh_token } = getAllQueryValues();

  const safePublicRoutes = useMemo(
    () => publicRoutes || DEFAULT_PUBLIC_ROUTES,
    [publicRoutes]
  );
  const isLoginPage = pathname === "/login";
  const isPublicRoute = safePublicRoutes.includes(pathname);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const hasAuthParams = Boolean(token && user);

    if (hasAuthParams) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(user));
        const expiryDate = expires || undefined;

        authService.storeAuth(
          token,
          refresh_token || "",
          parsedUser,
          expiryDate
        );
        // Redirect to role-specific default route
        const defaultRoute = getDefaultRouteForRole(parsedUser);
        router.replace(defaultRoute);
        return;
      } catch (error) {
        console.error("Failed to store auth params from URL", error);
      }
    }

    const isAuthenticated = authService.isAuthenticated();
    if (!isAuthenticated && !isPublicRoute) {
      router.push("/login");
    } else if (isAuthenticated && isLoginPage) {
      // Get user from storage and redirect to their default route
      const storedUser = authService.getUser();
      const defaultRoute = getDefaultRouteForRole(storedUser);
      router.push(defaultRoute);
    }
  }, [
    expires,
    isClient,
    isLoginPage,
    isPublicRoute,
    refresh_token,
    router,
    token,
    user,
  ]);

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
