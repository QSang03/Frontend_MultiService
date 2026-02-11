'use client';

import { UserCircle, Mail, Phone, Shield, Key, Wrench, Award } from 'lucide-react';

export default function TechProfilePage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
        <p className="text-gray-500 mt-1">Quản lý thông tin tài khoản Kỹ thuật viên</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col items-center">
          <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <UserCircle className="w-16 h-16 text-purple-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Kỹ thuật viên</h2>
          <p className="text-sm text-gray-500 mt-1">tech@multiservice.vn</p>
          <span className="mt-3 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
            Technician
          </span>

          {/* Skills */}
          <div className="mt-6 w-full">
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <Award className="w-4 h-4" /> Kỹ năng
            </h3>
            <div className="flex flex-wrap gap-1">
              {['Mạng', 'Hardware', 'CCTV', 'Máy in'].map((skill) => (
                <span key={skill} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 w-full grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-lg font-bold text-gray-900">—</p>
              <p className="text-xs text-gray-500">Đã hoàn thành</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-lg font-bold text-gray-900">—</p>
              <p className="text-xs text-gray-500">Đánh giá TB</p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Thông tin cá nhân</h2>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                <input
                  type="text"
                  placeholder="Nhập họ và tên"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Email"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="Số điện thoại"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chuyên môn</label>
                <div className="relative">
                  <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="VD: Mạng, Hardware, CCTV..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                Cập nhật
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-gray-600" />
          Bảo mật
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Đổi mật khẩu</p>
                <p className="text-xs text-gray-500">Cập nhật mật khẩu đăng nhập</p>
              </div>
            </div>
            <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
              Thay đổi
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Xác thực 2 yếu tố (MFA)</p>
                <p className="text-xs text-gray-500">Bảo vệ tài khoản bằng OTP</p>
              </div>
            </div>
            <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
              Cài đặt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
