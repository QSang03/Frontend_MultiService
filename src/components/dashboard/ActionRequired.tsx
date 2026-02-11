'use client';

import React from 'react';
import { AlertTriangle, Users, Clock } from 'lucide-react';
import { cn } from '@/utils';

interface ActionItem {
  id: string;
  title: string;
  description: string;
  type: 'warning' | 'info' | 'urgent';
  actionLabel: string;
}

const actionItems: ActionItem[] = [
  {
    id: '1',
    title: 'Review Clawback: RMA #9921',
    description: 'Cost adjustment detected (-$500). Approval needed to create debit.',
    type: 'warning',
    actionLabel: 'Review',
  },
  {
    id: '2',
    title: 'Tenant Onboarding: StartUp Hub',
    description: 'Pending contract verification (Step 3/4).',
    type: 'info',
    actionLabel: 'Verify',
  },
  {
    id: '3',
    title: 'SLA Breach Warning',
    description: '3 Tickets in "Pending Vendor" state > 15 days.',
    type: 'urgent',
    actionLabel: 'Investigate',
  },
];

const typeConfig = {
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-500',
    borderColor: 'border-l-orange-500',
  },
  info: {
    icon: Users,
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-l-blue-500',
  },
  urgent: {
    icon: Clock,
    iconColor: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-l-red-500',
  },
};

export default function ActionRequired() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Action Required (Pending)
        </h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View All
        </button>
      </div>

      <div className="space-y-3">
        {actionItems.map((item) => {
          const config = typeConfig[item.type];
          const Icon = config.icon;

          return (
            <div
              key={item.id}
              className={cn(
                'flex items-center justify-between p-4 rounded-lg border-l-4',
                config.bgColor,
                config.borderColor
              )}
            >
              <div className="flex items-start gap-3">
                <Icon className={cn('w-5 h-5 mt-0.5', config.iconColor)} />
                <div>
                  <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                </div>
              </div>
              <button className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                {item.actionLabel}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
