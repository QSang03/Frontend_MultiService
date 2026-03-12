/**
 * Client-side auth barrier. Call this before firing business API calls on mount
 * to avoid SESSION_EXPIRED when the access token has just expired but the
 * refresh token is still valid.
 *
 * Flow:
 *   1. GET /api/auth/me — if 200: token is fresh, proceed immediately.
 *   2. If 401: POST /api/auth/refresh — if 200: token renewed, proceed.
 *   3. Otherwise (network error, 403, refresh token expired, …): return false.
 *      Callers should redirect to /login.
 */
export async function ensureAuthReady(): Promise<boolean> {
  try {
    const meRes = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' });
    if (meRes.ok) return true;
    if (meRes.status !== 401) return false;

    const refreshRes = await fetch('/api/auth/refresh', {
      method: 'POST',
      cache: 'no-store',
      credentials: 'include',
    });
    return refreshRes.ok;
  } catch {
    return false;
  }
}
