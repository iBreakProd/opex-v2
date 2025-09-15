import axios from "axios";

function resolveProdBase(): string | undefined {
  const envBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (envBase) return envBase;
  return undefined;
}

const baseURL = import.meta.env.DEV ? "/api/v1" : resolveProdBase();

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
