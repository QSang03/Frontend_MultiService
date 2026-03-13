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
 *
 * Client-side deduplication: concurrent calls share a single refresh promise
 * to prevent race conditions with refresh token rotation (backend revokes old
 * token after first use — a second parallel refresh would fail with the same
 * already-rotated token).
 */

// Shared promise for in-flight refresh. Prevents parallel pages from each
// issuing their own refresh when the access token just expired.
let _refreshingPromise: Promise<boolean> | null = null;
let _lastRefreshedAt = 0;
const REFRESH_REUSE_MS = 5_000; // treat a <5s-old refresh as still valid

export async function ensureAuthReady(): Promise<boolean> {
  try {
    const meRes = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' });
    if (meRes.ok) return true;
    if (meRes.status !== 401) return false;

    // Token expired — if we refreshed very recently, trust the new token is
    // in-flight/set and avoid a redundant (and destructive) second rotation.
    if (Date.now() - _lastRefreshedAt < REFRESH_REUSE_MS) {
      return true;
    }

    // Deduplicate: if another call is already refreshing, wait for it.
    if (_refreshingPromise) {
      return _refreshingPromise;
    }

    _refreshingPromise = fetch('/api/auth/refresh', {
      method: 'POST',
      cache: 'no-store',
      credentials: 'include',
    })
      .then((res) => {
        if (res.ok) _lastRefreshedAt = Date.now();
        return res.ok;
      })
      .catch(() => false)
      .finally(() => {
        _refreshingPromise = null;
      });

    return _refreshingPromise;
  } catch {
    return false;
  }
}
