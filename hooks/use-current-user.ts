"use client";

import { useMe } from "@/api/hooks/use-auth";
import { authService } from "@/api/services/auth.service";

/**
 * Current user from `/account/auth/me/`, like dejurniy. `AuthGuard` loads it
 * before pages render, so the in-memory copy covers the first render.
 */
export function useCurrentUser() {
  const { data } = useMe(authService.isAuthenticated());
  return data ?? authService.getUser();
}
