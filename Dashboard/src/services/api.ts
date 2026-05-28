import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import type { ApiErrorResponse } from "@/types/api";
import { useAuthStore } from "@/stores/auth-store";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8000";
const API_PREFIX = "/api/v1";
const TIMEOUT_MS = 15_000;
const RETRY_COUNT = 2;

type RetryConfig = AxiosRequestConfig & { _retryCount?: number };

export const api = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  timeout: TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const { session } = useAuthStore.getState();
  if (session?.apiKey) {
    config.headers.set("x-guardaiian-api-key", session.apiKey);
  }
  if (session?.accessToken) {
    config.headers.set("Authorization", `Bearer ${session.accessToken}`);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const original = error.config as RetryConfig | undefined;
    if (!original) throw error;

    const status = error.response?.status;
    if (status === 401) {
      const refreshed = await useAuthStore.getState().refreshSession();
      if (refreshed) {
        return api.request(original);
      }
      useAuthStore.getState().logout();
    }

    if (!status || status >= 500) {
      original._retryCount = (original._retryCount ?? 0) + 1;
      if ((original._retryCount ?? 0) <= RETRY_COUNT) {
        const backoff = 250 * 2 ** (original._retryCount - 1);
        await new Promise((r) => setTimeout(r, backoff));
        return api.request(original);
      }
    }

    throw error;
  },
);

export function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return "Unexpected error occurred.";
  }
  const detail = error.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (typeof detail === "object" && detail?.message) return detail.message;
  return error.response?.data?.message ?? error.message;
}
