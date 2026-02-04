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

function getDefaultRouteForRole(user: UserData | null): string {
  if (!user || !user.role) return "/";

  const role = user.role.toLowerCase();

  if (role === "sriv_moderator" || role === "sriv_admin") {
    return "/delays";
  }

  if (role === "repair_staff") {
    return `/duty-uzel/${user?.branch?.organization?.id}`;
  }

  if (role === "passport_staff") {
    return `/depo/${user?.branch?.organization?.id}`;
  }

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
      return;
    }

    if (isAuthenticated) {
      const storedUser = authService.getUser();
      const defaultRoute = getDefaultRouteForRole(storedUser);

      // If on login page, redirect to default route
      if (isLoginPage) {
        router.push(defaultRoute);
        return;
      }

      // If on root path and user should be on a different default route, redirect
      if (pathname === "/" && defaultRoute !== "/") {
        router.replace(defaultRoute);
        return;
      }
    }
  }, [
    expires,
    isClient,
    isLoginPage,
    isPublicRoute,
    pathname,
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
          <p className="text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!isPublicRoute && !authService.isAuthenticated()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            Avtorizatsiya sahifasiga yo'naltirilmoqda...
          </p>
        </div>
      </div>
    );
  }

  if (isLoginPage && authService.isAuthenticated()) {
    const storedUser = authService.getUser();
    const defaultRoute = getDefaultRouteForRole(storedUser);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Bosh sahifaga yo'naltirilmoqda...</p>
        </div>
      </div>
    );
  }

  // Check if authenticated user is on root but should be on a different default route
  if (authService.isAuthenticated() && pathname === "/") {
    const storedUser = authService.getUser();
    const defaultRoute = getDefaultRouteForRole(storedUser);
    if (defaultRoute !== "/") {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Yo'naltirilmoqda...</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
