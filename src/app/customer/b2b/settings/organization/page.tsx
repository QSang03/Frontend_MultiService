'use client';

import { useState, useEffect, useRef } from 'react';
import { Building2, Save, Bell, Clock, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from '@/components/ui/Toast';

export default function OrganizationSettingsB2B() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [address, setAddress] = useState('');
  const [logoText, setLogoText] = useState('B');
  const [logoUrl, setLogoUrl] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [notifications, setNotifications] = useState<Array<{ key: string; label: string; checked: boolean }>>([]);
  const [sla, setSla] = useState({
    critical: 2,
    high: 4,
    medium: 24,
    low: 72,
  });

  useEffect(() => {
    let cancelled = false;
    async function loadOrgSettings() {
      try {
        const res = await fetch('/api/customer/b2b/settings/organization');
        const json = await res.json();
        if (!cancelled && json.success && json.data) {
          const d = json.data;
          setCompanyName(d.companyName || '');
          setTaxCode(d.taxCode || '');
          setAddress(d.address || '');
          setLogoText(d.logoText || 'B');
          if (d.logoUrl) setLogoUrl(d.logoUrl);
          if (Array.isArray(d.notifications)) setNotifications(d.notifications);
          if (d.sla) setSla(d.sla);
        }
      } catch (err) {
        console.error('Failed to load organization settings:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadOrgSettings();
    return () => { cancelled = true; };
  }, []);

  const handleToggleNotification = (index: number) => {
    setNotifications(prev => prev.map((item, i) => i === index ? { ...item, checked: !item.checked } : item));
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Kích thước logo không được vượt quá 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
        toast.success('Đã tải ảnh logo. Nhấn "Lưu cấu hình" để lưu lại.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/customer/b2b/settings/organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          taxCode,
          address,
          logoUrl,
          notifications,
          sla,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Lưu cài đặt tổ chức thành công!');
      } else {
        toast.error(json.error || 'Lỗi khi lưu cài đặt');
      }
    } catch {
      toast.error('Không thể kết nối đến máy chủ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-2xl mx-auto flex flex-col items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-gray-700">Đang tải cài đặt tổ chức...</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Cài đặt Hồ sơ Doanh nghiệp</h1>
        <p className="text-xs text-gray-500 mt-0.5">Thông tin pháp lý, tùy chọn kênh thông báo và cam kết SLA nội bộ</p>
      </div>

      {/* Company Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-xs">
        <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
          <Building2 className="w-4 h-4 text-blue-600" /> Thông tin Doanh nghiệp
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Tên công ty</label>
            <input 
              type="text" 
              value={companyName} 
              onChange={(e) => {
                setCompanyName(e.target.value);
                if (e.target.value.trim()) setLogoText(e.target.value.trim().charAt(0).toUpperCase());
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 font-medium" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Mã số thuế</label>
            <input 
              type="text" 
              value={taxCode} 
              onChange={(e) => setTaxCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 font-medium font-mono" 
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Địa chỉ trụ sở</label>
          <input 
            type="text" 
            value={address} 
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 font-medium" 
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Logo doanh nghiệp</label>
          <div className="flex items-center gap-4">
            <input 
              type="file" 
              ref={logoInputRef} 
              onChange={handleLogoFileChange} 
              accept="image/*" 
              className="hidden" 
            />
            <div className="w-14 h-14 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center text-xl font-bold text-blue-600 shadow-2xs overflow-hidden">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                logoText
              )}
            </div>
            <button 
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="px-3.5 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
            >
              Cập nhật logo
            </button>
            {logoUrl && (
              <button
                type="button"
                onClick={() => setLogoUrl('')}
                className="text-xs text-red-500 hover:underline"
              >
                Gỡ ảnh
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-xs">
        <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
          <Bell className="w-4 h-4 text-blue-600" /> Cài đặt Thông báo & Cảnh báo
        </h3>
        <div className="divide-y divide-gray-100">
          {notifications.map((item, i) => (
            <label key={item.key || i} className="flex items-center justify-between py-2.5 cursor-pointer hover:bg-gray-50/50 px-2 rounded-lg transition-colors">
              <span className="text-xs font-medium text-gray-700">{item.label}</span>
              <input 
                type="checkbox" 
                checked={item.checked} 
                onChange={() => handleToggleNotification(i)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
              />
            </label>
          ))}
        </div>
      </div>

      {/* SLA */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-xs">
        <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-blue-600" /> SLA Mặc định theo Mức độ Ưu tiên
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Khẩn cấp (Critical)</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                min="1"
                value={sla.critical} 
                onChange={(e) => setSla({ ...sla, critical: Number(e.target.value) || 1 })}
                className="w-20 px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-right font-bold" 
              />
              <span className="text-xs text-gray-500">giờ</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Cao (High)</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                min="1"
                value={sla.high} 
                onChange={(e) => setSla({ ...sla, high: Number(e.target.value) || 1 })}
                className="w-20 px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-right font-bold" 
              />
              <span className="text-xs text-gray-500">giờ</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Trung bình (Medium)</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                min="1"
                value={sla.medium} 
                onChange={(e) => setSla({ ...sla, medium: Number(e.target.value) || 1 })}
                className="w-20 px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-right font-bold" 
              />
              <span className="text-xs text-gray-500">giờ</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Thấp (Low)</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                min="1"
                value={sla.low} 
                onChange={(e) => setSla({ ...sla, low: Number(e.target.value) || 1 })}
                className="w-20 px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-right font-bold" 
              />
              <span className="text-xs text-gray-500">giờ</span>
            </div>
          </div>
        </div>
      </div>

      <button 
        type="button"
        disabled={saving}
        onClick={handleSave}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all disabled:opacity-50"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang lưu thay đổi...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Lưu cài đặt tổ chức
          </>
        )}
      </button>
    </div>
  );
}
