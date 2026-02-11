'use client';

import { useState } from 'react';
import { generateMfa, verifyMfaSetup } from '@/app/actions/mfa';
import { Button, Input } from '@/components/ui';

interface MfaSetupProps {
  userId?: string;
  onComplete?: () => void;
  onCancel?: () => void;
}
export default function MfaSetup(props: MfaSetupProps) {
  const { onComplete, onCancel } = props;
  const [step, setStep] = useState<'generate' | 'verify'>('generate');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setIsLoading(true);
    setError('');

    const result = await generateMfa();

    if (result.success && result.qrCode && result.secret) {
      setQrCode(result.qrCode);
      setSecret(result.secret);
      setStep('verify');
    } else {
      // If backend reports MFA already enabled, treat as completed and close setup
      const err = result.error || '';
      if (err.toLowerCase().includes('already enabled')) {
        onComplete?.();
        return;
      }

      setError(result.error || 'Không thể tạo mã QR');
    }

    setIsLoading(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await verifyMfaSetup(code);

    if (result.success) {
      onComplete?.();
    } else {
      setError(result.error || 'Mã xác thực không đúng');
    }

    setIsLoading(false);
  };

  if (step === 'generate') {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Bật xác thực 2 yếu tố (2FA)</h3>
          <p className="text-sm text-gray-600 mt-1">
            Bảo vệ tài khoản của bạn với lớp bảo mật thứ hai
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Đang tạo...' : 'Tạo mã QR'}
          </Button>

          {onCancel && (
            <Button
              onClick={onCancel}
              variant="outline"
              className="w-full"
            >
              Hủy
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Quét mã QR</h3>
        <p className="text-sm text-gray-600 mt-1">
          Sử dụng ứng dụng xác thực (Google Authenticator, Authy, v.v.)
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white border rounded-lg p-4 space-y-4">
        {qrCode && (
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
              alt="QR Code"
              width={200}
              height={200}
              className="border rounded"
            />
          </div>
        )}

        {secret && (
          <div className="bg-gray-50 p-3 rounded text-center">
            <p className="text-xs text-gray-600 mb-1">Hoặc nhập mã thủ công:</p>
            <code className="text-sm font-mono">{secret}</code>
          </div>
        )}
      </div>

      <form onSubmit={handleVerify} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">
            Nhập mã xác thực 6 chữ số
          </label>
          <Input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            required
            className="text-center text-2xl tracking-widest"
          />
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
              Hủy
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
