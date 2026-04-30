import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

// ── Request interceptor — attach access token ────────────────────────────────
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('jethro_access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor — auto-refresh on 401 ───────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem('jethro_refresh_token');
      if (!refreshToken) throw new Error('No refresh token');

      const { data } = await axios.post<{ data: { tokens: { accessToken: string; refreshToken: string } } }>(
        `${BASE_URL}/api/v1/auth/refresh`,
        { refreshToken },
      );

      const { accessToken, refreshToken: newRefresh } = data.data.tokens;
      localStorage.setItem('jethro_access_token',  accessToken);
      localStorage.setItem('jethro_refresh_token', newRefresh);

      apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      processQueue(null, accessToken);

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      // Clear tokens and redirect to login
      localStorage.removeItem('jethro_access_token');
      localStorage.removeItem('jethro_refresh_token');
      if (typeof window !== 'undefined') window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// ── Typed helpers ─────────────────────────────────────────────────────────────
export const api = {
  get:    <T>(url: string, params?: Record<string, unknown>) =>
    apiClient.get<{ success: boolean; data: T }>(url, { params }).then((r) => r.data.data),
  post:   <T>(url: string, body?: unknown) =>
    apiClient.post<{ success: boolean; data: T }>(url, body).then((r) => r.data.data),
  patch:  <T>(url: string, body?: unknown) =>
    apiClient.patch<{ success: boolean; data: T }>(url, body).then((r) => r.data.data),
  delete: <T>(url: string) =>
    apiClient.delete<{ success: boolean; data: T }>(url).then((r) => r.data.data),
};
