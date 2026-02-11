import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/constants';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies for auth
});

let isRefreshing = false;
let refreshPromise: Promise<unknown> | null = null;

// Response interceptor with automatic token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (typeof window === 'undefined') {
        // Don't refresh on server side
        return Promise.reject(error);
      }

      // If already refreshing, wait for that refresh to complete
      if (isRefreshing) {
        try {
          await refreshPromise;
          return axiosInstance(originalRequest);
        } catch {
          return Promise.reject(error);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // Call Next.js API route to refresh token (uses protobuf)
      refreshPromise = fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // Include cookies
      })
        .then(async (res) => {
          // Parse body and handle MFA requirement explicitly
          const json = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(json?.error || 'Refresh failed');
          if (json?.mfa_required) {
            // Redirect user to MFA verification flow with token
            if (typeof window !== 'undefined') {
              const token = json.mfa_token ? `?mfa_token=${encodeURIComponent(json.mfa_token)}` : '';
              window.location.href = `/verify-mfa${token}`;
            }
            throw new Error('MFA_REQUIRED');
          }
          return json;
        })
        .finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });

      try {
        await refreshPromise;
        // Retry original request with new token from cookies
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
