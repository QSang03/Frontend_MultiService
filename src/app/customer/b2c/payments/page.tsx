'use client';

import { CreditCard, QrCode, Banknote, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui';
import EmptyState from '@/components/ui/EmptyState';

interface Payment {
  id: string;
  ticketId: string;
  title: string;
  amount: string;
  status: 'pending' | 'paid' | 'overdue';
  statusLabel: string;
  statusColor: string;
  dueDate: string;
}

const payments: Payment[] = [
  { id: 'P-001', ticketId: 'T-0012', title: 'Sửa máy tính văn phòng', amount: '750,000 VNĐ', status: 'pending', statusLabel: 'Chờ thanh toán', statusColor: 'bg-yellow-100 text-yellow-700', dueDate: '20/03/2026' },
  { id: 'P-002', ticketId: 'T-0010', title: 'Sửa máy in Canon 2900', amount: '750,000 VNĐ', status: 'paid', statusLabel: 'Đã thanh toán', statusColor: 'bg-green-100 text-green-700', dueDate: '10/03/2026' },
  { id: 'P-003', ticketId: 'T-0005', title: 'Khắc phục sự cố mạng LAN', amount: '2,000,000 VNĐ', status: 'paid', statusLabel: 'Đã thanh toán', statusColor: 'bg-green-100 text-green-700', dueDate: '25/02/2026' },
];

export default function PaymentsB2C() {
  const { addToast } = useToast();
  const pendingPayment = payments.find((p) => p.status === 'pending');
  const paidPayments = payments.filter((p) => p.status === 'paid');

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Thanh toán</h1>

      {/* Pending Payment Card */}
      {pendingPayment && (
        <div className="bg-white rounded-xl border-2 border-blue-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Chờ thanh toán</h2>
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
              <span className="text-gray-500">Ticket</span>
              <span className="font-mono text-gray-600">#{pendingPayment.ticketId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Giá dịch vụ</span>
              <span className="font-medium">500,000 VNĐ</span>
            </div>
            <div className="flex justify-between text-orange-600">
              <span>Phụ phí ngoài giờ</span>
              <span className="font-medium">250,000 VNĐ</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-bold text-lg">
                <span>Tổng cộng</span>
                <span className="text-blue-600">{pendingPayment.amount}</span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Phương thức thanh toán</h3>

            <label className="flex items-center gap-3 p-3 border border-blue-200 bg-blue-50 rounded-xl cursor-pointer">
              <input type="radio" name="payment" defaultChecked className="w-4 h-4 text-blue-500" />
              <CreditCard className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-800">Chuyển khoản ngân hàng</span>
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:border-gray-300">
              <input type="radio" name="payment" className="w-4 h-4 text-blue-500" />
              <QrCode className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-gray-800">Ví điện tử (MoMo / ZaloPay)</span>
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:border-gray-300">
              <input type="radio" name="payment" className="w-4 h-4 text-blue-500" />
              <Banknote className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-gray-800">Tiền mặt khi bàn giao</span>
            </label>
          </div>

          {/* Bank Info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="w-32 h-32 bg-white border border-gray-200 rounded-lg mx-auto flex items-center justify-center">
              <QrCode className="w-16 h-16 text-gray-400" />
            </div>
            <div className="text-center space-y-1 mt-3">
              <p className="text-gray-500">Ngân hàng: <strong>Vietcombank</strong></p>
              <p className="text-gray-500">STK: <strong className="font-mono">0123456789</strong></p>
              <p className="text-gray-500">Chủ TK: <strong>IT Services JSC</strong></p>
              <p className="text-gray-500">Nội dung: <strong className="font-mono text-blue-600">T-0012</strong></p>
            </div>
          </div>

          <button onClick={() => addToast('Đã gửi xác nhận thanh toán', { type: 'success' })} className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold text-sm hover:bg-blue-600 transition-colors">
            ✅ Tôi đã chuyển khoản – Xác nhận
          </button>
        </div>
      )}

      {/* Payment History */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử thanh toán</h2>
        {paidPayments.length === 0 ? (
          <EmptyState
            icon="file"
            title="Chưa có thanh toán"
            description="Lịch sử thanh toán sẽ hiển thị tại đây."
          />
        ) : (
          <div className="space-y-3">
            {paidPayments.map((payment) => (
              <div key={payment.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-900">{payment.title}</span>
                    </div>
                    <p className="text-xs text-gray-500">#{payment.ticketId} · {payment.dueDate}</p>
                  </div>
                  <span className="font-semibold text-gray-900">{payment.amount}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
