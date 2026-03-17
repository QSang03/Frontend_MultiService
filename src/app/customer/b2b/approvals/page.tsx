'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Building2, DollarSign } from 'lucide-react';
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
}

const pendingApprovals: ApprovalItem[] = [
  { id: '1', ticketId: 'T-0055', title: 'Nâng cấp RAM 5 máy tính', creator: 'Nguyễn Văn B', dept: 'IT', amount: 5000000, costCenter: 'IT Department', sla: 'Medium (24h)', remainingBudget: 8500000, date: '14/03' },
  { id: '2', ticketId: 'T-0057', title: 'Mua license Microsoft 365 (10 seats)', creator: 'Lê Thị D', dept: 'HR', amount: 3200000, costCenter: 'HR', sla: 'Low (72h)', remainingBudget: 7200000, date: '15/03' },
  { id: '3', ticketId: 'T-0058', title: 'Bảo trì máy chủ hàng quý', creator: 'Phạm Hải', dept: 'IT', amount: 12000000, costCenter: 'IT Department', sla: 'Medium (24h)', remainingBudget: 8500000, date: '15/03' },
];

export default function ApprovalsB2B() {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [processed, setProcessed] = useState<Set<string>>(new Set());
  const { addToast } = useToast();

  const handleAction = (id: string, ticketId: string, action: 'approve' | 'reject') => {
    if (action === 'approve') {
      addToast(`Đã phê duyệt yêu cầu #${ticketId}`, { type: 'success' });
    } else {
      addToast(`Đã từ chối yêu cầu #${ticketId}`, { type: 'error' });
    }
    setProcessed((prev) => new Set(prev).add(id));
  };

  const allProcessed = processed.size >= pendingApprovals.length;

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Chờ Phê duyệt</h1>
        <span className="text-sm bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium">
          {pendingApprovals.length - processed.size} yêu cầu
        </span>
      </div>

      <div className="space-y-4">
        {allProcessed ? (
          <EmptyState icon="list" title="Không có yêu cầu chờ duyệt" description="Tất cả yêu cầu đã được xử lý." />
        ) : pendingApprovals.map((item) => {
          const isProcessed = processed.has(item.id);
          const overBudget = item.amount > item.remainingBudget;

          return (
            <div
              key={item.id}
              className={`bg-white rounded-xl border p-5 transition-all ${
                isProcessed ? 'border-gray-100 opacity-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-gray-500">#{item.ticketId}</span>
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                      Chờ duyệt
                    </span>
                    {overBudget && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                        Vượt ngân sách
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Từ: {item.creator} · {item.dept} · {item.date}
                  </p>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {item.amount.toLocaleString('vi-VN')} VNĐ
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Cost Center</p>
                    <p className="font-medium text-gray-700">{item.costCenter}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Ngân sách còn</p>
                    <p className={`font-medium ${overBudget ? 'text-red-600' : 'text-emerald-600'}`}>
                      {item.remainingBudget.toLocaleString('vi-VN')} VNĐ
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">SLA</p>
                    <p className="font-medium text-gray-700">{item.sla}</p>
                  </div>
                </div>
              </div>

              {/* Note */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Ghi chú khi duyệt/từ chối (tùy chọn)..."
                  value={notes[item.id] || ''}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  disabled={isProcessed}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleAction(item.id, item.ticketId, 'approve')}
                  disabled={isProcessed}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500 text-white rounded-lg font-medium text-sm hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-4 h-4" /> Duyệt
                </button>
                <button
                  onClick={() => handleAction(item.id, item.ticketId, 'reject')}
                  disabled={isProcessed}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-red-200 text-red-600 rounded-lg font-medium text-sm hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="w-4 h-4" /> Từ chối
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
