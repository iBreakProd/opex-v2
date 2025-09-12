function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function loadBackendConfig() {
  return {
    CORS_ORIGIN: getRequiredEnv("CORS_ORIGIN"),
    HTTP_PORT: getRequiredEnv("HTTP_PORT"),
    JWT_SECRET: getRequiredEnv("JWT_SECRET"),
    API_BASE_URL: getRequiredEnv("API_BASE_URL"),
  };
}

export type BackendConfig = ReturnType<typeof loadBackendConfig>;
