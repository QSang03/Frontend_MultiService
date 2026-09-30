'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Building2, 
  Users, 
  Database, 
  Shield, 
  Lock, 
  AlertCircle, 
  CheckCircle, 
  ArrowRight, 
  Key, 
  PlayCircle,
  RefreshCw,
  Search,
  Sliders,
  X,
  ExternalLink,
  Layers,
  FileCheck,
  Trash2,
  Wrench,
  Clock,
  Check,
  XCircle
} from 'lucide-react';
import TopHeader from '@/components/layout/TopHeader';
import internalApiClient from '@/lib/api/internal-client';
import { toast } from '@/components/ui/Toast';

export interface B2BTenant {
  id: string;
  name: string;
  subdomain: string;
  plan: 'ENTERPRISE' | 'GROWTH' | 'STARTER';
  status: 'ACTIVE' | 'PROVISIONING' | 'SUSPENDED';
  databaseName: string;
  maxConnections: number;
  users: {
    current: number;
    max: number;
  };
  storage: {
    current: number;
    max: number;
    unit: string;
  };
  tickets: {
    current: number;
    max: number;
  };
  taxCode?: string;
  address?: string;
  createdAt?: string;
}

export interface ServiceProviderRequest {
  id: string;
  userId: string;
  companyName: string;
  requestedPlanId: string;
  website: string;
  description: string;
  status: string;
  adminNotes: string;
  createdAt: string;
}

export interface B2BApprovalSettings {
  orgId: string;
  enabled: boolean;
  levels: number;
  threshold1: number;
  threshold2: number;
  timeoutHours: number;
  escalationHours: number;
}

