'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, MessageSquare, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui';
import EmptyState from '@/components/ui/EmptyState';

interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName?: string;
  content: string;
  messageType?: number;
  createdAt?: string;
}

interface Ticket {
  id: string;
  title: string;
  status: number;
}

function ChatB2CContent() {
  const searchParams = useSearchParams();
  const initialTicketId = searchParams.get('ticketId') || searchParams.get('ticket_id') || '';

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string>(initialTicketId);
  const [roomId, setRoomId] = useState<string>('');
  const [roomName, setRoomName] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const { addToast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch current user info
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated && data.user_id) {
          setCurrentUserId(data.user_id);
        }
      })
      .catch(() => {});
  }, []);

  // 2. Fetch customer tickets
  useEffect(() => {
    async function loadTickets() {
      try {
        const res = await fetch('/api/sale/tickets?page_size=50');
        if (res.ok) {
          const data = await res.json();
          const tList: Ticket[] = data.tickets || [];
          setTickets(tList);
          if (!selectedTicketId && tList.length > 0) {
            setSelectedTicketId(tList[0].id);
          }
        }
      } catch (err) {
        console.error('[ChatB2C] Error fetching tickets:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTickets();
  }, [selectedTicketId]);

  // 3. Fetch chat room for selected ticket
  const loadRoomAndMessages = useCallback(async (ticketId: string) => {
    if (!ticketId) return;
    setLoadingMessages(true);
    try {
      const roomRes = await fetch(`/api/sale/chat/ticket-room?ticket_id=${encodeURIComponent(ticketId)}`);
      const roomData = await roomRes.json();
      if (roomData.room?.id) {
        const targetRoomId = roomData.room.id;
        setRoomId(targetRoomId);
        setRoomName(roomData.room.name || `Ticket #${ticketId.slice(0, 8)}`);

        // Load messages
        const msgRes = await fetch(`/api/sale/chat/messages?room_id=${encodeURIComponent(targetRoomId)}&page_size=50`);
        const msgData = await msgRes.json();
        if (Array.isArray(msgData.messages)) {
          setMessages(msgData.messages);
        }
      } else {
        setRoomId('');
        setMessages([]);
      }
    } catch (err) {
      console.error('[ChatB2C] Error fetching room:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTicketId) {
      loadRoomAndMessages(selectedTicketId);
    }
  }, [selectedTicketId, loadRoomAndMessages]);

  // 4. Poll for new messages every 4s
  useEffect(() => {
    if (!roomId) return;
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/sale/chat/messages?room_id=${encodeURIComponent(roomId)}&page_size=50`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.messages)) {
            setMessages(data.messages);
          }
        }
      } catch {
        // silent fail during polling
      }
    }, 4000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [roomId]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 5. Send message
  const handleSend = async () => {
    const text = input.trim();
    if (!text || !roomId || sending) return;

    setSending(true);
    setInput('');
    try {
      const res = await fetch('/api/sale/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: roomId,
          content: text,
          message_type: 'text',
        }),
      });

      if (!res.ok) {
        throw new Error('Gửi tin nhắn thất bại');
      }

      // Refresh messages immediately
      const msgRes = await fetch(`/api/sale/chat/messages?room_id=${encodeURIComponent(roomId)}&page_size=50`);
      const msgData = await msgRes.json();
      if (Array.isArray(msgData.messages)) {
        setMessages(msgData.messages);
      }
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Lỗi gửi tin nhắn');
      setInput(text); // restore input
    } finally {
      setSending(false);
    }
  };

  const formatMsgTime = (iso?: string) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] p-6">
        <EmptyState
          icon="chat"
          title="Chưa có yêu cầu hỗ trợ nào"
          description="Bạn chưa tạo ticket nào. Hãy tạo ticket yêu cầu dịch vụ để bắt đầu chat trực tiếp với đội ngũ kỹ thuật và tư vấn."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
      {/* Header Bar */}
      <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">{roomName || 'Phòng Chat Hỗ Trợ'}</h2>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Kết nối trực tiếp Kỹ thuật viên & Tư vấn viên</span>
              </div>
            </div>
          </div>

          {/* Ticket Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium hidden sm:inline">Ticket:</span>
            <select
              value={selectedTicketId}
              onChange={(e) => setSelectedTicketId(e.target.value)}
              className="text-xs font-semibold px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 max-w-[240px] truncate"
            >
              {tickets.map((t) => (
                <option key={t.id} value={t.id}>
                  #{t.id.slice(0, 8)} - {t.title}
                </option>
              ))}
            </select>
            <button
              onClick={() => selectedTicketId && loadRoomAndMessages(selectedTicketId)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="Làm mới tin nhắn"
            >
              <RefreshCw className={`w-4 h-4 ${loadingMessages ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 space-y-4">
        {loadingMessages ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <MessageSquare className="w-12 h-12 mb-3 text-gray-300 stroke-1" />
            <p className="font-semibold text-gray-700">Chưa có tin nhắn trong phiên này</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm">
              Gửi tin nhắn đầu tiên để liên hệ với kỹ thuật viên và đội ngũ hỗ trợ.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = currentUserId ? msg.senderId === currentUserId : false;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] ${isMe ? 'order-2' : ''}`}>
                  {!isMe && (
                    <p className="text-xs mb-1 font-semibold text-blue-600">
                      {msg.senderName || 'Hỗ trợ kỹ thuật'}
                    </p>
                  )}
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm break-words ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <p className={`text-[10px] text-gray-400 mt-1 ${isMe ? 'text-right' : ''}`}>
                    {formatMsgTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="bg-white border-t border-gray-200 px-4 lg:px-6 py-3 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!roomId || sending}
            placeholder={roomId ? "Nhập tin nhắn..." : "Đang kết nối phòng chat..."}
            className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || !roomId || sending}
            className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center justify-center"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ChatB2C() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <ChatB2CContent />
    </Suspense>
  );
}
