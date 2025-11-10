import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { config, validateConfig } from "@/lib/config";

// Validate configuration on import
validateConfig();

// Create axios instance for main API
const api: AxiosInstance = axios.create({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeout,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "any",
  },
});

// Request interceptor to add auth token (but not for login endpoint)
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Don't add token for login endpoint
    if (config.url?.includes("/user/login/")) {
      return config;
    }

    const token = localStorage.getItem("auth_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Check if request has no_page parameter
    const hasNoPage =
      response.config.params?.no_page === true ||
      response.config.params?.no_page === "true" ||
      response.config.url?.includes("no_page=true");

    if (hasNoPage) {
      // Wrap response data in PaginatedData structure
      response.data = {
        results: response.data,
        count: response.data?.length || 0,
        next: null,
        previous: null,
      };
    }

    return response;
  },
  (error) => {
    // Only redirect to login for genuine authentication issues
    if (error.response?.status === 401) {
      const token = localStorage.getItem("auth_token");

      // Only redirect if:
      // 1. We have a token (meaning user was logged in)
      // 2. We are not already on the login page
      // 3. The error is specifically about authentication (not just any 401)
      if (
        token &&
        typeof window !== "undefined" &&
        !window.location.pathname.includes("/login")
      ) {
        // Check if this is likely a token expiration issue
        const errorMessage = error.response?.data?.message || "";
        const isAuthError =
          error.response?.data?.Unauthorized ||
          errorMessage.toLowerCase().includes("unauthorized") ||
          errorMessage.toLowerCase().includes("token") ||
          errorMessage.toLowerCase().includes("authentication");

        if (isAuthError) {
          console.log(
            "Authentication error detected, showing session expired modal..."
          );
          localStorage.removeItem("auth_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user");
          localStorage.removeItem("auth_expiry");
          // Instead of redirecting, dispatch a custom event
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("session-expired"));
          }
          // Do not redirect here; modal will handle re-login
        }
      }
    }

    // Log the error for debugging (only in development or when debug is enabled)
    if (config.debug.enabled) {
      console.error("API Error:", error);
    }

    return Promise.reject(error);
  }
);

export default api;
