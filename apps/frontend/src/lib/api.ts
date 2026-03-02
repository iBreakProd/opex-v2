import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

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
