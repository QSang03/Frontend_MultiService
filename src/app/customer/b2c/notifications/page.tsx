'use client';

import { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  Wrench,
  CreditCard,
  MessageCircle,
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

interface Notification {
  id: string;
  type: 'ticket' | 'sla' | 'payment' | 'maintenance' | 'chat' | 'system';
  title: string;
  description: string;
  time: string;
  read: boolean;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
}

const initialNotifications: Notification[] = [
  { id: '1', type: 'ticket', title: 'Tech đang đến', description: 'Tech Nguyễn Minh đang trên đường đến #T-0012. Dự kiến 15 phút.', time: '5 phút trước', read: false, icon: Clock, iconColor: 'text-blue-600', bgColor: 'bg-blue-50' },
  { id: '2', type: 'payment', title: 'Nhắc thanh toán', description: 'Ticket #T-0012 đã hoàn thành. Vui lòng thanh toán 750,000 VNĐ.', time: '1 giờ trước', read: false, icon: CreditCard, iconColor: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  { id: '3', type: 'ticket', title: 'Ticket hoàn thành', description: 'Yêu cầu #T-0010 "Sửa máy in Canon 2900" đã được hoàn thành.', time: '2 giờ trước', read: false, icon: CheckCircle2, iconColor: 'text-green-600', bgColor: 'bg-green-50' },
  { id: '4', type: 'chat', title: 'Tin nhắn mới', description: 'Sale Trần Hùng gửi tin nhắn: "Em đã gửi báo giá ạ"', time: '3 giờ trước', read: true, icon: MessageCircle, iconColor: 'text-purple-600', bgColor: 'bg-purple-50' },
  { id: '5', type: 'maintenance', title: 'Nhắc bảo dưỡng', description: 'Máy in Canon LBP 2900 đã 6 tháng chưa bảo dưỡng. Đặt lịch ngay?', time: '1 ngày trước', read: true, icon: Wrench, iconColor: 'text-orange-600', bgColor: 'bg-orange-50' },
  { id: '6', type: 'sla', title: 'Sale đã liên hệ', description: 'Sale Trần Hùng đã nhận yêu cầu #T-0012 và sẽ gọi cho bạn.', time: '2 ngày trước', read: true, icon: Bell, iconColor: 'text-gray-600', bgColor: 'bg-gray-50' },
];

type TabKey = 'all' | 'unread' | 'important';

export default function NotificationsB2C() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'important') return n.type === 'sla' || n.type === 'payment';
    return true;
  });

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'unread', label: `Chưa đọc (${unreadCount})` },
    { key: 'important', label: 'Quan trọng' },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Thông báo</h1>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === tab.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {filteredNotifications.length === 0 ? (
        <EmptyState
          icon="bell"
          title="Không có thông báo"
          description={activeTab === 'unread' ? 'Bạn đã đọc tất cả thông báo.' : 'Chưa có thông báo nào trong mục này.'}
        />
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notif) => {
            const Icon = notif.icon;
            return (
              <div
                key={notif.id}
                className={`flex gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${
                  notif.read
                    ? 'bg-white border-gray-100 hover:bg-gray-50'
                    : 'bg-blue-50/50 border-blue-100 hover:bg-blue-50'
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
                      <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{notif.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
