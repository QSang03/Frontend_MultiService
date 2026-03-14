'use client';

import { useState } from 'react';
import { UserCircle, Mail, Phone, Shield, Key, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui';

export default function SaleProfilePage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [overrides, setOverrides] = useState<{ name?: string; phone?: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);

  const form = {
    name: overrides.name ?? user?.name ?? '',
    phone: overrides.phone ?? user?.phone ?? '',
  };

  const phoneRegex = /^(0|\+84)[3-9]\d{8}$/;
  const isPhoneInvalid = phoneTouched && form.phone.length > 0 && !phoneRegex.test(form.phone);
  const isDirty = form.name !== (user?.name ?? '') || form.phone !== (user?.phone ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      addToast('Vui lòng nhập họ và tên.', { type: 'error' });
      return;
    }
    setIsSaving(true);
    // TODO: gọi API cập nhật profile
    await new Promise((r) => setTimeout(r, 800));
    setIsSaving(false);
    addToast('Cập nhật thông tin thành công!', { type: 'success' });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
        <p className="text-gray-500 mt-1">Quản lý thông tin tài khoản Sale</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col items-center">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <UserCircle className="w-16 h-16 text-emerald-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">{user?.name || 'Nhân viên Sale'}</h2>
          <p className="text-sm text-gray-500 mt-1">{user?.email || ''}</p>
          <span className="mt-3 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
            Sale
          </span>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Thông tin cá nhân</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setOverrides(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nhập họ và tên"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    readOnly
                    title="Email không thể thay đổi"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setOverrides(prev => ({ ...prev, phone: e.target.value }))}
                    onBlur={() => setPhoneTouched(true)}
                    placeholder="Số điện thoại"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isPhoneInvalid ? 'border-red-400' : ''}`}
                  />
                </div>
                {isPhoneInvalid && <p className="text-xs text-red-500 mt-1">Số điện thoại không hợp lệ</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phòng ban</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input
                    type="text"
                    value="Phòng kinh doanh"
                    readOnly
                    title="Phòng ban do quản trị viên quản lý"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Phòng ban được quản lý bởi admin.</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving || !isDirty || isPhoneInvalid}
                className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Đang lưu...' : 'Cập nhật'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-gray-600" />
          Bảo mật
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg opacity-60">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">Đổi mật khẩu</p>
                <p className="text-xs text-gray-400">Cập nhật mật khẩu đăng nhập</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-500 cursor-not-allowed select-none">
              Sắp ra mắt
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg opacity-60">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">Xác thực 2 yếu tố (MFA)</p>
                <p className="text-xs text-gray-400">Bảo vệ tài khoản bằng OTP</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-500 cursor-not-allowed select-none">
              Sắp ra mắt
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
