import api from "../axios";
import { LoginCredentials, LoginResponse, UserData } from "../types/auth";

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

  logout: (): void => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    localStorage.removeItem("auth_expiry");
    window.location.href = "/login";
  },

  isAuthenticated: (): boolean => {
    const token = localStorage.getItem("auth_token");
    const user = localStorage.getItem("user");

    if (!token || !user) {
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

  getUser: (): UserData | null => {
    try {
      const userData = localStorage.getItem("user");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error parsing stored user:", error);
      return null;
    }
  },

  storeAuth: (
    accessToken: string,
    refreshToken: string,
    user: UserData,
    expiryDate?: string
  ): void => {
    localStorage.setItem("auth_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    localStorage.setItem("user", JSON.stringify(user));

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
