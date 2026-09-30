'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Search, 
  UserPlus, 
  Filter, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  Loader2, 
  Download, 
  Upload, 
  X, 
  Check, 
  ShieldCheck, 
  KeyRound, 
  Lock, 
  Unlock 
} from 'lucide-react';
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

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  staff: 'bg-gray-100 text-gray-600',
};

type StatusFilter = 'all' | 'active' | 'inactive';

export default function MembersB2B() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const { addToast } = useToast();

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Add member form state
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    phone: '',
    dept: 'Khối Vận Hành',
    role: 'staff' as 'staff' | 'manager' | 'admin',
  });

  // Edit role state
  const [targetRole, setTargetRole] = useState<'staff' | 'manager' | 'admin'>('staff');

  // File import ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importSummary, setImportSummary] = useState<{ total: number; success: number; failed: number } | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/customer/b2b/members');
      const data = await res.json();
      if (data.success && Array.isArray(data.members)) {
        setMembers(data.members);
      }
    } catch (err) {
      console.error('Failed to load members', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchTab = activeTab === 'all' || m.status === activeTab;
      const q = search.toLowerCase();
      const matchSearch = !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [members, activeTab, search]);

  const counts = useMemo(
    () => ({
      all: members.length,
      active: members.filter((m) => m.status === 'active').length,
      inactive: members.filter((m) => m.status === 'inactive').length,
    }),
    [members]
  );

  // --- Handlers ---
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.email) {
      addToast('Vui lòng nhập họ tên và email', { type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/customer/b2b/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember),
      });
      const data = await res.json();

      if (data.success) {
        addToast(`Thêm thành viên ${newMember.name} thành công! Mật khẩu mặc định: Welcome@123456`, { type: 'success' });
        setIsAddModalOpen(false);
        setNewMember({
          name: '',
          email: '',
          phone: '',
          dept: 'Khối Vận Hành',
          role: 'staff',
        });
        fetchMembers();
      } else {
        addToast(data.error || 'Lỗi khi thêm thành viên', { type: 'error' });
      }
    } catch {
      addToast('Không thể kết nối máy chủ', { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedMember) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/customer/b2b/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedMember.id,
          action: 'UPDATE_ROLE',
          role: targetRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Đã cập nhật vai trò của ${selectedMember.name} thành ${targetRole.toUpperCase()}`, { type: 'success' });
        setIsEditRoleOpen(false);
        setSelectedMember((prev) =>
          prev
            ? {
                ...prev,
                role: targetRole,
                roleLabel: targetRole === 'admin' ? 'Admin' : targetRole === 'manager' ? 'Manager' : 'Staff',
              }
            : null
        );
        fetchMembers();
      } else {
        addToast(data.error || 'Cập nhật vai trò thất bại', { type: 'error' });
      }
    } catch {
      addToast('Lỗi kết nối máy chủ', { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedMember) return;
    const nextStatus = selectedMember.status === 'active' ? 'inactive' : 'active';
    setSubmitting(true);
    try {
      const res = await fetch('/api/customer/b2b/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedMember.id,
          action: 'TOGGLE_STATUS',
          isActive: nextStatus === 'active',
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast(
          nextStatus === 'active'
            ? `Đã kích hoạt lại tài khoản ${selectedMember.name}`
            : `Đã tạm khóa tài khoản ${selectedMember.name}`,
          { type: 'success' }
        );
        setSelectedMember((prev) => (prev ? { ...prev, status: nextStatus } : null));
        fetchMembers();
      } else {
        addToast(data.error || 'Không thể cập nhật trạng thái', { type: 'error' });
      }
    } catch {
      addToast('Lỗi kết nối máy chủ', { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      '\uFEFF' +
      'Họ và tên,Email,Số điện thoại,Phòng ban,Vai trò (staff/manager/admin)\n' +
      'Nguyễn Văn An,nguyenvanan@company.vn,0901234567,Khối Vận Hành,staff\n' +
      'Trần Thị Bình,tranthibinh@company.vn,0912345678,Khối Kỹ Thuật,manager\n' +
      'Lê Hoàng Long,lehoanglong@company.vn,0987654321,Ban Giám Đốc,admin\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'mau_danh_sach_thanh_vien_b2b.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Đã tải xuống file mẫu CSV thành công', { type: 'success' });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        addToast('File CSV không có dữ liệu thành viên', { type: 'error' });
        return;
      }

      setSubmitting(true);
      let successCount = 0;
      let failedCount = 0;

      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim());
        if (parts.length >= 2 && parts[1].includes('@')) {
          const [name, email, phone, dept, roleRaw] = parts;
          const role = ['admin', 'manager', 'staff'].includes(roleRaw?.toLowerCase())
            ? (roleRaw.toLowerCase() as 'staff' | 'manager' | 'admin')
            : 'staff';

          try {
            const res = await fetch('/api/customer/b2b/members', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name,
                email,
                phone: phone || '',
                dept: dept || 'Khối Vận Hành',
                role,
              }),
            });
            const d = await res.json();
            if (d.success) successCount++;
            else failedCount++;
          } catch {
            failedCount++;
          }
        }
      }

      setImportSummary({
        total: lines.length - 1,
        success: successCount,
        failed: failedCount,
      });

      addToast(`Đã nhập xong: ${successCount} thành công, ${failedCount} thất bại`, {
        type: successCount > 0 ? 'success' : 'error',
      });

      fetchMembers();
      setSubmitting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Quản lý Thành viên</h1>
          <p className="text-sm text-gray-500 mt-0.5">Danh sách nhân sự và quyền truy cập portal khách hàng B2B</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" /> Thêm thành viên
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-700 bg-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4 text-gray-500" /> Nhập từ Excel/CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'all' ? 'bg-white text-[#0f172a] shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Tất cả ({counts.all})
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'active' ? 'bg-white text-[#0f172a] shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Đang hoạt động ({counts.active})
        </button>
        <button
          onClick={() => setActiveTab('inactive')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'inactive' ? 'bg-white text-[#0f172a] shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Bị tạm khóa ({counts.inactive})
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, email..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
        </div>
        <button className="inline-flex items-center gap-1.5 border border-gray-200 bg-white px-4 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
          <Filter className="w-4 h-4" /> Lọc
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Thành viên</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Phòng ban</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Vai trò</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Trạng thái</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">Tickets tháng</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">Chi phí</th>
              <th className="px-4 py-3 text-right">Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                  Đang tải danh sách thành viên...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    icon="users"
                    title="Không tìm thấy thành viên"
                    description={search ? 'Thử thay đổi từ khóa tìm kiếm.' : 'Chưa có thành viên nào trong danh sách.'}
                    actionLabel={activeTab !== 'all' ? 'Xem tất cả' : undefined}
                    onAction={activeTab !== 'all' ? () => setActiveTab('all') : undefined}
                  />
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => {
                    setSelectedMember(m);
                    setTargetRole(m.role);
                  }}
                  className={`border-b border-gray-100 hover:bg-emerald-50/40 cursor-pointer transition-colors ${
                    selectedMember?.id === m.id ? 'bg-emerald-50/60' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#0f172a] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                        {m.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{m.name}</div>
                        <div className="text-xs text-gray-400">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{m.dept}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleColors[m.role] || 'bg-gray-100 text-gray-600'}`}>
                      {m.roleLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        m.status === 'active' ? 'text-emerald-600' : 'text-gray-400'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${m.status === 'active' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                      {m.status === 'active' ? 'Hoạt động' : 'Tạm khóa'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{m.ticketsThisMonth}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{m.totalSpent} đ</td>
                  <td className="px-4 py-3 text-right">
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Sidebar Detail */}
      {selectedMember && (
        <div className="fixed right-0 top-0 h-full w-84 bg-white border-l border-gray-200 shadow-2xl z-50 p-6 overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <h2 className="font-bold text-gray-900">Chi tiết nhân sự</h2>
            <button 
              onClick={() => setSelectedMember(null)} 
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#0f172a] rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-3 shadow-md">
              {selectedMember.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <h3 className="font-semibold text-gray-900">{selectedMember.name}</h3>
            <p className="text-sm text-gray-500">
              {selectedMember.dept} · {selectedMember.roleLabel}
            </p>
          </div>
          <div className="space-y-3 text-sm bg-gray-50 p-3.5 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="truncate text-gray-700">{selectedMember.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-gray-700">{selectedMember.phone}</span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <p className="text-xl font-bold text-gray-900">{selectedMember.ticketsThisMonth}</p>
              <p className="text-xs text-gray-500">Tickets tạo</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <p className="text-sm font-bold text-gray-900">{selectedMember.totalSpent}</p>
              <p className="text-xs text-gray-500">Chi phí (VNĐ)</p>
            </div>
          </div>
          <div className="mt-6 space-y-2.5">
            <button
              onClick={() => {
                setTargetRole(selectedMember.role);
                setIsEditRoleOpen(true);
              }}
              className="w-full py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Đổi vai trò ({selectedMember.roleLabel})
            </button>
            <button
              onClick={() => {
                addToast(`Đã gửi email khôi phục mật khẩu tới ${selectedMember.email}`, { type: 'success' });
              }}
              className="w-full py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <KeyRound className="w-4 h-4 text-amber-600" />
              Reset mật khẩu
            </button>
            <button
              disabled={submitting}
              onClick={handleToggleStatus}
              className={`w-full py-2.5 border rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm ${
                selectedMember.status === 'active'
                  ? 'border-red-200 text-red-600 hover:bg-red-50'
                  : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : selectedMember.status === 'active' ? (
                <>
                  <Lock className="w-4 h-4" /> Tạm khóa tài khoản
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" /> Kích hoạt lại tài khoản
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modal: Thêm thành viên mới */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                Thêm Thành viên mới
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email đăng nhập *</label>
                <input
                  type="email"
                  required
                  placeholder="an.nguyen@company.vn"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  placeholder="0901234567"
                  value={newMember.phone}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phòng ban</label>
                <input
                  type="text"
                  placeholder="Khối Kỹ Thuật / Vận Hành"
                  value={newMember.dept}
                  onChange={(e) => setNewMember({ ...newMember, dept: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Vai trò & Quyền hạn</label>
                <select
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value as 'staff' | 'manager' | 'admin' })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="staff">Staff (Tạo & theo dõi ticket cá nhân)</option>
                  <option value="manager">Manager (Phê duyệt yêu cầu & ngân sách phòng ban)</option>
                  <option value="admin">Admin (Toàn quyền quản trị tổ chức B2B)</option>
                </select>
              </div>

              <div className="bg-emerald-50 p-2.5 rounded-lg text-xs text-emerald-800">
                Mật khẩu khởi tạo mặc định: <span className="font-mono font-bold">Welcome@123456</span>. Thành viên có thể đổi mật khẩu sau khi đăng nhập.
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Lưu thành viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Đổi vai trò */}
      {isEditRoleOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                Đổi vai trò nhân sự
              </h3>
              <button onClick={() => setIsEditRoleOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600">
              Chọn vai trò mới cho <span className="font-semibold text-gray-900">{selectedMember.name}</span>:
            </p>

            <div className="space-y-2">
              {(['staff', 'manager', 'admin'] as const).map((r) => (
                <label
                  key={r}
                  className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-colors ${
                    targetRole === r ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="targetRole"
                      value={r}
                      checked={targetRole === r}
                      onChange={() => setTargetRole(r)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-semibold capitalize text-gray-900">
                      {r === 'admin' ? 'Admin (Quản trị viên)' : r === 'manager' ? 'Manager (Quản lý)' : 'Staff (Nhân viên)'}
                    </span>
                  </div>
                  {targetRole === r && <Check className="w-4 h-4 text-emerald-600" />}
                </label>
              ))}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsEditRoleOpen(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleUpdateRole}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Xác nhận đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nhập từ Excel/CSV */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600" />
                Nhập danh sách từ Excel / CSV
              </h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <p className="text-xs font-semibold text-gray-700">Bước 1: Tải file mẫu CSV</p>
                <p className="text-xs text-gray-500">
                  Tải file mẫu để điền thông tin nhân sự đúng chuẩn định dạng hệ thống.
                </p>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  Tải file mẫu (.CSV)
                </button>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <p className="text-xs font-semibold text-gray-700">Bước 2: Chọn file đã điền để tải lên</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                />
              </div>

              {importSummary && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-emerald-800">Kết quả import:</p>
                  <p className="text-emerald-700">
                    Tổng số: {importSummary.total} | Thành công: {importSummary.success} | Thất bại: {importSummary.failed}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportSummary(null);
                }}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
