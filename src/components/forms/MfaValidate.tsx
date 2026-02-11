'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateMfaLogin } from '@/app/actions/mfa';
import { Button, Input } from '@/components/ui';
import { STORAGE_KEYS, getDashboardByRole } from '@/constants';

interface MfaValidateProps {
  mfaToken: string;
  onCancel?: () => void;
}

export default function MfaValidate({ mfaToken, onCancel }: MfaValidateProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await validateMfaLogin(mfaToken, code);

    if (result.success && result.user) {
      // Store user in localStorage (client-side)
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(result.user));
      
      // Redirect based on user role
      const dashboard = getDashboardByRole(result.user.role);
      router.push(dashboard);
    } else {
      setError(result.error || 'Mã xác thực không đúng');
      setCode('');
    }

    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Xác thực 2 yếu tố</h2>
        <p className="text-gray-600 mt-2">
          Nhập mã 6 chữ số từ ứng dụng xác thực của bạn
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Mã xác thực
          </label>
          <Input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            required
            autoFocus
            className="text-center text-2xl tracking-widest"
          />
          <p className="text-xs text-gray-500 mt-1">
            Mã có hiệu lực trong 30 giây
          </p>
        </div>

        <div className="space-y-2">
          <Button
            type="submit"
            disabled={isLoading || code.length !== 6}
            className="w-full"
          >
            {isLoading ? 'Đang xác thực...' : 'Xác nhận'}
          </Button>

          {onCancel && (
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              className="w-full"
            >
              Quay lại
            </Button>
          )}
        </div>
      </form>

      <div className="text-center text-sm text-gray-600">
        <p>Không nhận được mã?</p>
        <button
          type="button"
          className="text-blue-600 hover:underline mt-1"
          onClick={() => {
            // TODO: Implement recovery code flow
            alert('Chức năng recovery code đang phát triển');
          }}
        >
          Sử dụng mã khôi phục
        </button>
      </div>
    </div>
  );
}
