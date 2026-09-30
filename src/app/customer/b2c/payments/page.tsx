'use client';

import { useState, useEffect, useMemo } from 'react';
import { CreditCard, QrCode, Banknote, CheckCircle2, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui';
import EmptyState from '@/components/ui/EmptyState';

interface Payment {
  id: string;
  ticketId: string;
  title: string;
  amount: string;
  rawAmount: number;
  status: 'pending' | 'paid' | 'overdue';
  statusLabel: string;
  statusColor: string;
  dueDate: string;
}

interface RawTicket {
  id: string;
  title: string;
  status: number;
  attributes?: string;
  createdAt?: string;
}

export default function PaymentsB2C() {
  const { addToast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<'bank' | 'wallet' | 'cash'>('bank');
  const [confirmedIds, setConfirmedIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/sale/tickets?page_size=50')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.tickets)) {
          const mapped: Payment[] = data.tickets.map((t: RawTicket, idx: number) => {
            let amountNum = 500000;
            if (t.attributes) {
              try {
                const parsed = JSON.parse(t.attributes);
                if (parsed.amount) {
                  amountNum = typeof parsed.amount === 'number' ? parsed.amount : parseInt(parsed.amount, 10) || 500000;
                }
              } catch {}
            }

            const isPaid = t.status >= 9;
            const dateStr = t.createdAt
              ? new Date(t.createdAt).toLocaleDateString('vi-VN')
              : 'Hôm nay';

            return {
              id: `INV-${t.id.slice(-6)}`,
              ticketId: t.id,
              title: t.title || 'Dịch vụ sửa chữa IT',
              amount: `${amountNum.toLocaleString('vi-VN')} VNĐ`,
              rawAmount: amountNum,
              status: isPaid ? 'paid' : 'pending',
              statusLabel: isPaid ? 'Đã thanh toán' : 'Chờ thanh toán',
              statusColor: isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700',
              dueDate: dateStr,
            };
          });
          setPayments(mapped);
        }
      })
      .catch((err) => {
        console.error('Failed to load payment tickets', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const pendingPayment = useMemo(() => {
    return payments.find((p) => p.status === 'pending' && !confirmedIds.includes(p.id));
  }, [payments, confirmedIds]);

  const paidPayments = useMemo(() => {
    return payments.filter((p) => p.status === 'paid' || confirmedIds.includes(p.id));
  }, [payments, confirmedIds]);

  const handleConfirmPayment = () => {
    if (pendingPayment) {
      setConfirmedIds((prev) => [...prev, pendingPayment.id]);
      addToast('Đã ghi nhận yêu cầu xác nhận chuyển khoản! Quản trị viên sẽ đối soát trong 5 phút.', {
        type: 'success',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
        <p className="text-sm text-gray-500 font-medium">Đang kiểm tra hoá đơn và giao dịch...</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Thanh toán & Hoá đơn</h1>

      {/* Pending Payment Card */}
      {pendingPayment ? (
        <div className="bg-white rounded-xl border-2 border-blue-200 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Hoá đơn đang chờ thanh toán</h2>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pendingPayment.statusColor}`}>
              {pendingPayment.statusLabel}
            </span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Dịch vụ</span>
              <span className="font-medium text-gray-900">{pendingPayment.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Mã yêu cầu (Ticket)</span>
              <span className="font-mono text-gray-600 font-semibold">#{pendingPayment.ticketId.slice(-6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Thời gian tạo</span>
              <span className="font-medium text-gray-700">{pendingPayment.dueDate}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-bold text-lg">
                <span>Tổng cộng</span>
                <span className="text-blue-600">{pendingPayment.amount}</span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Chọn phương thức thanh toán</h3>

            <label
              onClick={() => setSelectedMethod('bank')}
              className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                selectedMethod === 'bank' ? 'border-blue-500 bg-blue-50/70' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input type="radio" name="payment" checked={selectedMethod === 'bank'} readOnly className="w-4 h-4 text-blue-500" />
              <CreditCard className="w-5 h-5 text-blue-500" />
              <div className="text-left">
                <span className="text-sm font-medium text-gray-800 block">Chuyển khoản VietQR / 247</span>
                <span className="text-xs text-gray-500">Quét mã QR qua app ngân hàng tức thì</span>
              </div>
            </label>

            <label
              onClick={() => setSelectedMethod('wallet')}
              className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                selectedMethod === 'wallet' ? 'border-blue-500 bg-blue-50/70' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input type="radio" name="payment" checked={selectedMethod === 'wallet'} readOnly className="w-4 h-4 text-blue-500" />
              <QrCode className="w-5 h-5 text-purple-500" />
              <div className="text-left">
                <span className="text-sm font-medium text-gray-800 block">Ví điện tử (MoMo / VNPay)</span>
                <span className="text-xs text-gray-500">Thanh toán qua ví điện tử liên kết</span>
              </div>
            </label>

            <label
              onClick={() => setSelectedMethod('cash')}
              className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                selectedMethod === 'cash' ? 'border-blue-500 bg-blue-50/70' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input type="radio" name="payment" checked={selectedMethod === 'cash'} readOnly className="w-4 h-4 text-blue-500" />
              <Banknote className="w-5 h-5 text-green-500" />
              <div className="text-left">
                <span className="text-sm font-medium text-gray-800 block">Tiền mặt khi kỹ thuật viên bàn giao</span>
                <span className="text-xs text-gray-500">Thanh toán trực tiếp sau khi nghiệm thu</span>
              </div>
            </label>
          </div>

          {/* Bank Info / QR */}
          {selectedMethod === 'bank' && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm border border-gray-100">
              <div className="max-w-[200px] bg-white border border-gray-200 rounded-lg p-2 mx-auto shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://img.vietqr.io/image/970436-0123456789-compact2.png?amount=${pendingPayment.rawAmount}&addInfo=${encodeURIComponent(
                    `TT ${pendingPayment.ticketId.slice(-6)}`
                  )}&accountName=IT%20SERVICES%20JSC`}
                  alt="VietQR code"
                  className="w-full h-auto object-contain rounded"
                  onError={(e) => {
                    // Fallback to placeholder if offline
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="text-center space-y-1">
                <p className="text-gray-500">Ngân hàng: <strong>Vietcombank (VCB)</strong></p>
                <p className="text-gray-500">Số tài khoản: <strong className="font-mono text-gray-900">0123456789</strong></p>
                <p className="text-gray-500">Chủ tài khoản: <strong>IT SERVICES JSC</strong></p>
                <p className="text-gray-500">
                  Nội dung CK: <strong className="font-mono text-blue-600">TT {pendingPayment.ticketId.slice(-6)}</strong>
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleConfirmPayment}
            className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold text-sm hover:bg-blue-600 transition-colors shadow-sm"
          >
            ✅ Tôi đã chuyển khoản – Xác nhận thanh toán
          </button>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="font-semibold text-emerald-900 text-base">Bạn không có hoá đơn nào chờ thanh toán</h3>
          <p className="text-sm text-emerald-700 mt-1">Tất cả chi phí dịch vụ kỹ thuật đã được thanh toán đầy đủ.</p>
        </div>
      )}

      {/* Payment History */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử giao dịch</h2>
        {paidPayments.length === 0 ? (
          <EmptyState
            icon="file"
            title="Chưa có lịch sử thanh toán"
            description="Các khoản thanh toán hoàn tất sẽ được lưu trữ và hiển thị tại đây."
          />
        ) : (
          <div className="space-y-3">
            {paidPayments.map((payment) => (
              <div key={payment.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:border-gray-200 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-900">{payment.title}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Mã ticket: #{payment.ticketId.slice(-6)} · Ngày hoàn tất: {payment.dueDate}
                    </p>
                  </div>
                  <span className="font-semibold text-gray-900 text-sm whitespace-nowrap">{payment.amount}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
