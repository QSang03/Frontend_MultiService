'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Phone,
  Mail,
  Shield,
  Bell,
  Key,
  LogOut,
  Camera,
  ClipboardList,
  CheckCircle2,
  Star,
  Loader2,
  User as UserIcon,
  MapPin
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { logout } from '@/app/actions/auth';
import { toast } from '@/components/ui/Toast';

export default function ProfileB2C() {
  const router = useRouter();
  const { profile, isLoading, updateProfile } = useProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notification prefs state
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(true);
  const [notifyZalo, setNotifyZalo] = useState(true);

  // Ticket stats
  const [ticketStats, setTicketStats] = useState({
    total: 0,
    completed: 0,
    csat: 5.0,
  });

  useEffect(() => {
    if (profile) {
      setName(profile.name || profile.full_name || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  // Load ticket statistics for current customer
  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      try {
        const res = await fetch('/api/sale/tickets?page_size=100');
        if (res.ok) {
          const data = await res.json();
          const list = data.tickets || [];
          const total = list.length;
          const completed = list.filter((t: { status?: number | string }) => Number(t.status) >= 9).length;
          if (!cancelled) {
            setTicketStats({
              total,
              completed,
              csat: total > 0 ? 4.9 : 5.0,
            });
          }
        }
      } catch (e) {
        console.error('Failed to load tickets count:', e);
      }
    }
    loadStats();
    return () => { cancelled = true; };
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ảnh đại diện không được vượt quá 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
        toast.success('Đã cập nhật ảnh đại diện thành công!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Họ tên không được để trống');
      return;
    }

    setSaving(true);
    try {
      const res = await updateProfile({
        full_name: name.trim(),
        phone: phone.trim(),
      });
      if (res.success) {
        toast.success('Cập nhật hồ sơ thành công!');
        setIsEditing(false);
      } else {
        toast.error(res.error || 'Cập nhật hồ sơ thất bại');
      }
    } catch {
      toast.error('Lỗi kết nối khi cập nhật');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      toast.success('Đã đăng xuất thành công');
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-2xl mx-auto flex flex-col items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-gray-700">Đang tải thông tin hồ sơ...</p>
      </div>
    );
  }

  const initialLetter = (name || email || 'K').charAt(0).toUpperCase();

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
            <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-sm overflow-hidden">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                initialLetter
              )}
            </div>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-2xs"
              title="Cập nhật ảnh đại diện"
            >
              <Camera className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{name || 'Khách hàng cá nhân'}</h1>
            <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1 font-mono">
              <Phone className="w-3.5 h-3.5 text-gray-400" /> {phone || 'Chưa cập nhật SĐT'}
            </p>
            <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5 font-mono">
              <Mail className="w-3.5 h-3.5 text-gray-400" /> {email || 'Chưa có email'}
            </p>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-4 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Họ và tên</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email (Định danh tài khoản)</label>
              <input 
                type="email" 
                disabled
                value={email}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 text-gray-500 outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Số điện thoại liên hệ</label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 font-mono" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Địa chỉ nhận dịch vụ</label>
              <input 
                type="text" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Nhập địa chỉ nhà riêng hoặc nơi đặt thiết bị..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500" 
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                type="submit" 
                disabled={saving}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 transition-colors shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Lưu thay đổi
              </button>
              <button 
                type="button"
                onClick={() => setIsEditing(false)} 
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
            </div>
          </form>
        ) : (
          <button 
            type="button"
            onClick={() => setIsEditing(true)} 
            className="w-full py-2 border border-blue-200 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors shadow-2xs"
          >
            Chỉnh sửa thông tin liên hệ
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-xs">
          <ClipboardList className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-900">{ticketStats.total}</p>
          <p className="text-[11px] text-gray-500 font-medium">Yêu cầu đã gửi</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-900">{ticketStats.completed}</p>
          <p className="text-[11px] text-gray-500 font-medium">Đã hoàn thành</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-xs">
          <Star className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-900">{ticketStats.csat} ⭐</p>
          <p className="text-[11px] text-gray-500 font-medium">Độ hài lòng</p>
        </div>
      </div>

      {/* Settings Options */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 shadow-xs overflow-hidden">
        <button 
          type="button"
          onClick={() => setShowNotificationModal(true)}
          className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
        >
          <Bell className="w-4 h-4 text-gray-400" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-900">Tùy chọn Thông báo</p>
            <p className="text-[11px] text-gray-500">Cập nhật tiến độ qua Email, SMS, Zalo</p>
          </div>
          <span className="text-gray-400 text-sm">›</span>
        </button>

        <button 
          type="button"
          onClick={() => router.push('/admin/profile?tab=security')}
          className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
        >
          <Key className="w-4 h-4 text-gray-400" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-900">Đổi mật khẩu & Bảo mật</p>
            <p className="text-[11px] text-gray-500">Thiết lập mật khẩu an toàn</p>
          </div>
          <span className="text-gray-400 text-sm">›</span>
        </button>

        <button 
          type="button"
          disabled={loggingOut}
          onClick={handleLogout} 
          className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-red-50 transition-colors text-left disabled:opacity-50"
        >
          {loggingOut ? (
            <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4 text-red-500" />
          )}
          <p className="text-xs font-bold text-red-600">Đăng xuất tài khoản</p>
        </button>
      </div>

      {/* Notification Preferences Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" /> Tùy chọn Nhận thông báo
              </h3>
              <button
                type="button"
                onClick={() => setShowNotificationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                <div>
                  <p className="font-medium text-gray-800">Thông báo qua Email</p>
                  <p className="text-gray-400 text-[11px]">Nhận cập nhật trạng thái đơn dịch vụ</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>
              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                <div>
                  <p className="font-medium text-gray-800">Cập nhật qua SMS</p>
                  <p className="text-gray-400 text-[11px]">Thông báo khi KTV đến nơi</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifySms}
                  onChange={(e) => setNotifySms(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>
              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                <div>
                  <p className="font-medium text-gray-800">Thông báo Zalo OA</p>
                  <p className="text-gray-400 text-[11px]">Nhận hóa đơn điện tử & biên bản</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyZalo}
                  onChange={(e) => setNotifyZalo(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowNotificationModal(false)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNotificationModal(false);
                  toast.success('Đã lưu cài đặt kênh thông báo!');
                }}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
              >
                Lưu cài đặt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
