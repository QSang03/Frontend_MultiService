'use client';

import { TopHeader } from '@/components/layout';
import {
  StatCard,
  RevenueChart,
  ServiceDistributionChart,
  ActionRequired,
  InfrastructureHealth,
} from '@/components/dashboard';
import { DollarSign, Building2, AlertTriangle, Activity } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      <TopHeader title="Dashboard" />

      <div className="p-6">
        {/* System Command Center Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">System Command Center</h2>
            <p className="text-gray-500 text-sm">
              Real-time overview of Platform Operations, Finance, and Infrastructure.
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm text-gray-600">System Status:</span>
            <span className="text-sm font-semibold text-green-600">Operational</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Net Profit (Mo)"
            value="$42,890"
            change="↑ 15% vs last month"
            changeType="positive"
            icon={DollarSign}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
          <StatCard
            title="Active B2B Tenants"
            value="48"
            change="+ 3 Onboarding vs last month"
            changeType="positive"
            icon={Building2}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          <StatCard
            title="SLA Breach Risk"
            value="5 Tickets"
            change="1 Critical vs last month"
            changeType="warning"
            icon={AlertTriangle}
            iconColor="text-orange-600"
            iconBgColor="bg-orange-100"
          />
          <StatCard
            title="System Load"
            value="78%"
            change="↑ Peak Hours vs last month"
            changeType="warning"
            icon={Activity}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <RevenueChart />
          </div>
          <div>
            <ServiceDistributionChart />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActionRequired />
          <InfrastructureHealth />
        </div>
      </div>
    </div>
  );
}
