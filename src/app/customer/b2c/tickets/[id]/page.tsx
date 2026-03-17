'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  MessageCircle,
  CheckCircle2,
  Circle,
  Clock,
  User,
  MapPin,
  Send,
  Zap,
  ThumbsUp,
  ThumbsDown,
  Navigation,
  Loader2,
  AlertCircle,
} from 'lucide-react';

/* ───── types ───── */
type Ticket = {
  id: string;
  title: string;
  status: number;
  priority?: string;
  categoryId?: string;
  description?: string;
  attributes?: string;
  createdAt?: string;
  assignedTechId?: string;
  assignedSaleId?: string;
  slaHours?: number;
  targetResponseAt?: string;
  targetResolutionAt?: string;
};

type Quotation = {
  id: string;
  ticketId?: string;
  totalAmount?: string;
  taxAmount?: string;
  currency?: string;
  note?: string;
  isAccepted?: boolean;
  items?: string;
  createdAt?: string;
};

type ChatMessage = {
  id: string;
  roomId: string;
  senderId: string;
  senderName?: string;
  content: string;
  messageType: number;
  createdAt?: string;
};

type LiveLocation = {
  latitude: number;
  longitude: number;
  timestamp: string | null;
};

/* ───── status helpers ───── */
const STATUS_MAP: Record<number, { label: string; color: string }> = {
  1: { label: 'Nháp', color: 'bg-gray-100 text-gray-600' },
  3: { label: 'Mở', color: 'bg-blue-100 text-blue-700' },
  5: { label: 'Đã duyệt giá', color: 'bg-green-100 text-green-700' },
  7: { label: 'Đang xử lý', color: 'bg-yellow-100 text-yellow-700' },
  9: { label: 'Đã giải quyết', color: 'bg-emerald-100 text-emerald-700' },
  10: { label: 'Đã đóng', color: 'bg-gray-200 text-gray-500' },
};

function getStatusInfo(status: number) {
  return STATUS_MAP[status] ?? { label: `Trạng thái ${status}`, color: 'bg-gray-100 text-gray-600' };
}

function buildTimeline(status: number) {
  const steps = [
    { label: 'Đã nhận yêu cầu', threshold: 1 },
    { label: 'Sale báo giá', threshold: 3 },
    { label: 'Đã duyệt giá', threshold: 5 },
    { label: 'Tech đang xử lý', threshold: 7 },
    { label: 'Đã giải quyết', threshold: 9 },
    { label: 'Đã đóng', threshold: 10 },
  ];
  let pendingFound = false;
  return steps.map((s) => {
    const done = status >= s.threshold;
    let pending = false;
    if (!done && !pendingFound) { pending = true; pendingFound = true; }
    return { label: s.label, done, pending };
  });
}

