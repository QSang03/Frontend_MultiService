'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Wrench,
  Shield,
  Users,
  Loader2,
  Bell,
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import internalApiClient from '@/lib/api/internal-client';

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

interface RawTicket {
  id: string;
  title: string;
  status: number;
  priority?: string;
  attributes?: string;
  createdAt?: string;
  targetResolutionAt?: string;
}

type Tab = 'all' | 'unread' | 'important';

export default function NotificationsB2B() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('all');

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

            if (t.status === 1) {
              list.push({
                id: `notif-${t.id}-1`,
                type: 'approval',
                title: `Yêu cầu #${shortId} đang chờ phê duyệt`,
                description: `Ticket "${t.title}" đã được khởi tạo và đang đợi cấp quản lý xét duyệt.`,
                time: timeStr,
                read: idx > 2,
                icon: Shield,
                iconColor: 'text-purple-600',
                bgColor: 'bg-purple-50',
                priority: 'normal',
              });
            } else if (t.status === 3 || t.status === 7) {
              const isHigh = t.priority?.toLowerCase() === 'high' || t.priority?.toLowerCase() === 'critical';
              list.push({
                id: `notif-${t.id}-3`,
                type: isHigh ? 'sla' : 'ticket',
                title: isHigh ? `Cảnh báo SLA – #${shortId}` : `KTV đang xử lý #${shortId}`,
                description: `Ticket "${t.title}" đang được đội ngũ kỹ thuật IT tiến hành xử lý.`,
                time: timeStr,
                read: idx > 1,
                icon: isHigh ? AlertTriangle : Wrench,
                iconColor: isHigh ? 'text-red-600' : 'text-blue-600',
                bgColor: isHigh ? 'bg-red-50' : 'bg-blue-50',
                priority: isHigh ? 'high' : 'normal',
              });
            } else if (t.status === 5) {
              list.push({
                id: `notif-${t.id}-5`,
                type: 'approval',
                title: `Báo giá #${shortId} đã hoàn tất`,
                description: `Phương án kỹ thuật và chi phí cho "${t.title}" đã được gửi tới tổ chức.`,
                time: timeStr,
                read: false,
                icon: DollarSign,
                iconColor: 'text-amber-600',
                bgColor: 'bg-amber-50',
                priority: 'normal',
              });
            } else if (t.status >= 9) {
              list.push({
                id: `notif-${t.id}-9`,
                type: 'completed',
                title: `Hoàn tất yêu cầu #${shortId}`,
                description: `Ticket "${t.title}" đã nghiệm thu và bàn giao thành công.`,
                time: timeStr,
                read: true,
                icon: CheckCircle2,
                iconColor: 'text-emerald-600',
                bgColor: 'bg-emerald-50',
                priority: 'normal',
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
                  type: notif.type?.toLowerCase() || 'ticket',
                  title: notif.title || 'Thông báo mới',
                  description: notif.content || '',
                  time: 'Vừa xong',
                  read: Boolean(notif.isRead),
                  icon: isHigh ? AlertTriangle : notif.type === 'APPROVAL' ? Shield : Bell,
                  iconColor: isHigh ? 'text-red-600' : 'text-blue-600',
                  bgColor: isHigh ? 'bg-red-50' : 'bg-blue-50',
                  priority: isHigh ? 'high' : 'normal',
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

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === 'unread') return !n.read;
      if (activeTab === 'important') return n.priority === 'high' || n.type === 'sla';
      return true;
    });
  }, [notifications, activeTab]);

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
        {loading ? (
          <div className="py-16 text-center text-gray-400 bg-white rounded-xl border border-gray-100">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
            Đang tải thông báo...
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="bell" title="Không có thông báo" description="Không có thông báo nào phù hợp với bộ lọc." />
        ) : filtered.map((notif) => {
          const Icon = notif.icon;
          return (
            <div
              key={notif.id}
              onClick={() => handleMarkSingleRead(notif.id)}
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
