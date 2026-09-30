'use client';

import React, { useEffect } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { useContracts } from '@/hooks/useContracts';
import { Loader2, CalendarClock } from 'lucide-react';

export default function RecurringSchedules() {
  const { contracts, loading, listContracts } = useContracts();

  useEffect(() => {
    listContracts();
  }, [listContracts]);

  // Extract active contracts that may have recurring schedules
  const recurringContracts = (contracts || []).filter(
    (c) => c.status === 3
  );

  return (
    <Card>
      <CardBody className="p-0">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Lịch Tự Động Định Kỳ (Temporal Workflow)</h3>
            <p className="text-sm text-gray-500 mt-1">Các tiến trình tạo ticket tự động được gắn kết theo Hợp đồng dịch vụ bảo trì định kỳ.</p>
          </div>
          {loading && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
              <tr>
                <th className="px-6 py-3">Mã Hợp Đồng</th>
                <th className="px-6 py-3">Khách Hàng / Tiêu Đề</th>
                <th className="px-6 py-3">Chu Kỳ</th>
                <th className="px-6 py-3">Thời Hạn</th>
                <th className="px-6 py-3 text-right">Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {recurringContracts.map((ctr) => (
                <tr key={ctr.id} className="border-b last:border-0 hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-mono font-medium text-blue-600">
                    {ctr.id.slice(0, 12)}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <div>{ctr.title}</div>
                    <div className="text-xs text-gray-400 font-normal">{ctr.customerName || 'Khách hàng'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-gray-700 bg-gray-100 rounded px-2 py-1 text-xs">
                      0 0 1 * * (Hàng tháng)
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {ctr.startDate ? new Date(ctr.startDate).toLocaleDateString('vi-VN') : '—'} - {ctr.endDate ? new Date(ctr.endDate).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-1 rounded">
                      Đang chạy
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && recurringContracts.length === 0 && (
            <div className="py-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
              <CalendarClock className="w-8 h-8 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">Chưa có lịch bảo trì định kỳ nào</p>
              <p className="text-xs text-gray-400">Các hợp đồng bảo trì định kỳ sau khi kích hoạt sẽ tự động kích hoạt workflow lên lịch tại đây.</p>
            </div>
          )} 
        </div>
      </CardBody>
    </Card>
  );
}
