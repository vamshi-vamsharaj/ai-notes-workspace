// frontend/src/services/api.ts
import axios, { type AxiosInstance, AxiosError } from "axios";
import { supabase } from "@/lib/supabase";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds
});

// ─── Request Interceptor: Attach JWT ──────────────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Handle Auth Errors ─────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired — try refreshing once
      const { data } = await supabase.auth.refreshSession();

      if (data.session && error.config) {
        // Retry the original request with the new token
        error.config.headers.Authorization = `Bearer ${data.session.access_token}`;
        return api.request(error.config);
      } else {
        // Refresh failed — force logout
        await supabase.auth.signOut();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;