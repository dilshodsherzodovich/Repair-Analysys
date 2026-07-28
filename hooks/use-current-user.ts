"use client";

import { authService } from "@/api/services/auth.service";

/**
 * Current user, for components ported from dejurniy that expect a hook.
 * This project keeps the user in localStorage rather than a query, so this is
 * a thin adapter over `authService`.
 */
export function useCurrentUser() {
  return authService.getUser();
}
