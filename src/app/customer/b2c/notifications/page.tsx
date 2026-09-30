'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  Wrench,
  CreditCard,
  MessageCircle,
  Loader2,
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import internalApiClient from '@/lib/api/internal-client';

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

interface RawTicket {
  id: string;
  title: string;
  status: number;
  attributes?: string;
  createdAt?: string;
  assignedTechId?: string;
}

type TabKey = 'all' | 'unread' | 'important';

export default function NotificationsB2C() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/sale/tickets?page_size=50')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.tickets)) {
          const list: Notification[] = [];
          data.tickets.forEach((t: RawTicket, idx: number) => {
            const shortId = t.id.slice(-6);
            const timeStr = t.createdAt
              ? new Date(t.createdAt).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Gần đây';

            if (t.status === 1 || t.status === 3) {
              list.push({
                id: `notif-${t.id}-1`,
                type: 'ticket',
                title: `Đã tiếp nhận yêu cầu #${shortId}`,
                description: `Yêu cầu "${t.title}" đã được ghi nhận vào hệ thống và đang điều phối KTV.`,
                time: timeStr,
                read: idx > 2,
                icon: Clock,
                iconColor: 'text-blue-600',
                bgColor: 'bg-blue-50',
              });
            } else if (t.status === 5) {
              list.push({
                id: `notif-${t.id}-5`,
                type: 'payment',
                title: `Báo giá dịch vụ #${shortId}`,
                description: `Báo giá cho "${t.title}" đã được duyệt. Vui lòng xác nhận tiến hành.`,
                time: timeStr,
                read: false,
                icon: CreditCard,
                iconColor: 'text-yellow-600',
                bgColor: 'bg-yellow-50',
              });
            } else if (t.status === 7) {
              list.push({
                id: `notif-${t.id}-7`,
                type: 'ticket',
                title: `KTV đang xử lý #${shortId}`,
                description: `Kỹ thuật viên đang thực hiện sửa chữa và kiểm tra thiết bị của bạn.`,
                time: timeStr,
                read: idx > 1,
                icon: Wrench,
                iconColor: 'text-orange-600',
                bgColor: 'bg-orange-50',
              });
            } else if (t.status >= 9) {
              list.push({
                id: `notif-${t.id}-9`,
                type: 'ticket',
                title: `Dịch vụ hoàn tất – #${shortId}`,
                description: `Yêu cầu "${t.title}" đã được nghiệm thu và hoàn thành bàn giao.`,
                time: timeStr,
                read: true,
                icon: CheckCircle2,
                iconColor: 'text-green-600',
                bgColor: 'bg-green-50',
              });
            }
          });

          setNotifications(list);
        }
      })
      .catch((err) => {
        console.error('Failed to load notifications', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/notifications/stream');
      es.onmessage = (event) => {
        try {
          const notif = JSON.parse(event.data);
          if (notif && notif.id) {
            setNotifications((prev) => {
              if (prev.some((p) => p.id === notif.id)) return prev;
              const isHigh = notif.type === 'SLA' || notif.type === 'CRITICAL';
              return [
                {
                  id: notif.id,
                  type: notif.type?.toLowerCase() === 'payment' ? 'payment' : notif.type?.toLowerCase() === 'chat' ? 'chat' : isHigh ? 'sla' : 'ticket',
                  title: notif.title || 'Thông báo mới',
                  description: notif.content || '',
                  time: 'Vừa xong',
                  read: Boolean(notif.isRead),
                  icon: isHigh ? Clock : Bell,
                  iconColor: isHigh ? 'text-red-600' : 'text-blue-600',
                  bgColor: isHigh ? 'bg-red-50' : 'bg-blue-50',
                },
                ...prev,
              ];
            });
          }
        } catch {
        }
      };
    } catch (e) {
      console.error('Notification SSE connection error:', e);
    }

    return () => {
      if (es) es.close();
    };
  }, []);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const handleMarkSingleRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await internalApiClient.post('/api/notifications/read', { notificationId: id });
    } catch {
    }
  };

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    unreadIds.forEach((id) => {
      internalApiClient.post('/api/notifications/read', { notificationId: id }).catch(() => {});
    });
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === 'unread') return !n.read;
      if (activeTab === 'important') return n.type === 'sla' || n.type === 'payment';
      return true;
    });
  }, [notifications, activeTab]);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'unread', label: `Chưa đọc (${unreadCount})` },
    { key: 'important', label: 'Quan trọng' },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Thông báo của bạn</h1>
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
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
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
      {loading ? (
        <div className="py-16 text-center text-gray-400 bg-white rounded-xl border border-gray-100 shadow-sm">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
          Đang tải thông báo...
        </div>
      ) : filteredNotifications.length === 0 ? (
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
                onClick={() => handleMarkSingleRead(notif.id)}
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
