'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Hardware Repair', value: 45, color: '#3b82f6' },
  { name: 'Software Dev', value: 30, color: '#a855f7' },
  { name: 'Subscriptions', value: 25, color: '#22c55e' },
];

const totalTickets = 1240;

export default function ServiceDistributionChart() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Service Distribution
      </h3>
      
      <div className="flex items-center justify-center">
        <div className="relative w-48 h-48 min-w-[192px]">
          <ResponsiveContainer width={192} height={192}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
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
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              Tickets
            </span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-600">{item.name}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
