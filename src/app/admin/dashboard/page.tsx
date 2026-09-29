'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TopHeader } from '@/components/layout';
import {
  StatCard,
  RevenueChart,
  ServiceDistributionChart,
  ActionRequired,
  InfrastructureHealth,
} from '@/components/dashboard';
import { DollarSign, Building2, AlertTriangle, Activity, RefreshCw } from 'lucide-react';
import internalApiClient from '@/lib/api/internal-client';

export interface DashboardMetricStats {
  netProfitMo: number;
  netProfitMoFormatted: string;
  profitChangeText: string;
  activeTenantsCount: number;
  tenantsChangeText: string;
  slaBreachRiskCount: number;
  slaRiskChangeText: string;
  systemLoadPercent: number;
  systemStatus: 'Operational' | 'Degraded' | 'Maintenance';
  
  revenueTrend: Array<{
    name: string;
    grossRevenue: number;
    netProfit: number;
    opexCogs: number;
  }>;

  serviceDistribution: Array<{
    name: string;
    value: number;
    color: string;
    ticketCount?: number;
  }>;
  totalTicketsCount: number;

  actionRequired: Array<{
    id: string;
    title: string;
    description: string;
    type: 'warning' | 'info' | 'urgent';
    actionLabel: string;
    link?: string;
  }>;

  infrastructureHealth: Array<{
    id: string;
    name: string;
    uptime: string;
    latency: string;
    status: 'healthy' | 'warning' | 'critical';
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardMetricStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('Vừa xong');

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await internalApiClient.get('/api/admin/dashboard/stats');
      setStats(response.data);
      const now = new Date();
      setLastRefreshed(`${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`);
    } catch (error) {
      console.error('Failed to load dashboard metrics:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 45s
    const timer = setInterval(fetchStats, 45000);
    return () => clearInterval(timer);
  }, [fetchStats]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <TopHeader title="Dashboard" />

      <div className="p-6 space-y-6">
        {/* System Command Center Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">System Command Center</h2>
            <p className="text-gray-500 text-sm">
              Bảng điều khiển trung tâm: Hoạt động toàn diện về Vận hành Ticket, Doanh thu, B2B Tenant và Hạ tầng.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchStats}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-xs font-medium transition-all shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Cập nhật: {lastRefreshed}
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-2xs">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-600">Trạng thái:</span>
              <span className="text-xs font-bold text-green-600">
                {stats?.systemStatus || 'Operational'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Lợi Nhuận Ròng (MTD)"
            value={stats ? stats.netProfitMoFormatted : '42.890.000 đ'}
            change={stats?.profitChangeText || '↑ 15% vs tháng trước'}
            changeType="positive"
            icon={DollarSign}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
          <StatCard
            title="Tổ Chức B2B Đang Hoạt Động"
            value={stats ? `${stats.activeTenantsCount} Tenants` : '12 Tenants'}
            change={stats?.tenantsChangeText || '+ 3 Onboarding tháng này'}
            changeType="positive"
            icon={Building2}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          <StatCard
            title="Nguy Cơ Vi Phạm SLA"
            value={stats ? `${stats.slaBreachRiskCount} Tickets` : '2 Tickets'}
            change={stats?.slaRiskChangeText || 'Cần điều phối KTV khẩn'}
            changeType={stats && stats.slaBreachRiskCount > 0 ? 'warning' : 'positive'}
            icon={AlertTriangle}
            iconColor="text-orange-600"
            iconBgColor="bg-orange-100"
          />
          <StatCard
            title="Tải Hạ Tầng Hệ Thống"
            value={stats ? `${stats.systemLoadPercent}%` : '28%'}
            change="Hoạt động bình thường"
            changeType="positive"
            icon={Activity}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RevenueChart data={stats?.revenueTrend} />
          </div>
          <div>
            <ServiceDistributionChart 
              data={stats?.serviceDistribution} 
              totalTickets={stats?.totalTicketsCount} 
            />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActionRequired items={stats?.actionRequired} />
          <InfrastructureHealth services={stats?.infrastructureHealth} />
        </div>
      </div>
    </div>
  );
}
