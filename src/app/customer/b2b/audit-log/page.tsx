'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Download, Shield, User, DollarSign, FileText, Settings, Loader2 } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { toast } from '@/components/ui/Toast';

interface AuditEntry {
  id: string;
  time: string;
  user: string;
  action: string;
  actionType: 'approval' | 'config' | 'member' | 'finance' | 'ticket';
  target: string;
  targetTitle?: string;
  oldValue: string;
  newValue: string;
}

const actionIcons: Record<string, { icon: React.ElementType; color: string }> = {
  approval: { icon: Shield, color: 'text-blue-600 bg-blue-50' },
  config: { icon: Settings, color: 'text-purple-600 bg-purple-50' },
  member: { icon: User, color: 'text-green-600 bg-green-50' },
  finance: { icon: DollarSign, color: 'text-amber-600 bg-amber-50' },
  ticket: { icon: FileText, color: 'text-gray-600 bg-gray-50' },
};

export default function AuditLogB2B() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/customer/b2b/audit-log')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success && Array.isArray(data.entries)) {
          setEntries(data.entries);
        }
      })
      .catch((err) => {
        console.error('Failed to load audit logs', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const uniqueUsers = useMemo(() => {
    return Array.from(new Set(entries.map((e) => e.user))).filter(Boolean);
  }, [entries]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const matchAction = !actionFilter || e.actionType === actionFilter;
      const matchUser = !userFilter || e.user === userFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        e.user.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        e.target.toLowerCase().includes(q);
      return matchAction && matchUser && matchSearch;
    });
  }, [entries, actionFilter, userFilter, search]);

  const handleExport = () => {
    if (entries.length === 0) return;
    const csv = [
      ['Thời gian', 'Người dùng', 'Hành động', 'Đối tượng', 'Giá trị cũ', 'Giá trị mới'],
      ...entries.map((e) => [e.time, e.user, e.action, e.target, e.oldValue, e.newValue]),
    ]
      .map((row) => row.join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã xuất nhật ký hệ thống thành công');
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nhật ký Hệ thống (Audit Log)</h1>
          <p className="text-sm text-gray-500 mt-0.5">Theo dõi lịch sử thao tác, phê duyệt và thay đổi trạng thái trong tổ chức</p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4" /> Xuất log
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo người dùng, hành động, mã ticket..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none text-gray-700"
        >
          <option value="">Tất cả loại hành động</option>
          <option value="approval">Phê duyệt</option>
          <option value="config">Cấu hình</option>
          <option value="member">Nhân sự / Kỹ thuật</option>
          <option value="finance">Tài chính</option>
          <option value="ticket">Ticket / Yêu cầu</option>
        </select>
        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none text-gray-700"
        >
          <option value="">Tất cả người thực hiện</option>
          {uniqueUsers.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
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
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                  Đang tải nhật ký hệ thống...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    icon="file"
                    title="Chưa có nhật ký ghi nhận"
                    description={search || actionFilter || userFilter ? 'Không tìm thấy kết quả phù hợp bộ lọc.' : 'Chưa có hành động nào được ghi lại trong khoảng thời gian này.'}
                  />
                </td>
              </tr>
            ) : (
              filtered.map((entry) => {
                const iconInfo = actionIcons[entry.actionType] || actionIcons.ticket;
                const Icon = iconInfo.icon;
                return (
                  <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{entry.time}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{entry.user}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconInfo.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-gray-700 font-medium">{entry.action}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600 text-xs font-semibold">{entry.target}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="text-gray-400 text-xs">{entry.oldValue}</span>
                      <span className="mx-1.5 text-gray-300">→</span>
                      <span className="font-medium text-gray-800 text-xs">{entry.newValue}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
