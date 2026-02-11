'use client';

import { Card, CardHeader, CardBody } from '@/components/ui';

export default function OrdersPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Đơn hàng của tôi</h1>
        <p className="text-gray-600 mt-1">Theo dõi trạng thái các đơn hàng của bạn</p>
      </div>

      <Card variant="bordered">
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Danh sách đơn hàng</h2>
        </CardHeader>
        <CardBody>
          <div className="text-center py-12 text-gray-500">
            <svg
              className="w-16 h-16 mx-auto text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p>Chưa có đơn hàng nào</p>
            <p className="text-sm mt-1">Đặt dịch vụ đầu tiên của bạn ngay!</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
