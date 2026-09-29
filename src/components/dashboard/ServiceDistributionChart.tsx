'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export interface ServiceDistributionItem {
  name: string;
  value: number;
  color: string;
  ticketCount?: number;
  [key: string]: any;
}

const DEFAULT_DATA: ServiceDistributionItem[] = [
  { name: 'Hardware Repair & RMA', value: 45, color: '#3b82f6' },
  { name: 'Software & Cloud Services', value: 30, color: '#a855f7' },
  { name: 'Recurring Subscriptions', value: 25, color: '#22c55e' },
];

interface ServiceDistributionChartProps {
  data?: ServiceDistributionItem[];
  totalTickets?: number;
}

export default function ServiceDistributionChart({
  data = DEFAULT_DATA,
  totalTickets = 1240,
}: ServiceDistributionChartProps) {
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
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
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
        {data.map((item) => (
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
        ))}
      </div>
    </div>
  );
}
