'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Building2, DollarSign, AlertTriangle, ShieldCheck } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui';

interface ApprovalItem {
  id: string;
  ticketId: string;
  title: string;
  creator: string;
  dept: string;
  amount: number;
  costCenter: string;
  sla: string;
  remainingBudget: number;
  date: string;
  level?: number;
  status?: string;
}

export default function ApprovalsB2B() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { addToast } = useToast();

  const fetchApprovals = async () => {
    try {
      const res = await fetch('/api/customer/b2b/approvals');
      const json = await res.json();
      if (json.success && json.data) {
        setApprovals(json.data);
      }
    } catch (err) {
      console.error('Fetch approvals error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleAction = async (item: ApprovalItem, action: 'approve' | 'reject') => {
    setProcessingId(item.id);
    try {
      const res = await fetch('/api/customer/b2b/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: item.ticketId,
          action,
          note: notes[item.id] || '',
        }),
      });
      const json = await res.json();
      if (json.success) {
        addToast(
          action === 'approve'
            ? `Đã phê duyệt yêu cầu #${item.ticketId}`
            : `Đã từ chối yêu cầu #${item.ticketId}`,
          { type: action === 'approve' ? 'success' : 'info' }
        );
        // Remove item from state
        setApprovals((prev) => prev.filter((a) => a.id !== item.id));
      } else {
        addToast(json.error || 'Lỗi khi xử lý phê duyệt', { type: 'error' });
      }
    } catch {
      addToast('Lỗi kết nối máy chủ', { type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            Danh sách Yêu cầu Chờ Phê duyệt
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Duyệt các yêu cầu dịch vụ và sửa chữa thiết bị từ các phòng ban trong tổ chức.
          </p>
        </div>
        <span className="text-sm bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-bold">
          {approvals.length} yêu cầu đang chờ
        </span>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : approvals.length === 0 ? (
          <EmptyState
            icon="list"
            title="Không có yêu cầu nào chờ duyệt"
            description="Tất cả các yêu cầu dịch vụ trong tổ chức đã được xem xét và xử lý hoàn tất."
          />
        ) : (
          approvals.map((item) => {
            const overBudget = item.amount > item.remainingBudget;
            const isProcessing = processingId === item.id;

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 shadow-sm hover:border-gray-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded">
                      #{item.ticketId}
                    </span>
                    <h3 className="font-semibold text-gray-900 text-base">{item.title}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-bold ${
                        item.level === 2
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.level === 2 ? 'Cấp 2 (Admin)' : 'Cấp 1 (Manager)'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">{item.date}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <span className="text-gray-400 block mb-0.5">Người đề xuất:</span>
                    <span className="font-semibold text-gray-800">{item.creator} ({item.dept})</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <span className="text-gray-400 block mb-0.5">Cost Center:</span>
                    <span className="font-semibold text-gray-800">{item.costCenter}</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <span className="text-gray-400 block mb-0.5">Dự toán kinh phí:</span>
                    <span className="font-bold text-gray-900">{item.amount.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <span className="text-gray-400 block mb-0.5">Ngân sách còn lại:</span>
                    <span
                      className={`font-bold ${overBudget ? 'text-amber-600' : 'text-emerald-600'}`}
                    >
                      {item.remainingBudget.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>

                {overBudget && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 text-xs text-amber-800 font-medium">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Dự toán này vượt quá ngân sách khả dụng của phòng ban ({item.remainingBudget.toLocaleString('vi-VN')} đ). Nếu phê duyệt, bạn đang xác nhận chấp thuận phân bổ vượt mức.
                    </span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <input
                    type="text"
                    placeholder="Nhập ghi chú hoặc lý do phê duyệt / từ chối..."
                    value={notes[item.id] || ''}
                    onChange={(e) => setNotes({ ...notes, [item.id]: e.target.value })}
                    className="w-full sm:flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => handleAction(item, 'reject')}
                      disabled={isProcessing}
                      className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" /> Từ chối
                    </button>
                    <button
                      onClick={() => handleAction(item, 'approve')}
                      disabled={isProcessing}
                      className="px-5 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {isProcessing ? 'Đang xử lý...' : 'Phê duyệt'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
