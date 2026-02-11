'use client';

import React from 'react';
import { Activity, Database, Workflow, Bell, ExternalLink } from 'lucide-react';
import { cn } from '@/utils';
import { LucideIcon } from 'lucide-react';

interface ServiceHealth {
  id: string;
  name: string;
  uptime: string;
  latency: string;
  status: 'healthy' | 'warning' | 'critical';
  icon: LucideIcon;
}

const services: ServiceHealth[] = [
  {
    id: '1',
    name: 'API Gateway',
    uptime: '99.99%',
    latency: '45ms',
    status: 'healthy',
    icon: Activity,
  },
  {
    id: '2',
    name: 'PostgreSQL DB',
    uptime: '99.95%',
    latency: '12ms',
    status: 'healthy',
    icon: Database,
  },
  {
    id: '3',
    name: 'Temporal Workflow',
    uptime: '99.90%',
    latency: '240ms',
    status: 'warning',
    icon: Workflow,
  },
  {
    id: '4',
    name: 'Notification Svc',
    uptime: '100%',
    latency: '85ms',
    status: 'healthy',
    icon: Bell,
  },
];

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
    label: 'CRITICAL',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    dotColor: 'bg-red-500',
  },
};

export default function InfrastructureHealth() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Infrastructure Health
        </h3>
        <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <Activity className="w-4 h-4" />
          <span>Monitoring</span>
        </button>
      </div>

      <div className="space-y-4">
        {services.map((service) => {
          const config = statusConfig[service.status];
          const Icon = service.icon;

          return (
            <div key={service.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', config.bgColor)}>
                  <Icon className={cn('w-4 h-4', config.color)} />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{service.name}</p>
                  <p className="text-xs text-gray-500">Uptime: {service.uptime}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn('text-sm font-medium', service.status === 'warning' ? 'text-orange-600' : 'text-gray-900')}>
                  {service.latency}
                </p>
                <p className={cn('text-xs font-medium', config.color)}>
                  {config.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 mb-2">
          Last scanned: 10s ago via Prometheus
        </p>
        <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
          <span>View System Logs</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
