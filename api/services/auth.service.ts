import api from "../axios";
import { LoginCredentials, LoginResponse, UserData } from "../types/auth";
import { config, getSmartDepoUrl } from "@/lib/config";

const ORG_TO_EMM_ID: Record<number, number> = {
  1: 1,
  2: 2,
  3: 7,
  4: 6,
  5: 3,
  6: 4,
  7: 8,
  8: 5,
};

/** Maps an organization to its EMM depo id (tu152 integration). */
export function getEmmDepoId(user: UserData | null): number | undefined {
  const orgId = user?.branch?.organization?.id;
  return orgId ? ORG_TO_EMM_ID[orgId] : undefined;
}

/**
 * The signed-in user, loaded from `/account/auth/me/` by `AuthGuard` before
 * any page renders. Kept in memory only: localStorage holds just the tokens.
 */
let currentUser: UserData | null = null;

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      const response = await api.post("/account/auth/login/", credentials);
      return response.data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  oauthCallback: async (code: string, state?: string): Promise<LoginResponse> => {
    const response = await api.get("/account/auth/oauth/callback/", {
      params: { code, ...(state !== undefined && { state }) },
    });
    return response.data;
  },

  getMe: async (): Promise<UserData> => {
    const response = await api.get<UserData>("/account/auth/me/");
    return response.data;
  },

  clearStorage: (): void => {
    currentUser = null;
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("auth_expiry");
    // Left by older versions that kept the user in storage
    localStorage.removeItem("user");
    localStorage.removeItem("user_emm_depo_id");
  },

  logout: (): void => {
    authService.clearStorage();
    if (typeof window !== "undefined") {
      window.location.href = `${getSmartDepoUrl()}/?redirect_uri=${encodeURIComponent(
        window.location.origin,
      )}&clear_session=true`
    }
  },

  isAuthenticated: (): boolean => {
    const token = localStorage.getItem("auth_token");

    if (!token) {
      return false;
    }

    const expiry = localStorage.getItem("auth_expiry");
    if (expiry) {
      const expiryDate = new Date(expiry);
      const now = new Date();
      const isExpired = expiryDate <= now;

      if (isExpired) {
        authService.logout();
        return false;
      }
    }

    return true;
  },

  getToken: (): string | null => {
    return localStorage.getItem("auth_token");
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem("refresh_token");
  },

  getUser: (): UserData | null => currentUser,

  setUser: (user: UserData | null): void => {
    currentUser = user;
  },

  /** Persists only the tokens; the user is kept in memory. */
  storeAuth: (
    accessToken: string,
    refreshToken: string,
    user?: UserData | null,
    expiryDate?: string,
  ): void => {
    localStorage.setItem("auth_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    // Drop what older versions stored besides the tokens
    localStorage.removeItem("user");
    localStorage.removeItem("user_emm_depo_id");
    if (user) currentUser = user;

    if (expiryDate) {
      localStorage.setItem("auth_expiry", expiryDate);
    }
  },

  storeToken: (token: string, expiryDate: string): void => {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_expiry", expiryDate);
  },

  getTokenExpiry: (token: string): Date | null => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return new Date(payload.exp * 1000);
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  },
};
