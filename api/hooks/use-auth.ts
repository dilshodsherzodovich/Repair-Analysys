"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "../services/auth.service";
import { LoginCredentials, LoginResponse, UserData } from "../types/auth";
import { queryKeys } from "../querykey";
import { isEchAccount } from "@/lib/permissions";

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
      if (isEchAccount(userData)) {
        router.push("/defective-works");
      } else if (roleLower === "observer") {
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

/** Credentials login dedicated to the ECH entry point. The token is only
 * persisted after the backend profile proves that this is an ECH account. */
export function useEchLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const data = await authService.login(credentials);
      const { access: _access, refresh: _refresh, ...userData } = data;
      if (!isEchAccount(userData as UserData)) {
        throw new Error("Bu hisob ECH foydalanuvchisi emas");
      }
      return data;
    },
    onSuccess: (data) => {
      storeAuth(data);
      queryClient.invalidateQueries({ queryKey: [queryKeys.auth.login] });
      router.replace("/defective-works");
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

      if (isEchAccount(userData as UserData)) {
        router.replace("/defective-works");
      } else if (role === "sriv_moderator" || role === "sriv_admin") {
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
