"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { authService } from "@/api/services/auth.service";
import { useFilterParams } from "@/lib/hooks/useFilterParams";
import type { UserData } from "@/api/types/auth";
import { isEchAccount } from "@/lib/permissions";

interface AuthGuardProps {
  children: React.ReactNode;
  publicRoutes?: string[];
}

const DEFAULT_PUBLIC_ROUTES = ["/login", "/auth/callback"];
const ECH_DEFAULT_ROUTE = "/defective-works";
const PUBLIC_DEFECT_CREATE_ROUTE = "/defective-works/create";

function isEchAllowedRoute(pathname: string): boolean {
  return (
    pathname === ECH_DEFAULT_ROUTE ||
    pathname.startsWith(`${ECH_DEFAULT_ROUTE}/`)
  );
}

function getDefaultRouteForRole(user: UserData | null): string {
  if (!user || !user.role) return "/";

  if (isEchAccount(user)) return ECH_DEFAULT_ROUTE;

  const role = user.role.toLowerCase();

  if (role === "sriv_moderator" || role === "sriv_admin") {
    return "/delays";
  }

  if (
    role === "payroll" ||
    role === "payroll_admin" ||
    role === "accountant"
  ) {
    return "/recovery";
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

  const { token, user, expires, refresh_token, page } = getAllQueryValues();

  const safePublicRoutes = useMemo(
    () => publicRoutes || DEFAULT_PUBLIC_ROUTES,
    [publicRoutes],
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

        // Map organization_id to depo_id
        const ORG_TO_DEPO_ID: Record<number, number> = {
          1: 1,
          2: 2,
          3: 7,
          4: 6,
          5: 3,
          6: 4,
          7: 8,
          8: 5,
        };
        const orgId =
          parsedUser.organization_id || parsedUser.branch?.organization?.id;
        if (orgId && ORG_TO_DEPO_ID[orgId]) {
          parsedUser.emm_depo_id = ORG_TO_DEPO_ID[orgId];
        }

        authService.storeAuth(
          token,
          refresh_token || "",
          parsedUser,
          expiryDate,
        );

        const defaultRoute =
          isEchAccount(parsedUser)
            ? ECH_DEFAULT_ROUTE
            : page || getDefaultRouteForRole(parsedUser);
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

      if (
        isEchAccount(storedUser) &&
        pathname === PUBLIC_DEFECT_CREATE_ROUTE
      ) {
        router.replace(ECH_DEFAULT_ROUTE);
        return;
      }

      // ECH is a stricter account scope than role. Even an admin ECH account
      // cannot navigate to non-revision pages by entering their URL directly.
      if (
        isEchAccount(storedUser) &&
        !isPublicRoute &&
        !isEchAllowedRoute(pathname)
      ) {
        router.replace(ECH_DEFAULT_ROUTE);
        return;
      }

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

  if (!isPublicRoute && authService.isAuthenticated()) {
    const storedUser = authService.getUser();
    if (
      isEchAccount(storedUser) &&
      !isEchAllowedRoute(pathname)
    ) {
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


  if (
    isPublicRoute &&
    pathname === PUBLIC_DEFECT_CREATE_ROUTE &&
    authService.isAuthenticated() &&
    isEchAccount(authService.getUser())
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yo'naltirilmoqda...</p>
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