function fmtDate(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function fmtCurrency(v?: string) {
  if (!v) return '0';
  const n = Number(v);
  if (isNaN(n)) return v;
  return n.toLocaleString('vi-VN');
}

/* ───── component ───── */
export default function TicketDetailB2C() {
  const { id } = useParams<{ id: string }>();

  // Ticket state
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Quotation state
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [quotationLoading, setQuotationLoading] = useState(false);
  const [quotationAction, setQuotationAction] = useState('');

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatMsg, setChatMsg] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live location state
  const [liveLocation, setLiveLocation] = useState<LiveLocation | null>(null);
  const [locationTracking, setLocationTracking] = useState(false);
  const locationPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // SLA boost state
  const [slaBoostLoading, setSlaBoostLoading] = useState(false);
  const [slaBoostResult, setSlaBoostResult] = useState<{ success: boolean; message: string; newDeadline?: string } | null>(null);

  /* ───── fetch ticket ───── */
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/sale/tickets?ticket_id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ticket) {
          setTicket(data.ticket);
        } else if (data.tickets?.length) {
          const found = data.tickets.find((t: Ticket) => t.id === id);
          setTicket(found ?? null);
        } else {
          setError('Không tìm thấy ticket');
        }
      })
      .catch(() => setError('Lỗi tải ticket'))
      .finally(() => setLoading(false));
  }, [id]);

  /* ───── fetch quotation for ticket ───── */
  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/tickets/quotations?ticket_id=${encodeURIComponent(id)}`)
      .then((r) => { if (r.ok) return r.json(); return null; })
      .then((data) => { if (data?.quotation) setQuotation(data.quotation); })
      .catch(() => {});
  }, [id]);

  /* ───── chat functions ───── */
  const openChat = useCallback(async () => {
    if (!id) return;
    setChatOpen(true);
    setChatLoading(true);
    try {
      // Get or create room
      const roomRes = await fetch(`/api/sale/chat/ticket-room?ticket_id=${encodeURIComponent(id)}`);
      const roomData = await roomRes.json();
      if (roomData.room?.id) {
        setRoomId(roomData.room.id);
        // Load messages
        const msgRes = await fetch(`/api/sale/chat/messages?room_id=${encodeURIComponent(roomData.room.id)}&page_size=50`);
        const msgData = await msgRes.json();
        if (msgData.messages) setMessages(msgData.messages);
      }
    } catch {
      setMessages([]);
    } finally {
      setChatLoading(false);
    }
  }, [id]);

  // Poll for new messages every 5s when chat is open
  useEffect(() => {
    if (chatOpen && roomId) {
      chatPollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/sale/chat/messages?room_id=${encodeURIComponent(roomId)}&page_size=50`);
          const data = await res.json();
          if (data.messages) setMessages(data.messages);
        } catch { /* ignore */ }
      }, 5000);
    }
    return () => { if (chatPollRef.current) clearInterval(chatPollRef.current); };
  }, [chatOpen, roomId]);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!chatMsg.trim() || !roomId) return;
    const content = chatMsg.trim();
    setChatMsg('');
    try {
      await fetch('/api/sale/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId, content, message_type: 'text' }),
      });
      // Refresh messages
      const res = await fetch(`/api/sale/chat/messages?room_id=${encodeURIComponent(roomId)}&page_size=50`);
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch { /* ignore */ }
  };

  /* ───── quotation accept / reject ───── */
  const handleQuotation = async (action: 'accept' | 'reject') => {
    if (!quotation?.id) return;
    setQuotationLoading(true);
    setQuotationAction(action);
    try {
      const res = await fetch('/api/admin/tickets/quotations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotation_id: quotation.id, action }),
      });
      const data = await res.json();
      if (res.ok) {
        const updated = data.quotation ? { ...data.quotation, isAccepted: action === 'accept' } : { ...quotation, isAccepted: action === 'accept' };
        setQuotation(updated);
        // Re-fetch ticket to update timeline status
        const ticketRes = await fetch(`/api/sale/tickets?ticket_id=${encodeURIComponent(id)}`);
        const ticketData = await ticketRes.json();
        if (ticketData.ticket) setTicket(ticketData.ticket);
      }
    } catch { /* ignore */ }
    finally { setQuotationLoading(false); setQuotationAction(''); }
  };

  /* ───── live location tracking ───── */
  const startTracking = useCallback(() => {
    if (!id) return;
    setLocationTracking(true);
    const poll = async () => {
      try {
        const res = await fetch(`/api/sale/tickets/live-location?ticket_id=${encodeURIComponent(id)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.latitude || data.longitude) setLiveLocation(data);
        }
      } catch { /* ignore */ }
    };
    poll();
    locationPollRef.current = setInterval(poll, 5000);
  }, [id]);

  const stopTracking = useCallback(() => {
    setLocationTracking(false);
    if (locationPollRef.current) clearInterval(locationPollRef.current);
  }, []);

  useEffect(() => {
    return () => { if (locationPollRef.current) clearInterval(locationPollRef.current); };
  }, []);

  /* ───── SLA boost ───── */
  const handleSlaBoost = async (tier: number) => {
    if (!id) return;
    setSlaBoostLoading(true);
    setSlaBoostResult(null);
    try {
      const res = await fetch('/api/sale/tickets/upgrade-sla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: id, tier }),
      });
      const data = await res.json();
      setSlaBoostResult({
        success: data.success ?? false,
        message: data.message || (data.success ? 'Đã nâng cấp ưu tiên!' : 'Không thể nâng cấp'),
        newDeadline: data.new_deadline,
      });
    } catch {
      setSlaBoostResult({ success: false, message: 'Lỗi kết nối' });
    } finally { setSlaBoostLoading(false); }
  };

  /* ───── render ───── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="p-4 lg:p-8 max-w-3xl mx-auto">
        <Link href="/customer/b2c/tickets" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-600">{error || 'Không tìm thấy ticket'}</p>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(ticket.status);
  const timeline = buildTimeline(ticket.status);
  const parsedItems = (() => {
    try { return quotation?.items ? JSON.parse(quotation.items) : []; } catch { return []; }
  })();
  const isInProgress = ticket.status >= 3 && ticket.status < 10;

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Link href="/customer/b2c/tickets" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Quay lại
      </Link>

      {/* Header + Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-gray-500">#{ticket.id.slice(0, 8)}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusInfo.color}`}>{statusInfo.label}</span>
              {ticket.priority && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                  {ticket.priority}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900">{ticket.title}</h1>
            <p className="text-sm text-gray-500 mt-1">Tạo lúc: {fmtDate(ticket.createdAt)}</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Tiến trình xử lý</h3>
          <div className="space-y-0">
            {timeline.map((step, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="flex flex-col items-center">
                  {step.done ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : step.pending ? (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5 text-white" />
                    </div>
                  ) : (
                    <Circle className="w-6 h-6 text-gray-300" />
                  )}
                  {idx < timeline.length - 1 && (
                    <div className={`w-0.5 h-8 ${step.done ? 'bg-green-300' : 'bg-gray-200'}`} />
                  )}
                </div>
                <div className="pb-8">
                  <p className={`text-sm font-medium ${step.done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ticket Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h3 className="font-semibold text-gray-900">Chi tiết yêu cầu</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Danh mục</span>
            <p className="font-medium text-gray-900 mt-0.5">{ticket.categoryId || '—'}</p>
          </div>
          <div>
            <span className="text-gray-500">Ngày tạo</span>
            <p className="font-medium text-gray-900 mt-0.5">{fmtDate(ticket.createdAt)}</p>
          </div>
          {ticket.assignedTechId && (
            <div>
              <span className="text-gray-500">Tech phụ trách</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <User className="w-4 h-4 text-gray-400" />
                <p className="font-medium text-gray-900">{ticket.assignedTechId}</p>
              </div>
            </div>
          )}
          {ticket.slaHours && (
            <div>
              <span className="text-gray-500">SLA</span>
              <p className="font-medium text-gray-900 mt-0.5">{ticket.slaHours} giờ</p>
            </div>
          )}
        </div>
        {ticket.description && (
          <div>
            <span className="text-sm text-gray-500">Mô tả</span>
            <p className="text-sm text-gray-700 mt-1">{ticket.description}</p>
          </div>
        )}
        {ticket.attributes && ticket.attributes !== '{}' && (
          <div>
            <span className="text-sm text-gray-500">Thông tin bổ sung</span>
            <div className="mt-1 text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
              {(() => {
                try {
                  const attrs = JSON.parse(ticket.attributes);
                  return Object.entries(attrs).map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <span className="font-medium text-gray-600">{k}:</span>
                      <span>{String(v)}</span>
                    </div>
                  ));
                } catch { return <span>{ticket.attributes}</span>; }
              })()}
            </div>
          </div>
        )}
      </div>

      {/* US-C2.2: Live Location Tracking */}
      {isInProgress && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-blue-500" />
              Theo dõi vị trí Tech
            </h3>
            {!locationTracking ? (
              <button
                onClick={startTracking}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                Bật theo dõi
              </button>
            ) : (
              <button
                onClick={stopTracking}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
              >
                Tắt theo dõi
              </button>
            )}
          </div>
          {locationTracking && (
            <div className="bg-gray-50 rounded-lg p-4">
              {liveLocation ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium text-gray-700">
                      {liveLocation.latitude.toFixed(6)}, {liveLocation.longitude.toFixed(6)}
                    </span>
                  </div>
                  {liveLocation.timestamp && (
                    <p className="text-xs text-gray-500">Cập nhật: {fmtDate(liveLocation.timestamp)}</p>
                  )}
                  <a
                    href={`https://www.google.com/maps?q=${liveLocation.latitude},${liveLocation.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    <MapPin className="w-3.5 h-3.5" /> Xem trên Google Maps
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang tải vị trí...
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* US-C2.4: Quotation Approval */}
      {quotation && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h3 className="font-semibold text-gray-900">Báo giá</h3>
          {/* Items */}
          {parsedItems.length > 0 && (
            <div className="space-y-1 text-sm">
              {parsedItems.map((item: Record<string, unknown>, idx: number) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-gray-600">{String(item.description || item.name || `Hạng mục ${idx + 1}`)}</span>
                  <span className="font-medium">{fmtCurrency(String(item.total_price || item.unit_price || item.amount || item.price || '0'))} {quotation.currency || 'VNĐ'}</span>
                </div>
              ))}
            </div>
          )}
          {quotation.taxAmount && Number(quotation.taxAmount) > 0 && (
            <div className="flex justify-between text-sm text-orange-600">
              <span>Thuế</span>
              <span className="font-medium">{fmtCurrency(quotation.taxAmount)} {quotation.currency || 'VNĐ'}</span>
            </div>
          )}
          <div className="border-t pt-2">
            <div className="flex justify-between font-bold text-base">
              <span>Tổng cộng</span>
              <span className="text-blue-600">{fmtCurrency(quotation.totalAmount)} {quotation.currency || 'VNĐ'}</span>
            </div>
          </div>
          {quotation.note && (
            <p className="text-sm text-gray-500 italic">{quotation.note}</p>
          )}
          {quotation.isAccepted === true && (
            <div className="bg-green-50 text-green-700 text-sm font-medium rounded-lg px-3 py-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Đã phê duyệt báo giá
            </div>
          )}
          {quotation.isAccepted === false && (
            <div className="bg-red-50 text-red-700 text-sm font-medium rounded-lg px-3 py-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Đã từ chối báo giá
            </div>
          )}
          {quotation.isAccepted == null && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleQuotation('accept')}
                disabled={quotationLoading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-500 text-white font-medium text-sm hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {quotationLoading && quotationAction === 'accept' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                Phê duyệt
              </button>
              <button
                onClick={() => handleQuotation('reject')}
                disabled={quotationLoading}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {quotationLoading && quotationAction === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsDown className="w-4 h-4" />}
                Từ chối
              </button>
            </div>
          )}
        </div>
      )}

      {/* US-C2.5: SLA Priority Boost */}
      {isInProgress && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Ưu tiên xử lý nhanh (Boost SLA)
          </h3>
          <p className="text-sm text-gray-500">Bạn cần thiết bị gấp? Nâng cấp mức ưu tiên để được xử lý nhanh hơn.</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { tier: 1, label: 'Tiêu chuẩn', desc: 'Ưu tiên hơn', color: 'bg-blue-50 border-blue-200 text-blue-700' },
              { tier: 2, label: 'Nhanh', desc: 'Xử lý gấp', color: 'bg-orange-50 border-orange-200 text-orange-700' },
              { tier: 3, label: 'Khẩn cấp', desc: 'Tối ưu tiên', color: 'bg-red-50 border-red-200 text-red-700' },
            ].map((opt) => (
              <button
                key={opt.tier}
                onClick={() => handleSlaBoost(opt.tier)}
                disabled={slaBoostLoading}
                className={`p-3 rounded-xl border text-center hover:shadow-md transition-all disabled:opacity-50 ${opt.color}`}
              >
                <p className="font-semibold text-sm">{opt.label}</p>
                <p className="text-xs mt-0.5 opacity-75">{opt.desc}</p>
              </button>
            ))}
          </div>
          {slaBoostResult && (
            <div className={`text-sm rounded-lg px-3 py-2 ${slaBoostResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {slaBoostResult.message}
              {slaBoostResult.newDeadline && (
                <span className="block text-xs mt-1">Deadline mới: {fmtDate(slaBoostResult.newDeadline)}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* US-C2.3: In-ticket Chat */}
      {!chatOpen ? (
        <button
          onClick={openChat}
          className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-gray-200 rounded-xl text-blue-600 font-medium text-sm hover:bg-blue-50 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          Chat với Sale/Tech
        </button>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-blue-50">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-500" />
              Chat hỗ trợ
            </h3>
            <button onClick={() => { setChatOpen(false); if (chatPollRef.current) clearInterval(chatPollRef.current); }} className="text-sm text-gray-500 hover:text-gray-700">
              Thu gọn
            </button>
          </div>
          <div className="h-72 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {chatLoading ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <p className="text-sm text-gray-400 text-center mt-8">Chưa có tin nhắn. Hãy gửi tin nhắn đầu tiên!</p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.senderName === 'customer' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${m.senderName === 'customer' ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
                    {m.senderName && m.senderName !== 'customer' && (
                      <p className="text-xs font-medium text-gray-500 mb-0.5">{m.senderName}</p>
                    )}
                    <p>{m.content}</p>
                    {m.createdAt && (
                      <p className={`text-xs mt-1 ${m.senderName === 'customer' ? 'text-blue-200' : 'text-gray-400'}`}>
                        {fmtDate(m.createdAt)}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="flex items-center gap-2 p-3 border-t">
            <input
              value={chatMsg}
              onChange={(e) => setChatMsg(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Nhập tin nhắn..."
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={sendMessage}
              disabled={!chatMsg.trim()}
              className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
