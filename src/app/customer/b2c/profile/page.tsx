'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { useToast } from '@/components/ui';

export default function ProfileB2C() {
  const [isEditing, setIsEditing] = useState(false);
  const { addToast } = useToast();

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              NA
            </div>
            <button className="absolute bottom-0 right-0 w-7 h-7 bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
              <Camera className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Nguyễn Văn A</h1>
            <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
              <Phone className="w-3.5 h-3.5" /> 0909 xxx xxx
            </p>
            <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5" /> nguyenvana@gmail.com
            </p>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
              <input type="text" defaultValue="Nguyễn Văn A" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" defaultValue="nguyenvana@gmail.com" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
              <input type="text" defaultValue="123 Lê Lợi, Q1, TP.HCM" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setIsEditing(false); addToast('Đã lưu thay đổi thành công', { type: 'success' }); }} className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl font-medium text-sm hover:bg-blue-600 transition-colors">
                Lưu thay đổi
              </button>
              <button onClick={() => setIsEditing(false)} className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-sm hover:bg-gray-50 transition-colors">
                Hủy
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setIsEditing(true)} className="w-full py-2.5 border border-blue-200 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-50 transition-colors">
            Chỉnh sửa hồ sơ
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <ClipboardList className="w-6 h-6 text-blue-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">12</p>
          <p className="text-xs text-gray-500">Yêu cầu</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">10</p>
          <p className="text-xs text-gray-500">Hoàn thành</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <Star className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">4.8</p>
          <p className="text-xs text-gray-500">Đánh giá</p>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        <button className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left">
          <Bell className="w-5 h-5 text-gray-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Thông báo</p>
            <p className="text-xs text-gray-500">Email, SMS, Zalo</p>
          </div>
          <span className="text-gray-300">›</span>
        </button>
        <button className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left">
          <Key className="w-5 h-5 text-gray-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Đổi mật khẩu</p>
          </div>
          <span className="text-gray-300">›</span>
        </button>
        <button className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left">
          <Shield className="w-5 h-5 text-gray-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Liên kết tài khoản</p>
            <p className="text-xs text-gray-500">Google, Zalo</p>
          </div>
          <span className="text-gray-300">›</span>
        </button>
        <button onClick={() => addToast('Đã đăng xuất', { type: 'info' })} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-red-50 transition-colors text-left">
          <LogOut className="w-5 h-5 text-red-400" />
          <p className="text-sm font-medium text-red-600">Đăng xuất</p>
        </button>
      </div>
    </div>
  );
}
