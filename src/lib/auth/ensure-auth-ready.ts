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
 * Client-side deduplication: concurrent calls share a single in-flight promise
 * for both /me and /refresh to prevent duplicate network requests and race
 * conditions with refresh token rotation.
 */

let _inFlightMe: Promise<{ ok: boolean; userId: string }> | null = null;
let _refreshingPromise: Promise<boolean> | null = null;
let _lastRefreshedAt = 0;
const REFRESH_REUSE_MS = 5_000;

/** Returns auth status only. Multiple concurrent calls share one in-flight /me request. */
export async function ensureAuthReady(): Promise<boolean> {
  const result = await _getMe();
  return result.ok;
}

/** Returns auth status + user_id in one /me call. Deduplicates concurrent calls. */
export async function ensureAuthReadyWithUserId(): Promise<{ ok: boolean; userId: string }> {
  return _getMe();
}

function _getMe(): Promise<{ ok: boolean; userId: string }> {
  if (_inFlightMe) return _inFlightMe;
  _inFlightMe = _doGetMe().finally(() => { _inFlightMe = null; });
  return _inFlightMe;
}

async function _doGetMe(): Promise<{ ok: boolean; userId: string }> {
  try {
    const meRes = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' });
    if (meRes.ok) {
      const json = await meRes.json().catch(() => ({})) as Record<string, unknown>;
      return { ok: true, userId: String(json?.user_id ?? '').trim() };
    }
    if (meRes.status !== 401) return { ok: false, userId: '' };

    // Token expired — if we refreshed very recently, trust the new token
    if (Date.now() - _lastRefreshedAt < REFRESH_REUSE_MS) return { ok: true, userId: '' };

    // Deduplicate refresh
    if (_refreshingPromise) {
      const refreshOk = await _refreshingPromise;
      return { ok: refreshOk, userId: '' };
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
      .finally(() => { _refreshingPromise = null; });

    const refreshOk = await _refreshingPromise;
    return { ok: refreshOk, userId: '' };
  } catch {
    return { ok: false, userId: '' };
  }
}
