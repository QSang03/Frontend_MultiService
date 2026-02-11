'use client';

import { useState, useEffect } from 'react';
import { MfaSetup } from '@/components/forms';
import { disableMfa, getRecoveryCodes } from '@/app/actions/mfa';
import { Button, ConfirmModal } from '@/components/ui';
import { useToast } from '@/components/ui';

export default function MfaTestPage() {
  const [showSetup, setShowSetup] = useState(false);
  const [userId, setUserId] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [showDisableMfaModal, setShowDisableMfaModal] = useState(false);
  const [modalPassword, setModalPassword] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    // Get user from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserId(user.id || '');
  }, []);

  const handleSetupComplete = () => {
    setShowSetup(false);
    setMessage('✅ MFA đã được bật thành công!');
  };

  const handleDisableMfa = async () => {
    setShowDisableMfaModal(true);
  };

  const confirmDisableMfa = async () => {
    if (!modalPassword) return;
    setModalLoading(true);
    try {
      const result = await disableMfa(modalPassword);
      if (result.success) {
        setMessage('✅ MFA đã được tắt');
        setShowDisableMfaModal(false);
        setModalPassword('');
        toast.addToast('MFA đã được tắt', { type: 'success' });
      } else {
        setMessage('❌ ' + (result.error || 'Không thể tắt MFA'));
        toast.addToast(result.error || 'Không thể tắt MFA', { type: 'error' });
      }
    } catch (err) {
      setMessage('❌ ' + ((err as Error)?.message || 'Không thể tắt MFA'));
      toast.addToast((err as Error)?.message || 'Không thể tắt MFA', { type: 'error' });
    } finally {
      setModalLoading(false);
    }
  };

  const handleGetRecoveryCodes = async () => {
    const result = await getRecoveryCodes();
    if (result.success && result.codes) {
      setRecoveryCodes(result.codes);
    } else {
      setMessage('❌ ' + (result.error || 'Không thể lấy recovery codes'));
    }
  };

  return (
    <>
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">MFA Test Page</h1>
        <p className="text-gray-600 mt-1">Test MFA functionality</p>
      </div>

      {message && (
        <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg">
          {message}
        </div>
      )}

      {!showSetup ? (
        <div className="space-y-4">
          <div className="bg-white border rounded-lg p-6">
            <h2 className="font-semibold mb-4">MFA Actions</h2>
            <div className="space-y-2">
              <Button
                onClick={() => setShowSetup(true)}
                className="w-full"
                disabled={!userId}
              >
                🔐 Bật MFA (Setup 2FA)
              </Button>

              <Button
                onClick={handleDisableMfa}
                variant="outline"
                className="w-full"
              >
                ❌ Tắt MFA
              </Button>

              <Button
                onClick={handleGetRecoveryCodes}
                variant="outline"
                className="w-full"
              >
                🔑 Lấy Recovery Codes
              </Button>
            </div>
          </div>

          {recoveryCodes.length > 0 && (
            <div className="bg-white border rounded-lg p-6">
              <h3 className="font-semibold mb-3">Recovery Codes</h3>
              <div className="bg-gray-50 p-4 rounded font-mono text-sm space-y-1">
                {recoveryCodes.map((code, i) => (
                  <div key={i}>{code}</div>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Lưu các mã này ở nơi an toàn. Mỗi mã chỉ dùng được 1 lần.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border rounded-lg p-6">
          <MfaSetup
            userId={userId}
            onComplete={handleSetupComplete}
            onCancel={() => setShowSetup(false)}
          />
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
        <h3 className="font-semibold text-yellow-800 mb-2">💡 Hướng dẫn test:</h3>
        <ol className="list-decimal list-inside space-y-1 text-yellow-700">
          <li>Cài app xác thực: Google Authenticator hoặc Authy</li>
          <li>Click &quot;Bật MFA&quot; → Quét QR code bằng app</li>
          <li>Nhập mã 6 số từ app để verify</li>
          <li>Logout và login lại → sẽ yêu cầu nhập MFA code</li>
          <li>Test recovery codes nếu cần</li>
        </ol>
      </div>
    </div>
    <ConfirmModal
      open={showDisableMfaModal}
      title="Tắt MFA"
      description="Nhập mật khẩu để xác nhận tắt MFA"
      inputLabel="Mật khẩu"
      inputValue={modalPassword}
      onInputChange={setModalPassword}
      confirmLabel="Xác nhận"
      cancelLabel="Hủy"
      onConfirm={confirmDisableMfa}
      onClose={() => { setShowDisableMfaModal(false); setModalPassword(''); }}
      isLoading={modalLoading}
    />
    </>
  );
}
