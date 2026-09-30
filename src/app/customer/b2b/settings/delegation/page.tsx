'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, Save, Info, UserCheck, Trash2, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

interface Delegation {
  id: string;
  orgId: string;
  managerId: string;
  delegateeId: string;
  startDate: string;
  endDate: string;
  requestType: string;
  isActive: boolean;
  createdAt?: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
  dept: string;
  roleLabel: string;
  status: string;
}

export default function DelegationB2B() {
  const { user } = useAuth();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [delegateTo, setDelegateTo] = useState('');
  const [scope, setScope] = useState('ALL');
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  const fetchDelegations = useCallback(async () => {
    try {
      const res = await fetch('/api/customer/b2b/settings/delegation');
      const json = await res.json();
      if (json.success && json.data) {
        setDelegations(json.data);
      }
    } catch (err) {
      console.error('Fetch delegations failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/customer/b2b/members');
      const json = await res.json();
      if (json.success && Array.isArray(json.members)) {
        // filter active members and exclude current user if matched
        setMembers(json.members.filter((m: Member) => m.status === 'active' && m.id !== user?.id));
      }
    } catch (err) {
      console.error('Fetch members for delegation failed:', err);
    } finally {
      setLoadingMembers(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDelegations();
    fetchMembers();
  }, [fetchDelegations, fetchMembers]);

  const handleCreate = async () => {
    if (!dateFrom || !dateTo || !delegateTo) {
      addToast('Vui lòng điền đầy đủ ngày bắt đầu, ngày kết thúc và người nhận ủy quyền', { type: 'error' });
      return;
    }
    if (new Date(dateFrom) >= new Date(dateTo)) {
      addToast('Ngày kết thúc phải sau ngày bắt đầu', { type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/customer/b2b/settings/delegation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          managerId: user?.id || 'mgr-current-user',
          delegateeId: delegateTo,
          startDate: new Date(dateFrom).toISOString(),
          endDate: new Date(dateTo).toISOString(),
          requestType: scope,
        }),
      });
      const json = await res.json();
      if (json.success) {
        addToast('Tạo ủy quyền thành công!', { type: 'success' });
        setDateFrom('');
        setDateTo('');
        setDelegateTo('');
        fetchDelegations();
      } else {
        addToast(json.error || 'Lỗi khi tạo ủy quyền', { type: 'error' });
      }
    } catch {
      addToast('Lỗi kết nối máy chủ', { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Bạn có chắc muốn thu hồi ủy quyền này ngay lập tức?')) return;
    try {
      const res = await fetch(`/api/customer/b2b/settings/delegation?id=${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        addToast('Đã thu hồi ủy quyền', { type: 'success' });
        fetchDelegations();
      }
    } catch {
      addToast('Lỗi kết nối máy chủ', { type: 'error' });
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-emerald-600" />
          Ủy quyền Phê duyệt Tạm thời
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Cấu hình ủy quyền khi vắng mặt (nghỉ phép, công tác). Hệ thống sẽ tự động thu hồi khi hết hạn.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-sm">
        {/* Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vắng mặt từ ngày</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Delegate to */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ủy quyền cho nhân sự</label>
          {loadingMembers ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-500" /> Đang tải danh sách nhân sự doanh nghiệp...
            </div>
          ) : (
            <select
              value={delegateTo}
              onChange={(e) => setDelegateTo(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">-- Chọn người nhận ủy quyền --</option>
              {members.length === 0 ? (
                <option value="" disabled>Chưa có nhân sự nào trong danh sách</option>
              ) : (
                members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.dept} - {m.roleLabel}) • {m.email}
                  </option>
                ))
              )}
            </select>
          )}
        </div>

        {/* Scope */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phạm vi ủy quyền</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="scope"
                value="ALL"
                checked={scope === 'ALL'}
                onChange={(e) => setScope(e.target.value)}
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700">Tất cả yêu cầu phát sinh trong thời gian này</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="scope"
                value="UNDER_THRESHOLD"
                checked={scope === 'UNDER_THRESHOLD'}
                onChange={(e) => setScope(e.target.value)}
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700">Chỉ yêu cầu dưới hạn mức ngân sách thông thường (≤ 2.000.000 đ)</span>
            </label>
          </div>
        </div>

        {/* Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 text-sm text-amber-700">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <p>
            Ủy quyền sẽ tự động hết hiệu lực vào <strong>{dateTo || '(ngày kết thúc)'}</strong>. Đảm bảo luồng duyệt không bị tắc nghẽn khi bạn vắng mặt.
          </p>
        </div>

        <button
          onClick={handleCreate}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {submitting ? 'Đang kích hoạt...' : 'Kích hoạt Ủy quyền'}
        </button>
      </div>

      {/* Active Delegations */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center justify-between">
          <span>Danh sách Ủy quyền</span>
          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
            {delegations.filter((d) => d.isActive).length} đang kích hoạt
          </span>
        </h3>

        {loading ? (
          <div className="py-6 flex justify-center">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : delegations.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-6">
            Chưa có ủy quyền nào được tạo.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {delegations.map((d) => {
              const fromStr = new Date(d.startDate).toLocaleDateString('vi-VN');
              const toStr = new Date(d.endDate).toLocaleDateString('vi-VN');
              const isExpired = new Date(d.endDate) < new Date();
              const active = d.isActive && !isExpired;
              const delegatee = members.find((m) => m.id === d.delegateeId);

              return (
                <div key={d.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-sm">
                        {delegatee ? `${delegatee.name} (${delegatee.dept} - ${delegatee.roleLabel})` : d.delegateeId}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${
                          active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {active ? 'Đang hiệu lực' : 'Đã thu hồi / Hết hạn'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Từ {fromStr} đến {toStr} • Phạm vi: {d.requestType === 'ALL' ? 'Tất cả yêu cầu' : 'Dưới hạn mức (≤ 2M)'}
                    </p>
                  </div>
                  {active && (
                    <button
                      onClick={() => handleRevoke(d.id)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium px-2.5 py-1 border border-red-200 rounded hover:bg-red-50 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Thu hồi
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
