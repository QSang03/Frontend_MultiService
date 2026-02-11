'use client';

import { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/components/ui';
import { Card, CardHeader, CardBody, Button, Input, ConfirmModal } from '@/components/ui';
import { MfaSetup } from '@/components/forms';
import { SessionsList } from '@/components/dashboard';
import { disableMfa, getRecoveryCodes } from '@/app/actions/mfa';
import { deleteAccount } from '@/app/actions/profile';
import type { User } from '@/types';

type TabType = 'profile' | 'security' | 'sessions';

export default function ProfilePage() {
  const { profile, isLoading, fetchProfile, updateProfile } = useProfile();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('profile');

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  const [showDisableMfaModal, setShowDisableMfaModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalPassword, setModalPassword] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    console.log('Profile data:', profile);
    console.log('Profile loading:', isLoading);
    if (profile) {
      console.log('Setting form with profile:', profile);
      setForm({
        full_name: profile.name || profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
      });
      // Set MFA status from profile
      setMfaEnabled(profile.mfa_enabled || false);
    }
  }, [profile, isLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSave = async () => {
    const payload = {
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
    };

    const res = await updateProfile(payload as Partial<User>);
    if (res.success) {
      toast.addToast('Cập nhật thông tin thành công', { type: 'success' });
      fetchProfile();
    } else {
      toast.addToast(res.error || 'Cập nhật thất bại', { type: 'error' });
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.old_password || !passwordForm.new_password) {
      toast.addToast('Vui lòng nhập đủ thông tin mật khẩu', { type: 'info' });
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.addToast('Mật khẩu mới và xác nhận không khớp', { type: 'error' });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await (await import('@/services/api')).authApi.changePassword({
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });
      if (res.success) {
        toast.addToast('Đổi mật khẩu thành công', { type: 'success' });
        setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
      } else {
        toast.addToast(res.error || 'Đổi mật khẩu thất bại', { type: 'error' });
      }
    } catch (err) {
      toast.addToast((err as Error)?.message || 'Đổi mật khẩu thất bại', { type: 'error' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleMfaSetupComplete = () => {
    setShowMfaSetup(false);
    setMfaEnabled(true);
    toast.addToast('MFA đã được bật thành công!', { type: 'success' });
    // Refresh profile from server to persist and reflect actual backend state
    fetchProfile();
  };

  const handleDisableMfa = async () => {
    setShowDisableMfaModal(true);
  };

  const handleDeleteAccount = async () => {
    setShowDeleteModal(true);
  };

  const confirmDisableMfa = async () => {
    if (!modalPassword) return;
    setModalLoading(true);
    try {
      const result = await disableMfa(modalPassword);
      if (result.success) {
        setMfaEnabled(false);
        toast.addToast('MFA đã được tắt', { type: 'success' });
        setShowDisableMfaModal(false);
        setModalPassword('');
      } else {
        toast.addToast(result.error || 'Không thể tắt MFA', { type: 'error' });
      }
    } catch (err) {
      toast.addToast((err as Error)?.message || 'Không thể tắt MFA', { type: 'error' });
    } finally {
      setModalLoading(false);
    }
  };

  const handleGetRecoveryCodes = async () => {
    try {
      const result = await getRecoveryCodes();
      if (result.success && result.codes) {
        setRecoveryCodes(result.codes);
        setShowRecoveryCodes(true);
      } else {
        toast.addToast(result.error || 'Không thể lấy recovery codes', { type: 'error' });
      }
    } catch (err) {
      toast.addToast((err as Error)?.message || 'Không thể lấy recovery codes', { type: 'error' });
    }
  };

  const confirmDeleteAccount = async () => {
    if (!modalPassword) return;
    setModalLoading(true);
    try {
      const res = await deleteAccount(modalPassword);
      if (res.success) {
        toast.addToast(res.message || 'Tài khoản đã được xóa', { type: 'success' });
        window.location.href = '/login';
      } else {
        toast.addToast(res.error || 'Xóa tài khoản thất bại', { type: 'error' });
      }
    } catch (err) {
      toast.addToast((err as Error)?.message || 'Xóa tài khoản thất bại', { type: 'error' });
    } finally {
      setModalLoading(false);
      setShowDeleteModal(false);
      setModalPassword('');
    }
  };

  return (
    <>
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tài khoản của tôi</h1>
        <p className="text-gray-600 mt-1">Quản lý thông tin cá nhân của bạn</p>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            👤 Thông tin cá nhân
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'security'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🔐 Bảo mật
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'sessions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🛡️ Phiên đăng nhập
          </button>
        </nav>
      </div>

      {/* Tab: Profile */}
      {activeTab === 'profile' && (
        <div className="grid gap-6">
          <Card variant="bordered">
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Thông tin cá nhân</h2>
            </CardHeader>
            <CardBody>
              <div className="flex items-center space-x-6 mb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">
                    {profile?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{profile?.name || 'Người dùng'}</h3>
                  <p className="text-gray-500">{profile?.email || 'email@example.com'}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Họ và tên"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="Nhập họ tên"
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Nhập email"
                  disabled
                />
                <Input
                  label="Số điện thoại"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div className="mt-6">
                <Button variant="primary" onClick={handleSave} disabled={isLoading}>
                  Cập nhật thông tin
                </Button>
              </div>
            </CardBody>
          </Card>
          <Card variant="bordered">
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">More</h2>
            </CardHeader>
            <CardBody>
              <div className="grid gap-4">
                <div className="bg-gray-800 text-white rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Delete Account</h3>
                    <p className="text-sm text-gray-200">Xóa tài khoản vĩnh viễn. Không thể khôi phục.</p>
                  </div>
                  <div>
                    <Button variant="danger" onClick={handleDeleteAccount}>Delete</Button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Tab: Security */}
      {activeTab === 'security' && (
        <div className="grid gap-6">
          <Card variant="bordered">
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Đổi mật khẩu</h2>
            </CardHeader>
            <CardBody>
              <div className="grid gap-4 max-w-md">
                <Input
                  label="Mật khẩu hiện tại"
                  type="password"
                  name="old_password"
                  value={passwordForm.old_password}
                  onChange={(e) => setPasswordForm(s => ({ ...s, old_password: e.target.value }))}
                  placeholder="Nhập mật khẩu hiện tại"
                />
                <Input
                  label="Mật khẩu mới"
                  type="password"
                  name="new_password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm(s => ({ ...s, new_password: e.target.value }))}
                  placeholder="Nhập mật khẩu mới"
                />
                <Input
                  label="Xác nhận mật khẩu mới"
                  type="password"
                  name="confirm_password"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm(s => ({ ...s, confirm_password: e.target.value }))}
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>

              <div className="mt-6">
                <Button variant="outline" onClick={handleChangePassword} disabled={isChangingPassword}>
                  {isChangingPassword ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* MFA Management Card */}
          <Card variant="bordered">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Xác thực 2 yếu tố (2FA)</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Tăng cường bảo mật tài khoản với xác thực 2 lớp
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {mfaEnabled && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                      Đã bật
                    </span>
                  )}
                  {!mfaEnabled && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                      Chưa bật
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardBody>
              {!showMfaSetup && !showRecoveryCodes && (
                <div className="space-y-4">
                  <p className="text-gray-700">
                    {mfaEnabled 
                      ? 'MFA đang được kích hoạt. Bạn sẽ cần nhập mã xác thực từ ứng dụng mỗi khi đăng nhập.'
                      : 'Bảo vệ tài khoản của bạn bằng cách yêu cầu mã xác thực từ ứng dụng di động khi đăng nhập.'
                    }
                  </p>

                  <div className="flex flex-wrap gap-3">
                    {!mfaEnabled ? (
                      <Button 
                        variant="primary" 
                        onClick={() => setShowMfaSetup(true)}
                      >
                        🔐 Bật MFA
                      </Button>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            onClick={handleDisableMfa}
                          >
                            ❌ Tắt MFA
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleGetRecoveryCodes}
                          >
                            🔑 Lấy Recovery Codes
                          </Button>
                        </div>
                      </>
                    )}
                  </div>

                  {!mfaEnabled && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                      <h4 className="font-semibold text-blue-900 text-sm mb-2">💡 Hướng dẫn:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                        <li>Cài đặt Google Authenticator hoặc Authy trên điện thoại</li>
                        <li>Click &quot;Bật MFA&quot; và quét mã QR</li>
                        <li>Nhập mã 6 chữ số để xác nhận</li>
                        <li>Lưu recovery codes ở nơi an toàn</li>
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {showMfaSetup && profile?.id && (
                <MfaSetup
                  userId={profile.id}
                  onComplete={handleMfaSetupComplete}
                  onCancel={() => setShowMfaSetup(false)}
                />
              )}

              {showRecoveryCodes && recoveryCodes.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Recovery Codes</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Lưu các mã này ở nơi an toàn. Mỗi mã chỉ có thể sử dụng một lần khi bạn không thể truy cập ứng dụng xác thực.
                    </p>
                  </div>

                  <div className="bg-gray-50 border rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                      {recoveryCodes.map((code, i) => (
                        <div key={i} className="bg-white px-3 py-2 rounded border">
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const text = recoveryCodes.join('\n');
                        navigator.clipboard.writeText(text);
                        toast.addToast('Đã copy recovery codes', { type: 'success' });
                      }}
                    >
                      📋 Copy
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowRecoveryCodes(false)}
                    >
                      Đóng
                    </Button>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      ⚠️ <strong>Quan trọng:</strong> In hoặc lưu các mã này vào nơi an toàn. 
                      Bạn sẽ cần chúng nếu mất quyền truy cập vào ứng dụng xác thực.
                    </p>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Tab: Sessions */}
      {activeTab === 'sessions' && (
        <div>
          <SessionsList />
        </div>
      )}
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

    <ConfirmModal
      open={showDeleteModal}
      title="Xóa tài khoản"
      description="Việc này sẽ xóa vĩnh viễn tài khoản của bạn. Nhập mật khẩu để xác nhận."
      inputLabel="Mật khẩu"
      inputValue={modalPassword}
      onInputChange={setModalPassword}
      confirmLabel="Xóa"
      cancelLabel="Hủy"
      onConfirm={confirmDeleteAccount}
      onClose={() => { setShowDeleteModal(false); setModalPassword(''); }}
      isLoading={modalLoading}
    />
    </>
  );
}
