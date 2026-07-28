"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authService } from "@/api/services/auth.service";

/**
 * Role gate for the ported report pages, mirroring dejurniy's `withRole`.
 *
 * Adapted in one place: the current user comes from `authService` (this
 * project reads it from localStorage) rather than a `useCurrentUser` query.
 * The redirect targets for roles this project does not issue are dropped —
 * anything unauthorised lands on `/`.
 */
export function withRole<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles: string[],
) {
  return function RoleProtected(props: React.PropsWithChildren<P>) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
      const user = authService.getUser();
      if (!user) return;
      const role = user.role as string;

      if (role && allowedRoles.includes(role)) {
        setAuthorized(true);
      } else {
        router.replace("/");
      }
    }, [router]);

    return authorized ? <WrappedComponent {...(props as P)} /> : null;
  };
}
