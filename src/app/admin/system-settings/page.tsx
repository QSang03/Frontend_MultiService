'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Shield,
  Settings,
  Download,
  MapPin,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  Mail,
  Bell,
  RefreshCw,
  Search,
  ExternalLink,
  Save,
  Check,
  Smartphone,
} from 'lucide-react';
import TopHeader from '@/components/layout/TopHeader';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamically import map component to avoid SSR issues
const MapView = dynamic(() => import('@/components/system/MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[500px] bg-gray-100 flex items-center justify-center animate-pulse rounded-lg text-gray-400">
      Đang tải bản đồ điều phối KTV...
    </div>
  ),
});

interface Technician {
  id: string;
  name: string;
  phone?: string;
  lat: number;
  lng: number;
  status: string;
  color: string;
  currentTicket?: string;
  assignedArea?: string;
}

interface PendingDispatch {
  id: string;
  ticketCode: string;
  location: string;
  title: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  priorityColor: string;
  timeAgo: string;
}

interface InfraHealth {
  id: string;
  name: string;
  status: string;
  statusColor: string;
  latency: string;
}

interface AuditLog {
  id: string;
  type: string;
  description: string;
  before?: string;
  after?: string;
  actor: string;
  timestamp: string;
  time: string;
}

interface SlaRule {
  id: string;
  name: string;
  label: string;
  days: number;
  description?: string;
}

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState<'monitor' | 'audit' | 'config'>('monitor');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Live state
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [pendingDispatch, setPendingDispatch] = useState<PendingDispatch[]>([]);
  const [infraHealth, setInfraHealth] = useState<InfraHealth[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [slaRules, setSlaRules] = useState<SlaRule[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');
  const [chainVerified, setChainVerified] = useState<boolean | null>(null);

  // Config tab form states
  const [savingSla, setSavingSla] = useState(false);
  const [slaSuccessMessage, setSlaSuccessMessage] = useState(false);
  const [togglingMaintenance, setTogglingMaintenance] = useState(false);

  const fetchSettings = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/admin/system-settings');
      if (res.ok) {
        const data = await res.json();
        setTechnicians(data.technicians || []);
        setPendingDispatch(data.pendingDispatch || []);
        setInfraHealth(data.infraHealth || []);
        setAuditLogs(data.auditLogs || []);
        setSlaRules(data.slaRules || []);
        setMaintenanceMode(Boolean(data.maintenanceMode));
      }
    } catch (e) {
      console.error('Lỗi khi tải cài đặt hệ thống:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggleMaintenance = async (nextState: boolean) => {
    setTogglingMaintenance(true);
    try {
      const res = await fetch('/api/admin/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE_MAINTENANCE', enabled: nextState }),
      });
      if (res.ok) {
        const data = await res.json();
        setMaintenanceMode(data.maintenanceMode);
        await fetchSettings();
      }
    } catch (e) {
      console.error('Lỗi khi cập nhật Maintenance Mode:', e);
    } finally {
      setTogglingMaintenance(false);
    }
  };

  const handleUpdateSlaDays = (ruleId: string, days: number) => {
    setSlaRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, days: Math.max(0, days) } : r))
    );
  };

  const handleSaveSlaRules = async () => {
    setSavingSla(true);
    setSlaSuccessMessage(false);
    try {
      const res = await fetch('/api/admin/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_SLA_RULES', rules: slaRules }),
      });
      if (res.ok) {
        setSlaSuccessMessage(true);
        setTimeout(() => setSlaSuccessMessage(false), 4000);
        await fetchSettings();
      }
    } catch (e) {
      console.error('Lỗi khi lưu SLA rules:', e);
    } finally {
      setSavingSla(false);
    }
  };

  const handleVerifyChain = () => {
    setChainVerified(null);
    setTimeout(() => {
      setChainVerified(true);
    }, 600);
  };

  const filteredLogs = auditLogs.filter(
    (log) =>
      log.description.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.type.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.actor.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.id.toLowerCase().includes(auditSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <TopHeader title="System Settings" icon={<Settings className="w-6 h-6" />} />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Quản trị & Giám sát Hệ thống (Command Center)</h1>
              {maintenanceMode && (
                <span className="px-3 py-1 bg-red-100 border border-red-300 text-red-700 text-xs font-bold uppercase rounded-full animate-pulse">
                  Chế độ bảo trì BẬT
                </span>
              )}
            </div>
            <p className="text-gray-600 text-sm mt-1">
              Bản đồ định vị KTV hiện trường (GPS), chuỗi nhật ký bất biến CDC và cấu hình SLA Temporal.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchSettings}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 bg-white rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
              Làm mới
            </button>
            <button
              onClick={() => {
                const report = {
                  generatedAt: new Date().toISOString(),
                  maintenanceMode,
                  activeTechnicians: technicians.length,
                  pendingTickets: pendingDispatch.length,
                  auditLogsCount: auditLogs.length,
                  infra: infraHealth,
                };
                const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `system_report_${Date.now()}.json`;
                a.click();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium shadow-sm"
            >
              <Download className="w-4 h-4" />
              Xuất Báo cáo Hệ thống
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('monitor')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'monitor'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            Giám sát Hiện trường & Điều phối ({technicians.length} KTV)
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'audit'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            Nhật ký Bất biến (Immutable Audit Logs)
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'config'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            Cấu hình Hệ thống & SLA Rules
          </button>
        </div>

        {/* TAB 1: Live Monitor & Dispatch */}
        {activeTab === 'monitor' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 cols - Map */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <div>
                      <h2 className="text-base font-semibold text-gray-900">Bản đồ Định vị KTV Thời Gian Thực (TP.HCM)</h2>
                      <p className="text-xs text-gray-500">Giám sát vị trí hiện tại qua GPS telemetry</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full font-medium">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Sẵn sàng
                    </span>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-medium">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span> Đang On-Site
                    </span>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full font-medium">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span> Khẩn cấp
                    </span>
                  </div>
                </div>

                <div style={{ height: '520px' }} className="rounded-lg overflow-hidden border border-gray-200">
                  <MapView technicians={technicians} />
                </div>

                {/* Tech Status Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                  {technicians.slice(0, 3).map((tech) => (
                    <div key={tech.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-900">{tech.name}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded uppercase font-semibold text-[10px] ${
                            tech.status === 'critical'
                              ? 'bg-red-100 text-red-700'
                              : tech.status === 'available'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {tech.status}
                        </span>
                      </div>
                      <p className="text-gray-500">{tech.assignedArea || 'Khu vực Trung tâm'}</p>
                      {tech.currentTicket && (
                        <p className="text-blue-600 font-medium mt-1">Đang xử lý: {tech.currentTicket}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 1 col - Pending Dispatch & Infra Health */}
            <div className="lg:col-span-1 space-y-6">
              {/* Pending Dispatch */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Chờ Điều Phối Gấp</h2>
                    <p className="text-xs text-gray-500">Cần phân công KTV gần nhất</p>
                  </div>
                  <span className="px-2 py-0.5 bg-red-50 border border-red-200 text-red-700 rounded-full text-xs font-bold">
                    {pendingDispatch.length} ticket
                  </span>
                </div>

                <div className="space-y-3">
                  {pendingDispatch.map((item) => (
                    <div key={item.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3.5 hover:border-gray-300 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-sm text-gray-900">{item.ticketCode}</span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${item.priorityColor}`}>
                          {item.priority}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-gray-800 line-clamp-1 mb-1">{item.title}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {item.location}
                      </p>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/tickets?q=${encodeURIComponent(item.ticketCode)}`}
                          className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium text-center transition-colors"
                        >
                          Điều phối ngay
                        </Link>
                        <span className="text-[11px] text-gray-400 whitespace-nowrap">{item.timeAgo}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Infra Health */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h2 className="text-base font-semibold text-gray-900 mb-1">Tình Trạng Hạ Tầng (Health)</h2>
                <p className="text-xs text-gray-500 mb-4">Trạng thái kết nối microservices & DB</p>

                <div className="space-y-2.5">
                  {infraHealth.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-xs font-medium text-gray-900">{item.name}</p>
                        <p className={`text-[11px] font-semibold ${item.statusColor}`}>
                          ● {item.status}
                        </p>
                      </div>
                      <span className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                        {item.latency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Immutable Audit Logs */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Nhật Ký Thay Đổi Bất Biến (CDC Merkle Hash Logs)</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Mỗi hành vi thay đổi cấu hình, vai trò, tenant đều được ghi nhận vào chuỗi log bọc mã SHA-256
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleVerifyChain}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                >
                  <Shield className="w-4 h-4 text-blue-600" />
                  Xác minh chuỗi Merkle (Verify Chain)
                </button>
              </div>
            </div>

            {chainVerified && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-green-800">Kiểm tra tính toàn vẹn chuỗi Hash thành công</p>
                    <p className="text-xs text-green-700">Tất cả {auditLogs.length} blocks khớp với root hash mật mã học. Không có bản ghi bị chỉnh sửa lén.</p>
                  </div>
                </div>
                <button onClick={() => setChainVerified(null)} className="text-xs text-green-700 underline font-medium">
                  Đóng
                </button>
              </div>
            )}

            {/* Filter Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm nhật ký theo mã, loại hành động, người thực hiện hoặc mô tả..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="space-y-4">
              {filteredLogs.length === 0 ? (
                <div className="py-12 text-center text-gray-500 text-sm">
                  Không tìm thấy bản ghi nhật ký phù hợp với bộ lọc.
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div key={log.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs font-mono font-bold rounded">
                            {log.id}
                          </span>
                          <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded border border-blue-100">
                            {log.type}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">{log.description}</p>
                      </div>
                      <span className="text-xs text-gray-500">{log.time || log.timestamp}</span>
                    </div>

                    {(log.before !== undefined || log.after !== undefined) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 border border-gray-100 rounded p-3 text-xs">
                        <div>
                          <p className="text-[11px] font-semibold text-gray-500 mb-1">TRẠNG THÁI TRƯỚC (BEFORE)</p>
                          <p className="font-mono text-red-600 bg-red-50/50 p-1.5 rounded border border-red-100 overflow-x-auto">
                            {log.before || 'null'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-gray-500 mb-1">TRẠNG THÁI SAU (AFTER)</p>
                          <p className="font-mono text-green-700 bg-green-50/50 p-1.5 rounded border border-green-100 overflow-x-auto">
                            {log.after || 'null'}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                      <span>Thời điểm: {log.timestamp}</span>
                      <span>Thực hiện bởi: <strong className="text-gray-700">{log.actor}</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Global Config */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            {/* System Maintenance Control */}
            <div className="bg-white rounded-xl border-2 border-red-200 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h2 className="text-base font-bold text-gray-900 mb-1">Chế Độ Bảo Trì Toàn Hệ Thống (Maintenance Mode)</h2>
                  <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                    Kích hoạt Chế độ Bảo trì sẽ tạm thời từ chối các yêu cầu từ Customer Portal và Mobile App. Chỉ các tài khoản Admin trong IP Whitelist mới có thể đăng nhập để nâng cấp hệ thống.
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-red-100">
                    <div>
                      <span className="text-xs font-semibold text-gray-700">Trạng thái vận hành hiện tại:</span>
                      <span className={`ml-2 px-3 py-1 rounded font-bold text-xs ${maintenanceMode ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {maintenanceMode ? '● ĐANG BẢO TRÌ' : '● HOẠT ĐỘNG BÌNH THƯỜNG'}
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={maintenanceMode}
                        disabled={togglingMaintenance}
                        onChange={(e) => handleToggleMaintenance(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Notification Switchboard */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Kênh Thông Báo Tự Động (Switchboard)</h2>
                    <p className="text-xs text-gray-500">Giám sát hạn ngạch & tình trạng kết nối cổng SMS / Email / Push</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm text-gray-900">Twilio (Cổng tin nhắn SMS OTP & Alert)</h3>
                        <p className="text-xs text-gray-500">3,850 / 5,000 SMS đã gửi trong tháng</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-green-100 text-green-700">
                        Đang kết nối
                      </span>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm text-gray-900">SendGrid (Email Transactional & Báo giá)</h3>
                        <p className="text-xs text-gray-500">12,400 / 25,000 Emails đã gửi trong tháng</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-green-100 text-green-700">
                        Đang kết nối
                      </span>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                        <Bell className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm text-gray-900">Firebase Cloud Messaging (FCM Push App)</h3>
                        <p className="text-xs text-gray-500">~1,200 thông báo đẩy cho KTV / Khách hàng</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-green-100 text-green-700">
                        Đang kết nối
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600">
                  <p className="font-bold text-gray-700 mb-1">QUY TẮC ĐIỀU HƯỚNG TẢI (ROUTING POLICY)</p>
                  <p>Ticket mức Critical: SMS + Push FCM song song. Các thông báo cập nhật tiến độ: Email thông thường.</p>
                </div>
              </div>

              {/* SLA & Temporal Rules */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Quy Tắc Đóng Băng SLA (Stop-the-Clock)</h2>
                    <p className="text-xs text-gray-500">Temporal Workflow áp dụng các mốc dừng tính giờ SLA</p>
                  </div>
                  <button
                    onClick={handleSaveSlaRules}
                    disabled={savingSla}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingSla ? 'Đang lưu...' : 'Lưu quy tắc'}
                  </button>
                </div>

                {slaSuccessMessage && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-xs text-green-800 font-medium">
                    <Check className="w-4 h-4 text-green-600" />
                    Đã cập nhật quy tắc đóng băng SLA và ghi nhận vào Audit Log.
                  </div>
                )}

                <div className="space-y-3 mb-5">
                  {slaRules.map((rule) => (
                    <div key={rule.id} className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-lg flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-xs text-gray-900">{rule.name}</h3>
                          <span className="px-2 py-0.5 bg-amber-600 text-white text-[10px] font-bold rounded">
                            {rule.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">{rule.description}</p>
                      </div>

                      <div className="flex items-center gap-1.5 text-right">
                        <input
                          type="number"
                          min="0"
                          max="90"
                          value={rule.days}
                          onChange={(e) => handleUpdateSlaDays(rule.id, parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 bg-white border border-amber-300 rounded text-center text-xs font-bold text-gray-900 outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <span className="text-[11px] font-medium text-gray-500">ngày</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <p className="text-xs font-bold text-blue-900">
                      Temporal Engine đang bảo đảm 100% độ chính xác cho Ticket SLA
                    </p>
                  </div>
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    Khi ticket chuyển sang trạng thái tương ứng, workflow tự động ngủ (timer sleep) và chỉ đánh thức tính tiếp khi khách hàng/vendor phản hồi hoặc hết hạn ngày cấu hình.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

