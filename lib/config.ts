interface ApiConfig {
  baseUrl: string;
  timeout: number;
}

interface DebugConfig {
  enabled: boolean;
}

interface Config {
  api: ApiConfig;
  debug: DebugConfig;
  isDevelopment: boolean;
}

// Simple function to get environment variables
const getEnvVar = (key: string, fallback: string = ""): string => {
  return process.env[key] || fallback;
};

// Get the API base URL
const getApiBaseUrl = (): string => {
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    const devUrl = process.env.NEXT_PUBLIC_DEV_API_BASE_URL;
    console.log("🔍 Dev URL from env:", devUrl);
    return devUrl || "https://e-back.stat.uz/api/";
  } else {
    const prodUrl = process.env.NEXT_PUBLIC_PROD_API_BASE_URL;
    console.log("🔍 Prod URL from env:", prodUrl);
    return prodUrl || "https://e-back.stat.uz/api/";
  }
};

// Configuration object
export const config: Config = {
  api: {
    baseUrl: getApiBaseUrl(),
    timeout: parseInt(getEnvVar("NEXT_PUBLIC_API_TIMEOUT", "30000"), 10),
  },
  debug: {
    enabled: getEnvVar("NEXT_PUBLIC_DEBUG_MODE", "true") === "true",
  },
  isDevelopment: process.env.NODE_ENV === "development",
};

// Validation function
export const validateConfig = (): void => {
  const errors: string[] = [];

  if (!config.api.baseUrl) {
    errors.push("API base URL is required");
  }

  if (config.api.timeout <= 0) {
    errors.push("API timeout must be greater than 0");
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed: ${errors.join(", ")}`);
  }

  // Always log in development for debugging
  if (config.isDevelopment) {
    console.log("🔧 Configuration loaded:", {
      NODE_ENV: process.env.NODE_ENV,
      apiBaseUrl: config.api.baseUrl,
      timeout: config.api.timeout,
      isDevelopment: config.isDevelopment,
      debugEnabled: config.debug.enabled,
      envVars: {
        NEXT_PUBLIC_DEV_API_BASE_URL: process.env.NEXT_PUBLIC_DEV_API_BASE_URL,
        NEXT_PUBLIC_PROD_API_BASE_URL:
          process.env.NEXT_PUBLIC_PROD_API_BASE_URL,
        NEXT_PUBLIC_API_TIMEOUT: process.env.NEXT_PUBLIC_API_TIMEOUT,
        NEXT_PUBLIC_DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE,
      },
    });
  }
};
