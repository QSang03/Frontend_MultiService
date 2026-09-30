'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserCircle, 
  Mail, 
  Phone, 
  Shield, 
  Key, 
  Wrench, 
  Award, 
  CheckCircle2, 
  Star, 
  Loader2, 
  Save 
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { toast } from '@/components/ui/Toast';

export default function TechProfilePage() {
  const router = useRouter();
  const { profile, isLoading, updateProfile } = useProfile();

  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState<string[]>(['Mạng', 'Hardware', 'CCTV', 'Máy in', 'Server']);
  const [newSkill, setNewSkill] = useState('');

  // Performance stats
  const [stats, setStats] = useState({
    completedTasks: 0,
    avgRating: 4.9,
  });

  useEffect(() => {
    if (profile) {
      setName(profile.name || profile.full_name || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  useEffect(() => {
    let cancelled = false;
    async function loadTechStats() {
      try {
        const res = await fetch('/api/tech/tasks');
        if (res.ok) {
          const data = await res.json();
          const jobs = data.jobs || [];
          const completed = jobs.filter((j: { status?: string }) => j.status === 'COMPLETED').length;
          if (!cancelled) {
            setStats({
              completedTasks: completed,
              avgRating: completed > 0 ? 4.9 : 5.0,
            });
          }
        }
      } catch (err) {
        console.error('Failed to load tech stats:', err);
      }
    }
    loadTechStats();
    return () => { cancelled = true; };
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập họ và tên.');
      return;
    }

    setSaving(true);
    try {
      const res = await updateProfile({
        full_name: name.trim(),
        phone: phone.trim(),
      });
      if (res.success) {
        toast.success('Cập nhật hồ sơ kỹ thuật viên thành công!');
      } else {
        toast.error(res.error || 'Cập nhật thất bại');
      }
    } catch {
      toast.error('Lỗi kết nối khi cập nhật hồ sơ');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSkill.trim()) {
      e.preventDefault();
      if (!skills.includes(newSkill.trim())) {
        setSkills(prev => [...prev, newSkill.trim()]);
      }
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(prev => prev.filter(s => s !== skillToRemove));
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-2xl mx-auto flex flex-col items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-gray-700">Đang tải hồ sơ kỹ thuật viên...</p>
      </div>
    );
  }

  const initialLetter = (name || email || 'T').charAt(0).toUpperCase();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hồ sơ Kỹ thuật viên</h1>
        <p className="text-gray-500 mt-1">Quản lý chứng chỉ chuyên môn, thông tin liên lạc và chỉ số nghiệp vụ</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 flex flex-col items-center">
          <div className="w-24 h-24 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-full flex items-center justify-center mb-4 text-white text-3xl font-bold shadow-sm">
            {initialLetter}
          </div>
          <h2 className="text-lg font-bold text-gray-900">{name || 'Kỹ thuật viên'}</h2>
          <p className="text-xs text-gray-500 mt-1 font-mono">{email || 'tech@multiservice.vn'}</p>
          <span className="mt-3 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">
            Field Technician
          </span>

          {/* Skills */}
          <div className="mt-6 w-full">
            <h3 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
              <Award className="w-3.5 h-3.5 text-purple-600" /> Kỹ năng chuyên môn
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span 
                  key={skill} 
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold"
                >
                  {skill}
                  <button 
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="hover:text-purple-900 text-purple-400 ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input 
              type="text" 
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={handleAddSkill}
              placeholder="+ Thêm kỹ năng (Enter)..." 
              className="mt-2 w-full px-2.5 py-1.5 border border-dashed border-gray-300 rounded-lg text-xs outline-none focus:border-purple-500"
            />
          </div>

          {/* Stats */}
          <div className="mt-6 w-full grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-purple-50/50 border border-purple-100 rounded-xl">
              <p className="text-xl font-bold text-purple-700">{stats.completedTasks}</p>
              <p className="text-[11px] text-gray-500 mt-0.5 font-medium">Đã hoàn thành</p>
            </div>
            <div className="text-center p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
              <p className="text-xl font-bold text-amber-600">{stats.avgRating} ⭐</p>
              <p className="text-[11px] text-gray-500 mt-0.5 font-medium">Đánh giá TB</p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-xs border border-gray-200 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-6">Thông tin cá nhân</h2>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Họ và tên</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập họ và tên"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email đăng nhập</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg text-xs outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Số điện thoại</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Số điện thoại"
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Khu vực điều phối</label>
                <div className="relative">
                  <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    defaultValue="Khu vực TP. Hồ Chí Minh & lân cận"
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg transition-colors text-xs font-bold flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <Save className="w-3.5 h-3.5" />
                Lưu thông tin
              </button>
            </div>
          </form>

          {/* Security */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600" />
              Bảo mật tài khoản
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 bg-gray-50/70 border border-gray-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <Key className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs font-bold text-gray-900">Đổi mật khẩu</p>
                    <p className="text-[11px] text-gray-500">Cập nhật mật khẩu định kỳ để bảo vệ tài khoản kỹ thuật viên</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => router.push('/admin/profile?tab=security')}
                  className="text-xs text-purple-600 hover:text-purple-700 font-bold px-3 py-1 bg-white border border-purple-200 rounded-lg shadow-2xs"
                >
                  Thay đổi
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-gray-50/70 border border-gray-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs font-bold text-gray-900">Xác thực 2 yếu tố (2FA / OTP)</p>
                    <p className="text-[11px] text-gray-500">Bảo vệ quyền truy cập kho linh kiện & nghiệm thu số</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => router.push('/admin/profile?tab=security')}
                  className="text-xs text-purple-600 hover:text-purple-700 font-bold px-3 py-1 bg-white border border-purple-200 rounded-lg shadow-2xs"
                >
                  Cài đặt
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
