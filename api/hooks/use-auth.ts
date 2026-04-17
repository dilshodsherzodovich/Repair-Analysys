"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "../services/auth.service";
import { LoginCredentials, LoginResponse, UserData } from "../types/auth";
import { queryKeys } from "../querykey";

export function storeAuth(data: LoginResponse): void {
  const { access, refresh, ...userData } = data;
  const expiryDate = authService.getTokenExpiry(access);
  authService.storeAuth(access, refresh, userData as UserData, expiryDate?.toISOString());
}

/**
 * Hook for login mutation
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      authService.login(credentials),
    onSuccess: (data) => {
      // Extract user data from response (user data is at root level now)
      // Since LoginResponse extends UserData, we can destructure it
      const { access, refresh, ...userData } = data;

      // Get token expiry from JWT
      const expiryDate = authService.getTokenExpiry(access);

      // Store tokens and user data
      authService.storeAuth(
        access,
        refresh,
        userData,
        expiryDate?.toISOString()
      );

      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: [queryKeys.auth.login] });

      // Redirect based on user role (case-insensitive)
      const roleLower = userData.role?.toLowerCase() || "";
      if (roleLower === "observer") {
        router.push("/bulletins");
      } else {
        router.push("/");
      }
    },
    onError: (error: Error) => {
      console.error("Login failed:", error.message);
    },
  });
}

export function useSsoCallback() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<LoginResponse, Error, { code: string; state?: string }>({
    mutationFn: ({ code, state }) => authService.oauthCallback(code, state),
    onSuccess: (data: LoginResponse) => {
      storeAuth(data);
      queryClient.invalidateQueries({ queryKey: [queryKeys.auth.login] });

      const { access, refresh, ...userData } = data;
      const role = (userData as UserData).role?.toLowerCase() || "";
      const orgId = (userData as UserData).branch?.organization?.id;

      if (role === "sriv_moderator" || role === "sriv_admin") {
        router.replace("/delays");
      } else if (role === "repair_staff") {
        router.replace(`/duty-uzel/${orgId}`);
      } else if (role === "passport_staff") {
        router.replace(`/depo/${orgId}`);
      } else {
        router.replace("/");
      }
    },
  });
}

/**
 * Hook for logout mutation
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => {
      authService.logout();
      return Promise.resolve();
    },
    onSuccess: () => {
      // Clear all queries
      queryClient.clear();

      // Redirect to login
      router.push("/login");
    },
  });
}
