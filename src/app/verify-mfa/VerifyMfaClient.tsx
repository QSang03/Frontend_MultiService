"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function VerifyMfaClient() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useSearchParams();
  const mfaToken = params?.get('mfa_token') || '';
  const [mfaTokenState, setMfaTokenState] = useState(mfaToken);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [info, setInfo] = useState<string | null>(null);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/validate-mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mfaToken, code }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        router.push(json.redirect || '/');
      } else {
        setError(json.error || 'Xác thực thất bại');
      }
    } catch {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setInfo(null);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Gửi lại thất bại');
        return;
      }
      if (json?.mfa_required) {
        setMfaTokenState(json.mfa_token || '');
        setInfo('Mã đã được gửi lại. Vui lòng kiểm tra ứng dụng MFA.');
        setResendCooldown(60);
        // update url param for convenience
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          if (json.mfa_token) url.searchParams.set('mfa_token', json.mfa_token);
          window.history.replaceState({}, '', url.toString());
        }
      } else {
        setInfo('Không cần xác thực MFA.');
      }
    } catch {
      setError('Lỗi kết nối khi gửi lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-xl font-bold mb-2">Xác thực MFA</h1>
        <p className="text-sm text-gray-500 mb-4">Nhập mã 2FA từ ứng dụng hoặc thiết bị của bạn.</p>

        {mfaTokenState && (
          <div className="text-xs text-gray-500 mb-3 break-all">Token: {mfaTokenState}</div>
        )}

        {info && <div className="text-sm text-green-600 mb-3">{info}</div>}
        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Mã xác thực</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
              placeholder="123456"
              inputMode="numeric"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Bạn chưa nhận được mã?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || loading}
                className="text-blue-600 hover:underline disabled:opacity-50"
              >
                {resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : 'Gửi lại'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? 'Đang...' : 'Xác thực'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
