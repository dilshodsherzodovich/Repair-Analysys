"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "../services/auth.service";
import { LoginCredentials, UserData } from "../types/auth";
import { queryKeys } from "../querykey";

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
