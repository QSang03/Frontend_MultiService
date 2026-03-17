'use client';

import { useState } from 'react';
import { Search, UserPlus, Filter, MoreHorizontal, Mail, Phone } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui';

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  dept: string;
  role: 'staff' | 'manager' | 'admin';
  roleLabel: string;
  status: 'active' | 'inactive';
  ticketsThisMonth: number;
  totalSpent: string;
}

const members: Member[] = [
  { id: '1', name: 'Nguyễn Văn B', email: 'b@abc.com', phone: '0909 111 222', dept: 'IT', role: 'staff', roleLabel: 'Staff', status: 'active', ticketsThisMonth: 8, totalSpent: '5,200,000' },
  { id: '2', name: 'Trần Văn C', email: 'c@abc.com', phone: '0909 222 333', dept: 'IT', role: 'manager', roleLabel: 'Manager', status: 'active', ticketsThisMonth: 3, totalSpent: '12,000,000' },
  { id: '3', name: 'Lê Thị D', email: 'd@abc.com', phone: '0909 333 444', dept: 'Marketing', role: 'staff', roleLabel: 'Staff', status: 'inactive', ticketsThisMonth: 2, totalSpent: '1,800,000' },
  { id: '4', name: 'Phạm Hải', email: 'hai@abc.com', phone: '0909 444 555', dept: 'Sales', role: 'manager', roleLabel: 'Manager', status: 'active', ticketsThisMonth: 5, totalSpent: '8,500,000' },
  { id: '5', name: 'Hoàng Mai', email: 'mai@abc.com', phone: '0909 555 666', dept: 'HR', role: 'staff', roleLabel: 'Staff', status: 'active', ticketsThisMonth: 1, totalSpent: '500,000' },
];

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  staff: 'bg-gray-100 text-gray-600',
};

export default function MembersB2B() {
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const { addToast } = useToast();

  const filtered = members.filter(
    (m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.email.includes(search.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-900">Quản lý Thành viên</h1>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-1.5 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors">
            <UserPlus className="w-4 h-4" /> Thêm thành viên
          </button>
          <button className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Nhập từ Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        <button className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-[#0f172a] shadow-sm">Tất cả ({members.length})</button>
        <button className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700">Đang hoạt động</button>
        <button className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700">Bị tạm khóa</button>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên, email..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <button className="inline-flex items-center gap-1.5 border border-gray-200 px-4 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          <Filter className="w-4 h-4" /> Lọc
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Thành viên</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Phòng ban</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Vai trò</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Trạng thái</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">Tickets tháng</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">Chi phí</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7}><EmptyState icon="users" title="Không tìm thấy thành viên" description="Thử thay đổi từ khóa tìm kiếm." /></td></tr>
            ) : filtered.map((m) => (
              <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedMember(m)}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#0f172a] rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{m.name}</p>
                      <p className="text-xs text-gray-500">{m.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{m.dept}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleColors[m.role]}`}>{m.roleLabel}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${m.status === 'active' ? 'text-emerald-600' : 'text-gray-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${m.status === 'active' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    {m.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">{m.ticketsThisMonth}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">{m.totalSpent}</td>
                <td className="px-4 py-3 text-right">
                  <button className="p-1 text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sidebar Detail */}
      {selectedMember && (
        <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-xl z-50 p-6 overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <h2 className="font-bold text-gray-900">Chi tiết</h2>
            <button onClick={() => setSelectedMember(null)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#0f172a] rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
              {selectedMember.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <h3 className="font-semibold text-gray-900">{selectedMember.name}</h3>
            <p className="text-sm text-gray-500">{selectedMember.dept} · {selectedMember.roleLabel}</p>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /><span>{selectedMember.email}</span></div>
            <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /><span>{selectedMember.phone}</span></div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-gray-900">{selectedMember.ticketsThisMonth}</p><p className="text-xs text-gray-500">Tickets</p></div>
            <div className="bg-gray-50 rounded-lg p-3 text-center"><p className="text-sm font-bold text-gray-900">{selectedMember.totalSpent}</p><p className="text-xs text-gray-500">Chi phí</p></div>
          </div>
          <div className="mt-6 space-y-2">
            <button onClick={() => addToast('Tính năng đang phát triển', { type: 'info' })} className="w-full py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Đổi vai trò</button>
            <button onClick={() => addToast('Tính năng đang phát triển', { type: 'info' })} className="w-full py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Đổi phòng ban</button>
            <button onClick={() => addToast('Tính năng đang phát triển', { type: 'info' })} className="w-full py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Reset mật khẩu</button>
            <button onClick={() => addToast('Đã tạm khóa thành viên', { type: 'success' })} className="w-full py-2 border border-red-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">Tạm khóa</button>
          </div>
        </div>
      )}
    </div>
  );
}
