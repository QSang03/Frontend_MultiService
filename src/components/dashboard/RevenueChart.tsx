'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface RevenueChartItem {
  name: string;
  grossRevenue: number;
  netProfit: number;
  opexCogs: number;
}

const DEFAULT_DATA: RevenueChartItem[] = [
  { name: 'Tuần 1', grossRevenue: 12000000, netProfit: 6500000, opexCogs: 5500000 },
  { name: 'Tuần 2', grossRevenue: 22000000, netProfit: 12000000, opexCogs: 10000000 },
  { name: 'Tuần 3', grossRevenue: 28000000, netProfit: 15500000, opexCogs: 12500000 },
  { name: 'Tuần 4', grossRevenue: 35000000, netProfit: 19000000, opexCogs: 16000000 },
];

interface RevenueChartProps {
  data?: RevenueChartItem[];
}

export default function RevenueChart({ data = DEFAULT_DATA }: RevenueChartProps) {
  const fmtVnd = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M đ`;
    }
    return `${(value / 1000).toFixed(0)}k đ`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">
            Doanh Thu vs Lợi Nhuận vs Chi Phí (MTD)
          </h3>
          <p className="text-xs text-gray-500">Biến động tài chính theo tuần trong tháng</p>
        </div>
      </div>
      <div className="h-[300px] w-full min-w-0">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(value) => fmtVnd(value)}
            />
            <Tooltip 
              formatter={(value?: number) => {
                if (typeof value !== 'number') return ['', ''];
                return [`${value.toLocaleString('vi-VN')} đ`, ''];
              }}
              contentStyle={{ 
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '15px' }}
              formatter={(value) => (
                <span className="text-xs font-medium text-gray-600">{value}</span>
              )}
            />
            <Line
              type="monotone"
              dataKey="grossRevenue"
              name="Doanh thu (Gross Revenue)"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ fill: '#3b82f6', strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="netProfit"
              name="Lợi nhuận ròng (Net Profit)"
              stroke="#22c55e"
              strokeWidth={2.5}
              dot={{ fill: '#22c55e', strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="opexCogs"
              name="Giá vốn & Vận hành (COGS)"
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ fill: '#ef4444', strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
