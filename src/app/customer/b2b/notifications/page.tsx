'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Wrench,
  Shield,
  Users,
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

interface Notification {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  priority?: 'high' | 'normal';
}

const initialNotifications: Notification[] = [
  { id: '1', type: 'sla', title: 'Vi phạm SLA – #T-0048', description: 'Ticket "Sửa server NAS" đã vi phạm SLA High (4h). Cần xử lý ngay.', time: '5 phút trước', read: false, icon: AlertTriangle, iconColor: 'text-red-600', bgColor: 'bg-red-50', priority: 'high' },
  { id: '2', type: 'budget', title: 'Ngân sách Sales Dept đạt 72%', description: 'Phòng Sales đã dùng 18,000,000 / 25,000,000 VNĐ trong tháng này.', time: '30 phút trước', read: false, icon: DollarSign, iconColor: 'text-amber-600', bgColor: 'bg-amber-50' },
  { id: '3', type: 'approval', title: 'Ticket #T-0045 đã được Admin duyệt', description: 'Yêu cầu "Nâng cấp RAM 5 máy tính" đã qua bước phê duyệt cuối.', time: '1 giờ trước', read: false, icon: CheckCircle2, iconColor: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  { id: '4', type: 'maintenance', title: 'Bảo dưỡng định kỳ – Canon CN20250001', description: 'Máy in Canon LBP 2900 đến hạn bảo dưỡng (6 tháng từ lần sửa cuối).', time: '2 giờ trước', read: true, icon: Wrench, iconColor: 'text-orange-600', bgColor: 'bg-orange-50' },
  { id: '5', type: 'escalation', title: 'Escalation – Manager chưa duyệt 24h', description: 'Ticket #T-0054 chờ Manager duyệt hơn 24h, đã tự động chuyển lên Admin.', time: '3 giờ trước', read: true, icon: Shield, iconColor: 'text-purple-600', bgColor: 'bg-purple-50' },
  { id: '6', type: 'member', title: 'Thành viên mới', description: 'Hoàng Mai đã được thêm vào HR Department với vai trò Staff.', time: '1 ngày trước', read: true, icon: Users, iconColor: 'text-blue-600', bgColor: 'bg-blue-50' },
];

type Tab = 'all' | 'unread' | 'important';

export default function NotificationsB2B() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [activeTab, setActiveTab] = useState<Tab>('all');

  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'important') return n.priority === 'high' || n.type === 'sla';
    return true;
  });

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'unread', label: 'Chưa đọc', count: unreadCount },
    { key: 'important', label: 'Quan trọng' },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Thông báo</h1>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${activeTab === tab.key ? 'bg-white text-[#0f172a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}{tab.count != null ? ` (${tab.count})` : ''}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <EmptyState icon="bell" title="Không có thông báo" description="Không có thông báo nào phù hợp với bộ lọc." />
        ) : filtered.map((notif) => {
          const Icon = notif.icon;
          return (
            <div
              key={notif.id}
              className={`flex gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${
                notif.read
                  ? 'bg-white border-gray-100 hover:bg-gray-50'
                  : notif.priority === 'high'
                  ? 'bg-red-50/50 border-red-200 hover:bg-red-50'
                  : 'bg-emerald-50/30 border-emerald-100 hover:bg-emerald-50/50'
              }`}
            >
              <div className={`w-10 h-10 rounded-full ${notif.bgColor} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${notif.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className={`text-sm font-medium ${notif.read ? 'text-gray-700' : 'text-gray-900'}`}>
                    {notif.title}
                  </h3>
                  {!notif.read && (
                    <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${notif.priority === 'high' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{notif.description}</p>
                <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
