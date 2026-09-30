'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, Users, Clock, ShieldCheck, ChevronRight } from 'lucide-react';
import { cn } from '@/utils';

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  type: 'warning' | 'info' | 'urgent';
  actionLabel: string;
  link?: string;
}

const typeConfig = {
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-orange-50/70',
    iconColor: 'text-orange-500',
    borderColor: 'border-l-orange-500',
  },
  info: {
    icon: Users,
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50/70',
    borderColor: 'border-l-blue-500',
  },
  urgent: {
    icon: Clock,
    iconColor: 'text-red-500',
    bgColor: 'bg-red-50/70',
    borderColor: 'border-l-red-500',
  },
};

interface ActionRequiredProps {
  items?: ActionItem[];
}

export default function ActionRequired({ items = [] }: ActionRequiredProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">
            Hành Động Cần Xử Lý Ngay (Pending Actions)
          </h3>
          <p className="text-xs text-gray-500">Các hạng mục cấp bách cần Admin phê duyệt hoặc điều phối</p>
        </div>
        <Link 
          href="/admin/tickets" 
          className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
        >
          Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
            <ShieldCheck className="w-8 h-8 text-green-500 mb-1" />
            <p className="text-xs font-semibold text-gray-700">Tất cả vận hành đều ổn định</p>
            <p className="text-[11px] text-gray-400">Không có cảnh báo vi phạm SLA hoặc ticket tồn đọng cần xử lý khẩn cấp.</p>
          </div>
        ) : (
          items.map((item) => {
            const config = typeConfig[item.type] || typeConfig.info;
            const Icon = config.icon;

            return (
              <div
                key={item.id}
                className={cn(
                  'flex items-center justify-between p-3.5 rounded-xl border-l-4 transition-all hover:shadow-xs',
                  config.bgColor,
                  config.borderColor
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', config.iconColor)} />
                  <div>
                    <p className="font-bold text-gray-900 text-xs">{item.title}</p>
                    <p className="text-[11px] text-gray-600 mt-0.5">{item.description}</p>
                  </div>
                </div>
                {item.link ? (
                  <Link
                    href={item.link}
                    className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors shadow-2xs whitespace-nowrap ml-3"
                  >
                    {item.actionLabel}
                  </Link>
                ) : (
                  <button className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors shadow-2xs whitespace-nowrap ml-3">
                    {item.actionLabel}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
