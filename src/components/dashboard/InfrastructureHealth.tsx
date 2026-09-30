'use client';

import React from 'react';
import { Activity, Database, Workflow, Bell, ExternalLink, CheckCircle } from 'lucide-react';
import { cn } from '@/utils';
import { LucideIcon } from 'lucide-react';

export interface ServiceHealthItem {
  id: string;
  name: string;
  uptime: string;
  latency: string;
  status: 'healthy' | 'warning' | 'critical';
  icon?: LucideIcon;
}


const DEFAULT_SERVICES: ServiceHealthItem[] = [];



const statusConfig = {
  healthy: {
    label: 'HEALTHY',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    dotColor: 'bg-green-500',
  },
  warning: {
    label: 'HIGH LOAD',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    dotColor: 'bg-orange-500',
  },
  critical: {
    label: 'DOWN',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    dotColor: 'bg-red-500',
  },
};

interface InfrastructureHealthProps {
  services?: ServiceHealthItem[];
}

export default function InfrastructureHealth({ services = DEFAULT_SERVICES }: InfrastructureHealthProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">
            Trạng Thái Hạ Tầng Kỹ Thuật (Infrastructure)
          </h3>
          <p className="text-xs text-gray-500">Giám sát tính sẵn sàng của Database, Cache, Engine</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          All Systems Online
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {services.length === 0 ? (
          <div className="col-span-2 py-6 text-center text-xs text-gray-500 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
            Đang kết nối và đo lường thông số hạ tầng vi dịch vụ...
          </div>
        ) : (
          services.map((service) => {
            const config = statusConfig[service.status] || statusConfig.healthy;
          const Icon = service.icon || (
            service.name.toLowerCase().includes('db') || service.name.toLowerCase().includes('sql')
              ? Database
              : service.name.toLowerCase().includes('temporal')
              ? Workflow
              : Activity
          );

          return (
            <div
              key={service.id}
              className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-2xs">
                  <Icon className="w-4 h-4 text-gray-700" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-xs">{service.name}</p>
                  <p className="text-[11px] text-gray-500">
                    Uptime: {service.uptime} • Ping: {service.latency}
                  </p>
                </div>
              </div>
              <div className={cn('flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold', config.bgColor, config.color)}>
                <span className={cn('w-1.5 h-1.5 rounded-full', config.dotColor)} />
                {config.label}
              </div>
            </div>
          );
        })
      )}
      </div>
    </div>
  );
}
