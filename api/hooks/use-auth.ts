"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "../services/auth.service";
import { LoginCredentials } from "../types/auth";
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
      // Normalize user data

      // Get token expiry from JWT
      const expiryDate = authService.getTokenExpiry(data.access);

      // Store tokens and user data
      authService.storeAuth(
        data.access,
        data.refresh,
        data.user_data,
        expiryDate?.toISOString()
      );

      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: [queryKeys.auth.login] });

      // Redirect to home page
      router.push("/");
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
