'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export interface ServiceDistributionItem {
  name: string;
  value: number;
  color: string;
  ticketCount?: number;
  [key: string]: unknown;
}

const DEFAULT_DATA: ServiceDistributionItem[] = [];

interface ServiceDistributionChartProps {
  data?: ServiceDistributionItem[];
  totalTickets?: number;
}

export default function ServiceDistributionChart({
  data = DEFAULT_DATA,
  totalTickets = 0,
}: ServiceDistributionChartProps) {
  const hasData = totalTickets > 0 && data.some((d) => d.value > 0);
  const chartData = hasData
    ? data
    : [{ name: 'Chưa có yêu cầu', value: 100, color: '#e5e7eb' }];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-base font-bold text-gray-900 mb-1">
        Cơ Cấu Loại Hình Dịch Vụ
      </h3>
      <p className="text-xs text-gray-500 mb-4">Tỷ trọng yêu cầu xử lý trên toàn hệ thống</p>
      
      <div className="flex items-center justify-center">
        <div className="relative w-48 h-48 min-w-[192px]">
          <ResponsiveContainer width={192} height={192}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={hasData ? 3 : 0}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-gray-900">
              {totalTickets.toLocaleString()}
            </span>
            <span className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
              Tickets
            </span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-2">
        {hasData ? (
          data.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-gray-600 font-medium">{item.name}</span>
              </div>
              <span className="font-bold text-gray-900">{item.value}%</span>
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-400 text-center py-2">
            Hệ thống chưa ghi nhận yêu cầu dịch vụ nào.
          </p>
        )}
      </div>
    </div>
  );
}
