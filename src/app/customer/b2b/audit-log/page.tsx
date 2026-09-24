'use client';

import { useState } from 'react';
import { Search, Download, Shield, User, DollarSign, FileText, Settings } from 'lucide-react';

interface AuditEntry {
  id: string;
  time: string;
  user: string;
  action: string;
  actionType: 'approval' | 'config' | 'member' | 'finance' | 'ticket';
  target: string;
  oldValue: string;
  newValue: string;
}

const auditEntries: AuditEntry[] = [
  { id: '1', time: '14/03 10:30', user: 'Trần Văn C', action: 'Duyệt Ticket', actionType: 'approval', target: '#T-0045', oldValue: 'Pending', newValue: 'Approved' },
  { id: '2', time: '14/03 09:45', user: 'Admin System', action: 'Thay đổi ngân sách', actionType: 'config', target: 'Sales Dept', oldValue: '20,000,000 VNĐ', newValue: '25,000,000 VNĐ' },
  { id: '3', time: '14/03 09:00', user: 'Nguyễn Văn B', action: 'Tạo Ticket', actionType: 'ticket', target: '#T-0045', oldValue: '—', newValue: 'Created' },
  { id: '4', time: '13/03 16:30', user: 'Admin System', action: 'Thêm thành viên', actionType: 'member', target: 'Hoàng Mai', oldValue: '—', newValue: 'Staff / HR' },
  { id: '5', time: '13/03 14:00', user: 'Trần Văn C', action: 'Từ chối Ticket', actionType: 'approval', target: '#T-0044', oldValue: 'Pending', newValue: 'Rejected' },
  { id: '6', time: '12/03 11:00', user: 'Admin System', action: 'Cập nhật SLA', actionType: 'config', target: 'Critical Level', oldValue: '4 giờ', newValue: '2 giờ' },
  { id: '7', time: '12/03 10:00', user: 'Phạm Hải', action: 'Ký hợp đồng', actionType: 'finance', target: 'HĐ-2026-005', oldValue: 'Pending Sign', newValue: 'Signed' },
  { id: '8', time: '11/03 15:00', user: 'Admin System', action: 'Đổi vai trò', actionType: 'member', target: 'Phạm Hải', oldValue: 'Staff', newValue: 'Manager' },
];

const actionIcons: Record<string, { icon: React.ElementType; color: string }> = {
  approval: { icon: Shield, color: 'text-blue-600 bg-blue-50' },
  config: { icon: Settings, color: 'text-purple-600 bg-purple-50' },
  member: { icon: User, color: 'text-green-600 bg-green-50' },
  finance: { icon: DollarSign, color: 'text-amber-600 bg-amber-50' },
  ticket: { icon: FileText, color: 'text-gray-600 bg-gray-50' },
};

export default function AuditLogB2B() {
  const [search, setSearch] = useState('');

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Nhật ký Hệ thống</h1>
        <button className="inline-flex items-center gap-1.5 border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" /> Xuất log
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo người dùng, hành động..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <select className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none">
          <option value="">Loại hành động</option>
          <option value="approval">Phê duyệt</option>
          <option value="config">Cấu hình</option>
          <option value="member">Thành viên</option>
          <option value="finance">Tài chính</option>
          <option value="ticket">Ticket</option>
        </select>
        <select className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none">
          <option value="">Người thực hiện</option>
          <option>Admin System</option>
          <option>Trần Văn C</option>
          <option>Nguyễn Văn B</option>
          <option>Phạm Hải</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Thời gian</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Người dùng</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Hành động</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Đối tượng</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Giá trị cũ → Mới</th>
            </tr>
          </thead>
          <tbody>
            {auditEntries.map((entry) => {
              const iconInfo = actionIcons[entry.actionType];
              const Icon = iconInfo.icon;
              return (
                <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{entry.time}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{entry.user}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconInfo.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-gray-700">{entry.action}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-600">{entry.target}</td>
                  <td className="px-4 py-3 text-gray-600">
                    <span className="text-gray-400">{entry.oldValue}</span>
                    <span className="mx-1.5 text-gray-300">→</span>
                    <span className="font-medium text-gray-700">{entry.newValue}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