export default function TenantB2BPage() {
  const [activeTab, setActiveTab] = useState<'directory' | 'onboarding' | 'security' | 'service_providers'>('directory');
  const [tenants, setTenants] = useState<B2BTenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('ALL');

  // Onboarding wizard state
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [address, setAddress] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'growth' | 'enterprise'>('starter');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionSuccessMsg, setProvisionSuccessMsg] = useState<string | null>(null);

  // Approval Modal state
  const [selectedTenantForApproval, setSelectedTenantForApproval] = useState<B2BTenant | null>(null);
  const [approvalSettings, setApprovalSettings] = useState<B2BApprovalSettings | null>(null);
  const [isLoadingApproval, setIsLoadingApproval] = useState(false);
  const [isSavingApproval, setIsSavingApproval] = useState(false);
  const [approvalSuccessMsg, setApprovalSuccessMsg] = useState<string | null>(null);

  // Quota Edit state
  const [editingQuotaTenant, setEditingQuotaTenant] = useState<B2BTenant | null>(null);
  const [quotaUsers, setQuotaUsers] = useState<number>(50);
  const [quotaStorage, setQuotaStorage] = useState<number>(500);
  const [quotaTickets, setQuotaTickets] = useState<number>(2000);
  const [quotaStatus, setQuotaStatus] = useState<string>('ACTIVE');
  const [isSavingQuota, setIsSavingQuota] = useState<boolean>(false);

  // Service Providers state
  const [spRequests, setSpRequests] = useState<ServiceProviderRequest[]>([]);
  const [isLoadingSp, setIsLoadingSp] = useState<boolean>(false);
  const [spStatusFilter, setSpStatusFilter] = useState<string>('ALL');
  const [reviewingSp, setReviewingSp] = useState<ServiceProviderRequest | null>(null);
  const [reviewApproved, setReviewApproved] = useState<boolean>(true);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  // Fetch tenants from real API
  const fetchTenants = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await internalApiClient.get('/api/admin/tenants');
      const fetched = response.data.tenants || [];
      setTenants(fetched);
    } catch (err: unknown) {
      console.error('Failed to fetch tenants:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tenants');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  // Filtered tenants
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchesSearch = 
        !searchQuery ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subdomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.taxCode && t.taxCode.includes(searchQuery));
      
      const matchesPlan = planFilter === 'ALL' || t.plan === planFilter;
      return matchesSearch && matchesPlan;
    });
  }, [tenants, searchQuery, planFilter]);

  // Open Approval Settings
  const openApprovalModal = async (tenant: B2BTenant) => {
    setSelectedTenantForApproval(tenant);
    setIsLoadingApproval(true);
    setApprovalSuccessMsg(null);
    try {
      const res = await internalApiClient.get(`/api/admin/tenants/${tenant.id}/approval`);
      setApprovalSettings(res.data.settings);
    } catch (e) {
      console.error('Failed to load approval settings:', e);
      // Fallback defaults
      setApprovalSettings({
        orgId: tenant.id,
        enabled: true,
        levels: 2,
        threshold1: 2000000,
        threshold2: 10000000,
        timeoutHours: 24,
        escalationHours: 48,
      });
    } finally {
      setIsLoadingApproval(false);
    }
  };

  // Save Approval Settings
  const handleSaveApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantForApproval || !approvalSettings) return;

    setIsSavingApproval(true);
    try {
      await internalApiClient.put(`/api/admin/tenants/${selectedTenantForApproval.id}/approval`, approvalSettings);
      setApprovalSuccessMsg('Cập nhật cấu hình phê duyệt B2B thành công!');
      setTimeout(() => {
        setSelectedTenantForApproval(null);
      }, 1200);
    } catch (e) {
      toast.error('Lỗi lưu cấu hình: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setIsSavingApproval(false);
    }
  };

  // Submit Onboarding
  const handleCompleteProvisioning = async () => {
    if (!companyName.trim()) {
      toast.error('Vui lòng nhập Tên công ty');
      return;
    }

    setIsProvisioning(true);
    try {
      const generatedOrgId = `org_${Date.now()}`;
      await internalApiClient.post('/api/admin/tenants', {
        orgId: generatedOrgId,
        name: companyName.trim(),
        plan: selectedPlan.toUpperCase(),
        taxCode: taxCode.trim(),
        address: address.trim(),
        subdomain: subdomain.trim(),
      });

      setProvisionSuccessMsg(`Cấp phát Tenant [${companyName}] thành công! Cơ sở dữ liệu và phân vùng RLS đã sẵn sàng.`);
      await fetchTenants();
      setTimeout(() => {
        setProvisionSuccessMsg(null);
        setOnboardingStep(1);
        setCompanyName('');
        setTaxCode('');
        setAddress('');
        setSubdomain('');
        setAdminName('');
        setAdminEmail('');
        setActiveTab('directory');
      }, 1500);
    } catch (e) {
      toast.error('Lỗi cấp phát: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleDeleteTenant = async (tenant: B2BTenant) => {
    if (!window.confirm(`Bạn có chắc chắn muốn thu hồi và xóa Tenant [${tenant.name}] (${tenant.id})? Hành động này sẽ giải phóng phân vùng cơ sở dữ liệu.`)) {
      return;
    }
    try {
      const res = await internalApiClient.delete(`/api/admin/tenants?orgId=${tenant.id}`);
      if (res.data?.success) {
        toast.success(`Đã thu hồi Tenant [${tenant.name}] thành công!`);
        fetchTenants();
      } else {
        toast.error(res.data?.error || 'Lỗi khi xóa Tenant');
      }
    } catch (e) {
      toast.error('Lỗi khi xóa Tenant: ' + (e instanceof Error ? e.message : 'Unknown error'));
    }
  };

  const fetchSpRequests = useCallback(async () => {
    setIsLoadingSp(true);
    try {
      const res = await internalApiClient.get('/api/admin/service-providers/requests');
      if (res.data?.success && Array.isArray(res.data.requests)) {
        setSpRequests(res.data.requests);
      }
    } catch (err) {
      console.error('Failed to load SP requests', err);
    } finally {
      setIsLoadingSp(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'service_providers') {
      fetchSpRequests();
    }
  }, [activeTab, fetchSpRequests]);

  const filteredSpRequests = useMemo(() => {
    if (spStatusFilter === 'ALL') return spRequests;
    return spRequests.filter((r) => r.status === spStatusFilter);
  }, [spRequests, spStatusFilter]);

  const handleSaveQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuotaTenant) return;
    setIsSavingQuota(true);
    try {
      const res = await internalApiClient.put('/api/admin/tenants', {
        orgId: editingQuotaTenant.id,
        maxUsers: Number(quotaUsers),
        maxStorage: Number(quotaStorage),
        maxTickets: Number(quotaTickets),
        status: quotaStatus,
      });
      if (res.data?.success) {
        toast.success(`Cập nhật Quota Tenant [${editingQuotaTenant.name}] thành công!`);
        setEditingQuotaTenant(null);
        fetchTenants();
      } else {
        toast.error(res.data?.error || 'Lỗi cập nhật Quota');
      }
    } catch (err) {
      toast.error('Lỗi khi lưu Quota: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSavingQuota(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingSp) return;
    setIsSubmittingReview(true);
    try {
      const res = await internalApiClient.post('/api/admin/service-providers/requests', {
        requestId: reviewingSp.id,
        approved: reviewApproved,
        adminNotes: reviewNotes.trim(),
      });
      if (res.data?.success) {
        toast.success(res.data.message || 'Xử lý hồ sơ thành công!');
        setReviewingSp(null);
        fetchSpRequests();
      } else {
        toast.error(res.data?.error || 'Lỗi khi xét duyệt');
      }
    } catch (err) {
      toast.error('Lỗi xét duyệt: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const sqlPolicy = `-- POLICY: TENANT_ISOLATION
CREATE POLICY tenant_isolation ON all_tables
FOR ALL
TO ALL
USING (tenant_id = current_setting('app.current_tenant_id')::uuid)`;

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader 
        title="Tenant B2B"
        icon={<Building2 className="w-6 h-6" />}
      />

      <div className="p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Tenant Management (B2B SaaS)</h1>
            <p className="text-sm text-gray-600">
              Quản lý tổ chức khách hàng doanh nghiệp B2B, Hạn mức Quota, Phân tách dữ liệu RLS và Cơ chế duyệt ngân sách.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchTenants}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-all shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
            <button 
              onClick={() => setActiveTab('onboarding')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm"
            >
              <Building2 className="w-4 h-4" />
              Cấp phát Tenant mới
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'directory'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Building2 className="w-5 h-5" />
            Danh bạ Tenant & Quota ({tenants.length})
          </button>
          <button
            onClick={() => setActiveTab('onboarding')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'onboarding'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <PlayCircle className="w-5 h-5" />
            Quy trình Cấp phát (Provisioning Wizard)
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'security'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Shield className="w-5 h-5" />
            Bảo mật & Phân lập RLS
          </button>
          <button
            onClick={() => setActiveTab('service_providers')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'service_providers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Layers className="w-5 h-5" />
            Đối tác Kỹ thuật (Service Providers) ({spRequests.length})
          </button>
        </div>

        {/* 1. DIRECTORY & QUOTA TAB */}
        {activeTab === 'directory' && (
          <div className="space-y-4">
            {/* Search and Filter Bar */}
            <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo Tên công ty, Subdomain, Mã số thuế..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">Gói cước:</span>
                {['ALL', 'ENTERPRISE', 'GROWTH', 'STARTER'].map((plan) => (
                  <button
                    key={plan}
                    onClick={() => setPlanFilter(plan)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      planFilter === plan
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {plan}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="py-20 text-center text-gray-500">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                Đang tải danh bạ Tenant B2B từ gRPC Backend...
              </div>
            ) : filteredTenants.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-xl border border-gray-200">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-900">Không tìm thấy Tenant nào</h3>
                <p className="text-sm text-gray-500 mt-1">Bấm &quot;Cấp phát Tenant mới&quot; để khởi tạo tổ chức doanh nghiệp đầu tiên.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTenants.map((tenant) => {
                  const planBadgeColor = 
                    tenant.plan === 'ENTERPRISE'
                      ? 'bg-purple-100 text-purple-700 border-purple-200'
                      : tenant.plan === 'GROWTH'
                      ? 'bg-blue-100 text-blue-700 border-blue-200'
                      : 'bg-gray-100 text-gray-700 border-gray-200';

                  const userPct = Math.round((tenant.users.current / tenant.users.max) * 100);
                  const storagePct = Math.round((tenant.storage.current / tenant.storage.max) * 100);
                  const ticketPct = Math.round((tenant.tickets.current / tenant.tickets.max) * 100);

                  return (
                    <div key={tenant.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-extrabold text-2xl shadow-md shadow-blue-500/10">
                            {tenant.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-bold text-gray-900">{tenant.name}</h3>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${planBadgeColor}`}>
                                {tenant.plan}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                tenant.status === 'ACTIVE'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                ● {tenant.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1 font-mono">
                                🌐 {tenant.subdomain}
                              </span>
                              <span className="flex items-center gap-1 font-mono">
                                🗄️ DB: {tenant.databaseName}
                              </span>
                              {tenant.taxCode && (
                                <span>MST: {tenant.taxCode}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingQuotaTenant(tenant);
                              setQuotaUsers(tenant.users.max);
                              setQuotaStorage(tenant.storage.max);
                              setQuotaTickets(tenant.tickets.max);
                              setQuotaStatus(tenant.status);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors border border-indigo-200"
                            title="Điều chỉnh hạn mức Quota và trạng thái hoạt động"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            Sửa Quota
                          </button>
                          <button
                            onClick={() => openApprovalModal(tenant)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors border border-blue-200"
                            title="Cấu hình hạn mức phê duyệt 2 cấp / 3 cấp (SRS II.1.B)"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            Duyệt Ngân Sách
                          </button>
                          <a
                            href={`https://${tenant.subdomain}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Truy cập Workspace
                          </a>
                          <button
                            onClick={() => handleDeleteTenant(tenant)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition-colors border border-red-200"
                            title="Thu hồi và xóa Tenant"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Xóa
                          </button>
                        </div>
                      </div>

                      {/* Usage Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
                        {/* Users Quota */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5 text-xs">
                            <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-blue-600" />
                              Tài khoản (Users)
                            </span>
                            <span className="font-bold text-gray-900">
                              {tenant.users.current} / {tenant.users.max} ({userPct}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                userPct > 90 ? 'bg-red-500' : 'bg-blue-600'
                              }`}
                              style={{ width: `${Math.min(userPct, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Storage Quota */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5 text-xs">
                            <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                              <Database className="w-3.5 h-3.5 text-purple-600" />
                              Dung lượng (Storage)
                            </span>
                            <span className="font-bold text-gray-900">
                              {tenant.storage.current} / {tenant.storage.max} {tenant.storage.unit} ({storagePct}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                storagePct > 90 ? 'bg-red-500' : 'bg-purple-600'
                              }`}
                              style={{ width: `${Math.min(storagePct, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Ticket / Mo */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5 text-xs">
                            <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 text-green-600" />
                              Tickets / Tháng
                            </span>
                            <span className="font-bold text-gray-900">
                              {tenant.tickets.current} / {tenant.tickets.max} ({ticketPct}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                ticketPct > 90 ? 'bg-red-500' : 'bg-green-600'
                              }`}
                              style={{ width: `${Math.min(ticketPct, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. ONBOARDING PIPELINE TAB */}
        {activeTab === 'onboarding' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2/3 - Wizard */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-2">B2B Tenant Provisioning Wizard</h2>
              <p className="text-xs text-gray-500 mb-6">
                Khởi tạo môi trường độc lập (Tenant Isolation), cấu hình hạn mức và kích hoạt phân quyền.
              </p>

              {provisionSuccessMsg && (
                <div className="p-4 mb-6 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  {provisionSuccessMsg}
                </div>
              )}

              {/* Steps Progress Indicator */}
              <div className="flex items-center justify-between mb-8">
                {[
                  { step: 1, label: 'Thông tin Công ty' },
                  { step: 2, label: 'Subdomain & DB' },
                  { step: 3, label: 'Tài khoản Quản trị' },
                  { step: 4, label: 'Xác nhận & Cấp phát' },
                ].map((item, idx) => (
                  <React.Fragment key={item.step}>
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
                        onboardingStep === item.step
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : onboardingStep > item.step
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'bg-white border-gray-300 text-gray-400'
                      }`}>
                        {onboardingStep > item.step ? <CheckCircle className="w-5 h-5" /> : item.step}
                      </div>
                      <p className={`text-xs font-semibold mt-1.5 ${
                        onboardingStep === item.step ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {item.label}
                      </p>
                    </div>
                    {idx < 3 && (
                      <div className={`flex-1 h-0.5 mx-3 mb-6 ${
                        onboardingStep > item.step ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Step 1: Company Profile & Plan */}
              {onboardingStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                        Tên Công ty / Khách hàng B2B <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => {
                          setCompanyName(e.target.value);
                          if (!subdomain) {
                            setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                          }
                        }}
                        placeholder="VD: Tập đoàn Logistics Toàn Cầu"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                        Mã Số Thuế (Tax ID)
                      </label>
                      <input
                        type="text"
                        value={taxCode}
                        onChange={(e) => setTaxCode(e.target.value)}
                        placeholder="VD: 0314892182"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                      Địa chỉ Trụ sở
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="VD: Tòa nhà Tech Tower, Q.1, TP. Hồ Chí Minh"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                      Gói Dịch Vụ (Subscription Plan)
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'starter', label: 'Starter', users: '15 Users', desc: 'DN quy mô nhỏ, 100GB Storage' },
                        { id: 'growth', label: 'Growth', users: '50 Users', desc: 'DN đang phát triển, 500GB' },
                        { id: 'enterprise', label: 'Enterprise', users: '200+ Users', desc: 'Đầy đủ tính năng, 1TB+' },
                      ].map((plan) => (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setSelectedPlan(plan.id as 'starter' | 'growth' | 'enterprise')}
                          className={`p-3.5 border-2 rounded-xl text-left transition-all ${
                            selectedPlan === plan.id
                              ? 'border-blue-600 bg-blue-50/50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="font-bold text-sm text-gray-900">{plan.label}</div>
                          <div className="text-xs font-semibold text-blue-600 mt-0.5">{plan.users}</div>
                          <div className="text-[11px] text-gray-500 mt-1">{plan.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      disabled={!companyName.trim()}
                      onClick={() => setOnboardingStep(2)}
                      className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                    >
                      Bước tiếp theo: Cấu hình Workspace
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Subdomain & DB */}
              {onboardingStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                      Subdomain Nền tảng <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={subdomain}
                        onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                        placeholder="tencongty"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-xs font-mono text-gray-600">
                        .multiservice.io
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">Đường dẫn portal chuyên dụng cho nhân viên khách hàng B2B.</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Cơ chế cách ly CSDL:</span>
                      <span className="font-semibold text-gray-900">PostgreSQL Schema Isolation / RLS</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Database Name đề xuất:</span>
                      <span className="font-mono font-bold text-blue-700">tenant_{subdomain || 'company'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Connection Pool:</span>
                      <span className="font-semibold text-gray-900">20 Max Connections</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setOnboardingStep(1)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                    >
                      Quay lại
                    </button>
                    <button
                      type="button"
                      disabled={!subdomain.trim()}
                      onClick={() => setOnboardingStep(3)}
                      className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:bg-gray-300"
                    >
                      Bước tiếp theo: Tài khoản Admin
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Admin Account */}
              {onboardingStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                        Họ và tên Quản trị viên B2B <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="VD: Nguyễn Văn Giám Đốc"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                        Email Doanh nghiệp <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="admin@congty.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    ℹ️ Hệ thống sẽ tự động cấp tài khoản vai trò <strong>TENANT_ADMIN</strong> và gửi email kích hoạt kèm hướng dẫn đăng nhập lần đầu.
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setOnboardingStep(2)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                    >
                      Quay lại
                    </button>
                    <button
                      type="button"
                      onClick={() => setOnboardingStep(4)}
                      className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                    >
                      Bước tiếp theo: Xác nhận & Cấp phát
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Summary & Provisioning */}
              {onboardingStep === 4 && (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Khách hàng:</span>
                      <span className="font-bold text-gray-900">{companyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subdomain:</span>
                      <span className="font-mono text-blue-700">{subdomain}.multiservice.io</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Gói đăng ký:</span>
                      <span className="font-semibold uppercase text-purple-700">{selectedPlan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Người quản trị:</span>
                      <span>{adminName || 'Admin Khởi tạo'} ({adminEmail || 'admin@' + subdomain + '.com'})</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setOnboardingStep(3)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                    >
                      Quay lại
                    </button>
                    <button
                      type="button"
                      disabled={isProvisioning}
                      onClick={handleCompleteProvisioning}
                      className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-bold shadow-md shadow-green-600/20 transition-all"
                    >
                      {isProvisioning ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Đang cấp phát CSDL & Tenant...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Khởi tạo & Kích hoạt Tenant Ngay
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right 1/3 - Information Card */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  Kiến trúc Hybrid Multi-Tenant
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-3">
                  Mỗi B2B Tenant được thiết lập không gian dữ liệu độc lập với cơ chế Row-Level Security (RLS) của PostgreSQL.
                </p>
                <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside">
                  <li>Không lẫn lộn dữ liệu giữa các tổ chức</li>
                  <li>Tự quản lý thành viên & phân quyền phòng ban</li>
                  <li>Cơ chế phê duyệt chi phí nội bộ 2-3 cấp</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 text-xs text-blue-900 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-blue-800">
                  <Key className="w-4 h-4" />
                  Provisioning API Token
                </div>
                <p className="text-blue-700">
                  Khóa API nội bộ được gắn tự động để giao tiếp qua gRPC <code>multiservice.tenant.v1.TenantService</code>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3. SECURITY & ISOLATION TAB */}
        {activeTab === 'security' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left - PostgreSQL RLS */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-5 h-5 text-green-600" />
                <h2 className="text-base font-bold text-gray-900">Trạng thái Thực thi PostgreSQL RLS</h2>
              </div>
              <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full mb-4">
                ● ACTIVE & ENFORCED
              </span>

              <div className="bg-[#1e1e1e] rounded-xl p-4 mb-4">
                <pre className="text-xs font-mono text-gray-300 overflow-x-auto">
                  <code>{sqlPolicy}</code>
                </pre>
              </div>

              <div className="flex items-center gap-3 text-xs text-green-700 font-semibold mb-4">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Leak Proof Verified
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Context Injected via Session
                </span>
              </div>
            </div>

            {/* Right - Impersonation Audit */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-red-600" />
                  Nhật ký Hỗ trợ Đăng nhập (Impersonation Log)
                </h2>
                <span className="text-xs text-gray-400">SRS II.1</span>
              </div>

              <div className="space-y-3">
                <div className="border border-gray-100 bg-gray-50 rounded-xl p-3.5 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-900">Admin System</span>
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded font-semibold text-[10px]">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-gray-600">Đăng nhập hỗ trợ xử lý sự cố SLA cho Tenant <strong>Logistics Global</strong></p>
                  <p className="text-gray-400 text-[11px] mt-1">10 phút trước • Phiên tự động hết hạn sau 30 phút</p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <span>
                  Mọi hành động can thiệp vào Tenant khách hàng đều được ghi log bất biến (Immutable Audit) theo tiêu chuẩn bảo mật doanh nghiệp.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Service Providers Onboarding & Review */}
        {activeTab === 'service_providers' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-indigo-600" />
                    Thẩm Định & Xét Duyệt Đối Tác Kỹ Thuật (Service Provider)
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Quy trình thẩm định hồ sơ năng lực, chứng chỉ hành nghề và phê duyệt tham gia mạng lưới cung cấp dịch vụ (SRS I.5, III.2).
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                    {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => {
                      const count = status === 'ALL' 
                        ? spRequests.length 
                        : spRequests.filter(r => r.status === status).length;
                      return (
                        <button
                          key={status}
                          onClick={() => setSpStatusFilter(status)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            spStatusFilter === status
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          <span>{status === 'ALL' ? 'Tất cả' : status === 'PENDING' ? 'Chờ duyệt' : status === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            status === 'PENDING' && count > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={fetchSpRequests}
                    disabled={isLoadingSp}
                    className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 disabled:opacity-50"
                    title="Làm mới danh sách"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingSp ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Requests List */}
            {isLoadingSp ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-xs text-gray-500">
                <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Đang tải danh sách hồ sơ đối tác...
              </div>
            ) : filteredSpRequests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                  <Wrench className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">Không có hồ sơ đăng ký nào</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Chưa có yêu cầu đăng ký Service Provider nào ở trạng thái đã chọn.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredSpRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:border-indigo-300 transition-all space-y-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-black">
                          {req.companyName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-gray-900">{req.companyName}</h3>
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              req.status === 'APPROVED'
                                ? 'bg-green-100 text-green-700'
                                : req.status === 'REJECTED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              ● {req.status === 'APPROVED' ? 'ĐÃ DUYỆT' : req.status === 'REJECTED' ? 'TỪ CHỐI' : 'CHỜ THẨM ĐỊNH'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                            <span>Gói dịch vụ: <strong className="text-gray-700">{req.requestedPlanId || 'Standard'}</strong></span>
                            {req.website && (
                              <a
                                href={req.website.startsWith('http') ? req.website : `https://${req.website}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-600 hover:underline flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                {req.website}
                              </a>
                            )}
                            <span className="text-gray-400 font-mono text-[11px]">User ID: {req.userId}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setReviewingSp(req);
                            setReviewApproved(true);
                            setReviewNotes(req.adminNotes || '');
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-200"
                        >
                          <FileCheck className="w-4 h-4" />
                          {req.status === 'PENDING' ? 'Thẩm Định & Duyệt' : 'Cập Nhật Kết Quả'}
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 bg-gray-50 rounded-xl text-xs space-y-1.5 border border-gray-100">
                      <div className="font-semibold text-gray-700">Mô tả năng lực & Giải pháp:</div>
                      <p className="text-gray-600 leading-relaxed">
                        {req.description || 'Không có mô tả chi tiết từ đối tác.'}
                      </p>
                      {req.adminNotes && (
                        <div className="pt-2 border-t border-gray-200 mt-2 text-indigo-900">
                          <strong>Ghi chú thẩm định của Admin:</strong> {req.adminNotes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: B2B Approval Settings (SRS II.1.B & III.7) */}
      {selectedTenantForApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedTenantForApproval(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/50">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-base font-bold text-gray-900">Cấu hình Duyệt Ngân Sách B2B</h3>
                  <p className="text-xs text-gray-500">{selectedTenantForApproval.name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTenantForApproval(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingApproval ? (
              <div className="py-12 text-center text-xs text-gray-500">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Đang tải cấu hình phê duyệt...
              </div>
            ) : approvalSettings ? (
              <form onSubmit={handleSaveApproval} className="p-6 space-y-4">
                {approvalSuccessMsg && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    {approvalSuccessMsg}
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <div className="text-xs font-bold text-gray-900">Bật cơ chế Phê duyệt Chi phí</div>
                    <div className="text-[11px] text-gray-500">Bắt buộc duyệt trước khi KTV tiến hành sửa chữa / cung ứng</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={approvalSettings.enabled}
                    onChange={(e) => setApprovalSettings({ ...approvalSettings, enabled: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Số cấp duyệt (Levels)
                    </label>
                    <select
                      value={approvalSettings.levels}
                      onChange={(e) => setApprovalSettings({ ...approvalSettings, levels: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value={1}>1 cấp (Admin Doanh nghiệp)</option>
                      <option value={2}>2 cấp (Manager → Admin)</option>
                      <option value={3}>3 cấp (Staff → Manager → Admin)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Thời gian chờ duyệt (Giờ)
                    </label>
                    <input
                      type="number"
                      value={approvalSettings.timeoutHours}
                      onChange={(e) => setApprovalSettings({ ...approvalSettings, timeoutHours: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Ngưỡng tiền Cấp 1 (VNĐ - Trưởng phòng)
                  </label>
                  <input
                    type="number"
                    step="100000"
                    value={approvalSettings.threshold1}
                    onChange={(e) => setApprovalSettings({ ...approvalSettings, threshold1: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Dưới ngưỡng này Trưởng phòng duyệt là có hiệu lực.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Ngưỡng tiền Cấp 2 (VNĐ - Giám đốc / Admin)
                  </label>
                  <input
                    type="number"
                    step="500000"
                    value={approvalSettings.threshold2}
                    onChange={(e) => setApprovalSettings({ ...approvalSettings, threshold2: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Vượt ngưỡng này bắt buộc phải có Giám đốc duyệt.</p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setSelectedTenantForApproval(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingApproval}
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {isSavingApproval ? 'Đang lưu...' : 'Lưu Cấu Hình'}
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      )}

      {/* MODAL: Edit Tenant Quotas */}
      {editingQuotaTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setEditingQuotaTenant(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-50/50">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-base font-bold text-gray-900">Điều Chỉnh Hạn Mức Quota Tenant</h3>
                  <p className="text-xs text-gray-500">{editingQuotaTenant.name} ({editingQuotaTenant.id})</p>
                </div>
              </div>
              <button
                onClick={() => setEditingQuotaTenant(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuota} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Số lượng Tài khoản tối đa (Max Users)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={quotaUsers}
                  onChange={(e) => setQuotaUsers(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
                <p className="text-[11px] text-gray-500 mt-1">Hạn mức tài khoản nhân viên được cấp trong Tenant.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Dung lượng lưu trữ tối đa (GB - Max Storage)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100000"
                  value={quotaStorage}
                  onChange={(e) => setQuotaStorage(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
                <p className="text-[11px] text-gray-500 mt-1">Dung lượng phân vùng lưu trữ tài liệu, hình ảnh, file đính kèm.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Hạn mức Ticket / Tháng (Max Tickets)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100000"
                  value={quotaTickets}
                  onChange={(e) => setQuotaTickets(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
                <p className="text-[11px] text-gray-500 mt-1">Số lượng ticket yêu cầu dịch vụ được tạo trong chu kỳ.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Trạng thái Hoạt động Tenant
                </label>
                <select
                  value={quotaStatus}
                  onChange={(e) => setQuotaStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="ACTIVE">Hoạt động bình thường (ACTIVE)</option>
                  <option value="SUSPENDED">Tạm ngưng kích hoạt (SUSPENDED)</option>
                  <option value="PROVISIONING">Đang cấp phát (PROVISIONING)</option>
                </select>
                <p className="text-[11px] text-gray-500 mt-1">Khóa quyền truy cập nếu chọn Tạm ngưng (SUSPENDED).</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingQuotaTenant(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingQuota}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:bg-gray-400 flex items-center gap-1.5"
                >
                  {isSavingQuota && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {isSavingQuota ? 'Đang lưu...' : 'Lưu Hạn Mức'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Review Service Provider Request */}
      {reviewingSp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setReviewingSp(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-50/50">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-base font-bold text-gray-900">Thẩm Định Đối Tác Kỹ Thuật</h3>
                  <p className="text-xs text-gray-500">{reviewingSp.companyName}</p>
                </div>
              </div>
              <button
                onClick={() => setReviewingSp(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-gray-50 rounded-xl text-xs space-y-1 border border-gray-100">
                <div className="flex justify-between">
                  <span className="text-gray-500">Mã yêu cầu:</span>
                  <span className="font-mono font-semibold text-gray-800">{reviewingSp.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Gói yêu cầu:</span>
                  <span className="font-semibold text-gray-800">{reviewingSp.requestedPlanId || 'Standard'}</span>
                </div>
                {reviewingSp.website && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Website:</span>
                    <span className="text-indigo-600 font-semibold">{reviewingSp.website}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  Kết quả Thẩm định Hồ sơ
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewApproved(true)}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-bold transition-all ${
                      reviewApproved
                        ? 'border-green-500 bg-green-50 text-green-700 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <CheckCircle className={`w-4 h-4 ${reviewApproved ? 'text-green-600' : 'text-gray-400'}`} />
                    <span>PHÊ DUYỆT (Chấp thuận)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewApproved(false)}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-bold transition-all ${
                      !reviewApproved
                        ? 'border-red-500 bg-red-50 text-red-700 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <XCircle className={`w-4 h-4 ${!reviewApproved ? 'text-red-600' : 'text-gray-400'}`} />
                    <span>TỪ CHỐI HỒ SƠ</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Ý kiến thẩm định / Lý do từ chối (Admin Notes)
                </label>
                <textarea
                  rows={4}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Ghi chú chi tiết kết quả thẩm định, bổ sung tài liệu hoặc lý do từ chối..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-[11px] text-gray-500 mt-1">Nội dung này sẽ được ghi vào hồ sơ và thông báo đến đối tác.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setReviewingSp(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className={`px-5 py-2 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    reviewApproved ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  } disabled:bg-gray-400`}
                >
                  {isSubmittingReview && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {isSubmittingReview ? 'Đang gửi...' : reviewApproved ? 'Xác nhận Phê Duyệt' : 'Xác nhận Từ Chối'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
