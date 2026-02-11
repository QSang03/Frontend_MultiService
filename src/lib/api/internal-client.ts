import axios, { AxiosError, type AxiosRequestConfig } from 'axios';

// Client requests to our own Next.js API routes (which proxy to backend or handle logic)
const internalApiClient = axios.create({
  baseURL: '/', // Calls to the Next.js app itself
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies to Next.js backend
});

let isRefreshing = false;
let refreshPromise: Promise<unknown> | null = null;

internalApiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (AxiosRequestConfig & { _retry?: boolean });

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (typeof window === 'undefined') {
          // Don't refresh on server side in this client
          return Promise.reject(error);
      }

      if (isRefreshing) {
        try {
            await refreshPromise;
            return internalApiClient(originalRequest);
        } catch {
            return Promise.reject(error);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      refreshPromise = fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      })
        .then(async (res) => {
          const json = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(json?.error || 'Refresh failed');
          if (json?.mfa_required) {
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
        // Wait a bit for cookies to propagate if necessary?
        // Usually not needed if fetch completed, but sometimes race conditions occur.
        return internalApiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default internalApiClient;
