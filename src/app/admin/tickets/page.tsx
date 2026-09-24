'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ensureAuthReady } from '@/lib/auth/ensure-auth-ready';
import { TopHeader } from '@/components/layout';
import { 
  Search, AlertTriangle, MessageSquare, Clock, FileText, 
  Lock, RefreshCw, Loader2, UserPlus, DollarSign, CheckCircle, XCircle 
} from 'lucide-react';
import { cn } from '@/utils';
import { 
  TicketStatus, 
  TicketStatusLabels, 
  TicketStatusColors,
  TicketPriorityConfig,
  type Ticket,
  type TicketPriority 
} from '@/types/ticket';
import SubmitQuotationModal from '@/components/SubmitQuotationModal';
import AssignTicketModal from '@/components/AssignTicketModal';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  metadata: string;
  messageType: number;
  createdAt?: string;
  time: string;
  role: 'Client' | 'Sale' | 'Tech' | 'System';
}

type ChatAttachmentMeta = {
  fileId?: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  url?: string;
  dataUrl?: string;
};

function parseAttachmentMeta(metadata?: string): ChatAttachmentMeta | null {
  const raw = String(metadata ?? '').trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      fileId: parsed.fileId == null ? (parsed.file_id == null ? undefined : String(parsed.file_id)) : String(parsed.fileId),
      fileName: parsed.file_name == null ? (parsed.fileName == null ? undefined : String(parsed.fileName)) : String(parsed.file_name),
      mimeType: parsed.mime_type == null ? (parsed.mimeType == null ? undefined : String(parsed.mimeType)) : String(parsed.mime_type),
      size: parsed.file_size == null ? (parsed.size == null ? undefined : Number(parsed.size)) : Number(parsed.file_size),
      url: parsed.url == null ? (parsed.downloadUrl == null ? (parsed.download_url == null ? undefined : String(parsed.download_url)) : String(parsed.downloadUrl)) : String(parsed.url),
      dataUrl: parsed.dataUrl == null ? undefined : String(parsed.dataUrl),
    };
  } catch {
    return null;
  }
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileExtension(fileName: string): string {
  const idx = fileName.lastIndexOf('.');
  return idx >= 0 ? fileName.slice(idx + 1).toLowerCase() : '';
}

const FILE_ICON_MAP: Record<string, { icon: string; bg: string; color: string }> = {
  pdf: { icon: 'PDF', bg: 'bg-red-100', color: 'text-red-600' },
  doc: { icon: 'DOC', bg: 'bg-blue-100', color: 'text-blue-600' },
  docx: { icon: 'DOC', bg: 'bg-blue-100', color: 'text-blue-600' },
  xls: { icon: 'XLS', bg: 'bg-green-100', color: 'text-green-600' },
  xlsx: { icon: 'XLS', bg: 'bg-green-100', color: 'text-green-600' },
  csv: { icon: 'CSV', bg: 'bg-green-100', color: 'text-green-600' },
  ppt: { icon: 'PPT', bg: 'bg-orange-100', color: 'text-orange-600' },
  pptx: { icon: 'PPT', bg: 'bg-orange-100', color: 'text-orange-600' },
  zip: { icon: 'ZIP', bg: 'bg-yellow-100', color: 'text-yellow-700' },
  txt: { icon: 'TXT', bg: 'bg-gray-100', color: 'text-gray-600' },
  mp4: { icon: 'MP4', bg: 'bg-purple-100', color: 'text-purple-600' },
  mp3: { icon: 'MP3', bg: 'bg-pink-100', color: 'text-pink-600' },
};
const DEFAULT_FILE_ICON = { icon: 'FILE', bg: 'bg-gray-100', color: 'text-gray-500' };
function getFileIcon(ext: string) { return FILE_ICON_MAP[ext] ?? DEFAULT_FILE_ICON; }

function extractFileIdFromS3Url(url: string): string {
  try {
    return new URL(url).pathname.split('/').pop() ?? '';
  } catch { return ''; }
}

function isPresignedUrlExpiringSoon(url: string, thresholdMs = 5 * 60 * 1000): boolean {
  try {
    const params = new URL(url).searchParams;
    const dateStr = params.get('X-Amz-Date');
    const expiresStr = params.get('X-Amz-Expires');
    if (!dateStr || !expiresStr) return false;
    const signedAt = Date.UTC(
      parseInt(dateStr.slice(0, 4)),
      parseInt(dateStr.slice(4, 6)) - 1,
      parseInt(dateStr.slice(6, 8)),
      parseInt(dateStr.slice(9, 11)),
      parseInt(dateStr.slice(11, 13)),
      parseInt(dateStr.slice(13, 15)),
    );
    const expiresAt = signedAt + parseInt(expiresStr) * 1000;
    return Date.now() + thresholdMs >= expiresAt;
  } catch { return false; }
}

interface AdminChatMsgProps {
  msg: ChatMessage;
  attachmentUrl: string;
  attachmentFileName: string;
  attachmentFileId: string;
  attachmentSize?: number;
}

const AdminChatMessageItem = React.memo(function AdminChatMessageItem({
  msg, attachmentUrl, attachmentFileName, attachmentFileId, attachmentSize,
}: AdminChatMsgProps) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%]">
        <div className="flex items-baseline gap-2 mb-1">
          <span className={cn(
            'text-xs font-bold',
            msg.role === 'Client' ? 'text-gray-900' :
            msg.role === 'Tech' ? 'text-purple-600' :
            msg.role === 'System' ? 'text-gray-400' :
            'text-blue-600'
          )}>
            {msg.senderName}
            <span className={cn(
              'ml-1 font-normal text-[10px] px-1.5 py-0.5 rounded',
              msg.role === 'Client' ? 'bg-yellow-100 text-yellow-700' :
              msg.role === 'Tech' ? 'bg-green-100 text-green-700' :
              msg.role === 'System' ? 'bg-gray-100 text-gray-500' :
              'bg-blue-100 text-blue-700'
            )}>
              {msg.role}
            </span>
          </span>
          <span className="text-xs text-gray-400">{msg.time}</span>
        </div>
        {msg.messageType === 2 && attachmentUrl ? (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={attachmentUrl}
              alt={msg.content || 'image'}
              loading="lazy"
              decoding="async"
              width={320}
              height={240}
              className="max-h-60 max-w-xs w-auto rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(attachmentUrl, '_blank')}
            />
          </div>
        ) : msg.messageType === 2 && attachmentFileId ? (
          <div>
            <div className="h-40 w-60 rounded-xl animate-pulse bg-gray-200" />
            <p className="text-xs text-gray-400 mt-1">Đang tải ảnh...</p>
          </div>
        ) : msg.messageType === 3 && attachmentUrl ? (
          <a
            href={attachmentUrl}
            download={attachmentFileName}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors max-w-xs"
          >
            {(() => {
              const ext = getFileExtension(attachmentFileName);
              const fi = getFileIcon(ext);
              return (
                <div className={`flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center ${fi.bg}`}>
                  <span className={`text-xs font-bold ${fi.color}`}>{fi.icon}</span>
                </div>
              );
            })()}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{attachmentFileName}</p>
              <p className="text-xs text-gray-400 mt-0.5">{formatBytes(attachmentSize)}</p>
            </div>
          </a>
        ) : (msg.messageType === 2 || msg.messageType === 3) && attachmentFileId ? (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200 max-w-xs">
            <div className="w-11 h-11 rounded-lg bg-gray-100 animate-pulse flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-16 bg-gray-100 rounded animate-pulse mt-1" />
            </div>
          </div>
        ) : (
          <div className={cn(
            'p-3 rounded-2xl text-sm leading-relaxed shadow-sm break-words',
            msg.role === 'System'
              ? 'bg-gray-50 text-gray-500 italic border border-gray-200 rounded-tl-none'
              : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
          )}>
            {msg.content}
          </div>
        )}
      </div>
    </div>
  );
});

export default function TicketMonitorPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'sla'>('all');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | null>(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showIntervention, setShowIntervention] = useState(false);
  
  // Modals
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Action loading states
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatRoomId, setChatRoomId] = useState('');
  const [chatNextPageToken, setChatNextPageToken] = useState('');
  const [loadingMoreChat, setLoadingMoreChat] = useState(false);
  const [attachmentUrlByFileId, setAttachmentUrlByFileId] = useState<Record<string, string>>({});
  const [urlRefreshTick, setUrlRefreshTick] = useState(0);
  const attachmentUrlByFileIdRef = useRef(attachmentUrlByFileId);
  attachmentUrlByFileIdRef.current = attachmentUrlByFileId;
  const resolvingFileIdsRef = useRef<Set<string>>(new Set());
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const initialScrollDoneRef = useRef(false);
  const autoSelectedRef = useRef(false);
  const scrollRafRef = useRef(0);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const authReady = await ensureAuthReady();
      if (!authReady) { router.replace('/login'); return; }
      let url = '/api/admin/tickets?page_size=100';
      if (statusFilter !== null) {
        url += `&status=${statusFilter}`;
      }
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to fetch tickets');
      }
      const data = await res.json();
      setTickets(data.tickets || []);
      // Auto-select first ticket only once
      if (data.tickets?.length > 0 && !autoSelectedRef.current) {
        autoSelectedRef.current = true;
        setSelectedTicket(data.tickets[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, router]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const selectedTicketRef = useRef<Ticket | null>(null);
  useEffect(() => {
    selectedTicketRef.current = selectedTicket;
  }, [selectedTicket]);

  const loadChatForTicket = useCallback(async (ticketId: string) => {
    if (!ticketId) return;
    setChatLoading(true);
    setChatMessages([]);
    setChatRoomId('');
    setChatNextPageToken('');
    try {
      const roomRes = await fetch(`/api/sale/chat/ticket-room?ticket_id=${encodeURIComponent(ticketId)}`);
      const roomJson = await roomRes.json().catch(() => ({}));
      if (!roomRes.ok || !roomJson?.room?.id) {
        return;
      }
      const roomId = String(roomJson.room.id ?? '');
      setChatRoomId(roomId);

      const msgRes = await fetch(`/api/sale/chat/messages?room_id=${encodeURIComponent(roomId)}&page_size=50`);
      const msgJson = await msgRes.json().catch(() => ({}));
      if (!msgRes.ok) return;

      const ticket = selectedTicketRef.current;
      const raw: Record<string, unknown>[] = Array.isArray(msgJson?.messages) ? msgJson.messages : [];
      const mapped = raw.map((item): ChatMessage => {
        const senderId = String(item.senderId ?? item.sender_id ?? '').trim();
        const msgType = Number(item.messageType ?? item.message_type ?? 0);
        let role: ChatMessage['role'] = 'Sale';
        if (msgType === 4) role = 'System';
        else if (ticket && (senderId === ticket.orgId || senderId === ticket.creatorId)) role = 'Client';
        else if (ticket && senderId === ticket.assignedTechId) role = 'Tech';
        const createdAt = String(item.createdAt ?? '');
        const time = createdAt ? new Date(createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
        return {
          id: String(item.id ?? ''),
          senderId,
          senderName: String(item.senderName ?? item.sender_name ?? senderId.slice(0, 8)),
          content: String(item.content ?? ''),
          metadata: String(item.metadata ?? ''),
          messageType: msgType,
          createdAt,
          role,
          time,
        };
      });
      setChatMessages(mapped);
      setChatNextPageToken(String(msgJson?.next_page_token ?? ''));
    } finally {
      setChatLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedTicket?.id) {
      setChatMessages([]);
      setChatRoomId('');
      setChatNextPageToken('');
      return;
    }
    initialScrollDoneRef.current = false;
    void loadChatForTicket(selectedTicket.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTicket?.id]);

  useEffect(() => {
    if (!chatLoading && chatMessages.length > 0 && !initialScrollDoneRef.current) {
      initialScrollDoneRef.current = true;
      requestAnimationFrame(() => {
        const el = chatScrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      });
    }
  }, [chatLoading, chatMessages.length]);

  // Tick every 2 min to trigger proactive URL refresh
  useEffect(() => {
    const interval = setInterval(() => setUrlRefreshTick((t) => t + 1), 120_000);
    return () => clearInterval(interval);
  }, []);

  // Resolve & refresh presigned URLs for attachment messages
  useEffect(() => {
    const currentUrls = attachmentUrlByFileIdRef.current;
    const fileIds = new Set<string>();

    chatMessages.forEach((msg) => {
      if (msg.messageType !== 2 && msg.messageType !== 3) return;
      const att = parseAttachmentMeta(msg.metadata);
      const fileId = String(att?.fileId ?? '').trim();
      const urlInMeta = String(att?.url ?? '').trim();

      if (fileId && !urlInMeta) {
        const cached = currentUrls[fileId];
        if (!cached || isPresignedUrlExpiringSoon(cached)) fileIds.add(fileId);
      }
      if (urlInMeta && isPresignedUrlExpiringSoon(urlInMeta)) {
        const fid = extractFileIdFromS3Url(urlInMeta);
        if (fid) {
          const cached = currentUrls[fid];
          if (!cached || isPresignedUrlExpiringSoon(cached)) fileIds.add(fid);
        }
      }
    });

    // Also refresh any already-cached URL that is expiring soon
    Object.entries(currentUrls).forEach(([fid, url]) => {
      if (isPresignedUrlExpiringSoon(url)) fileIds.add(fid);
    });

    const toResolve = Array.from(fileIds).filter((id) => !resolvingFileIdsRef.current.has(id));
    if (toResolve.length === 0) return;
    toResolve.forEach((id) => resolvingFileIdsRef.current.add(id));

    void Promise.allSettled(
      toResolve.map((fileId) =>
        fetch(`/api/sale/chat/download-url?file_id=${encodeURIComponent(fileId)}`)
          .then((r) => r.json().catch(() => ({}) as Record<string, unknown>).then((j: Record<string, unknown>) => ({ ok: r.ok, json: j, fileId })))
          .then(({ ok, json, fileId: fid }) => {
            resolvingFileIdsRef.current.delete(fid);
            if (!ok) return null;
            const downloadUrl = String(json?.download_url ?? json?.url ?? '').trim();
            return downloadUrl ? { fid, downloadUrl } : null;
          })
          .catch(() => { resolvingFileIdsRef.current.delete(fileId); return null; })
      )
    ).then((results) => {
      const updates: Record<string, string> = {};
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) updates[r.value.fid] = r.value.downloadUrl;
      }
      if (Object.keys(updates).length > 0) setAttachmentUrlByFileId((prev) => ({ ...prev, ...updates }));
    });
  }, [chatMessages, urlRefreshTick]);

  const processedMessages = useMemo(() => {
    return [...chatMessages].reverse().map((msg) => {
      const att = parseAttachmentMeta(msg.metadata);
      const fileId = String(att?.fileId ?? '').trim();
      const fileIdFromMetaUrl = att?.url ? extractFileIdFromS3Url(att.url) : '';
      const url = String(
        (fileIdFromMetaUrl && attachmentUrlByFileId[fileIdFromMetaUrl])
          ? attachmentUrlByFileId[fileIdFromMetaUrl]
          : att?.url ?? att?.dataUrl ?? (fileId ? attachmentUrlByFileId[fileId] ?? '' : '')
      );
      const fileName = String(att?.fileName ?? msg.content ?? 'attachment');
      return { msg, attachmentUrl: url, attachmentFileName: fileName, attachmentFileId: fileId, attachmentSize: att?.size };
    });
  }, [chatMessages, attachmentUrlByFileId]);

  const filteredTickets = tickets.filter((ticket) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !ticket.id.toLowerCase().includes(query) &&
        !ticket.title.toLowerCase().includes(query) &&
        !(ticket.description?.toLowerCase().includes(query))
      ) {
        return false;
      }
    }
    
    // Quick filters
    if (activeFilter === 'active') {
      // Show only non-closed, non-cancelled tickets
      return ![
        TicketStatus.TICKET_STATUS_CLOSED,
        TicketStatus.TICKET_STATUS_CANCELLED,
        TicketStatus.TICKET_STATUS_REJECTED,
      ].includes(ticket.status);
    }
    
    if (activeFilter === 'sla') {
      // Show tickets that might have SLA risk (simplified logic)
      return ticket.slaHours > 0 && [
        TicketStatus.TICKET_STATUS_OPEN,
        TicketStatus.TICKET_STATUS_IN_PROGRESS,
        TicketStatus.TICKET_STATUS_ASSIGNED,
      ].includes(ticket.status);
    }
    
    return true;
  });

  const handleLoadMoreChat = async () => {
    if (!chatRoomId || !chatNextPageToken || loadingMoreChat) return;
    setLoadingMoreChat(true);
    try {
      const res = await fetch(`/api/sale/chat/messages?room_id=${encodeURIComponent(chatRoomId)}&page_size=30&page_token=${encodeURIComponent(chatNextPageToken)}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return;
      const ticket = selectedTicketRef.current;
      const raw: Record<string, unknown>[] = Array.isArray(json?.messages) ? json.messages : [];
      const mapped = raw.map((item): ChatMessage => {
        const senderId = String(item.senderId ?? item.sender_id ?? '').trim();
        const msgType = Number(item.messageType ?? item.message_type ?? 0);
        let role: ChatMessage['role'] = 'Sale';
        if (msgType === 4) role = 'System';
        else if (ticket && (senderId === ticket.orgId || senderId === ticket.creatorId)) role = 'Client';
        else if (ticket && senderId === ticket.assignedTechId) role = 'Tech';
        const createdAt = String(item.createdAt ?? '');
        const time = createdAt ? new Date(createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
        return {
          id: String(item.id ?? ''),
          senderId,
          senderName: String(item.senderName ?? item.sender_name ?? senderId.slice(0, 8)),
          content: String(item.content ?? ''),
          metadata: String(item.metadata ?? ''),
          messageType: msgType,
          createdAt,
          role,
          time,
        };
      });
      setChatMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        return [...mapped.filter((m) => !ids.has(m.id)), ...prev];
      });
      setChatNextPageToken(String(json?.next_page_token ?? ''));
    } finally {
      setLoadingMoreChat(false);
    }
  };

  const handleChatScroll = () => {
    if (scrollRafRef.current) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = 0;
      const container = chatScrollRef.current;
      if (!container) return;
      if (loadingMoreChat) return;
      if (!chatNextPageToken) return;
      if (container.scrollTop <= 80) {
        void handleLoadMoreChat();
      }
    });
  };

  const handleUpdateStatus= async (ticketId: string, status: TicketStatus) => {
    setActionLoading('status');
    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticketId,
          action: 'update_status',
          status,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update status');
      }
      fetchTickets();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (ticketId: string) => {
    setActionLoading('approve');
    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticketId,
          action: 'approve',
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to approve ticket');
      }
      fetchTickets();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to approve ticket');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (ticketId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    
    setActionLoading('reject');
    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticketId,
          action: 'reject',
          reason,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reject ticket');
      }
      fetchTickets();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reject ticket');
    } finally {
      setActionLoading(null);
    }
  };

  const getPriorityConfig = (priority: string) => {
    const p = priority?.toLowerCase() as TicketPriority;
    return TicketPriorityConfig[p] || TicketPriorityConfig.medium;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen">
      <TopHeader title="Ticket Monitor" />

      <div className="p-6">
        {/* Action Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={fetchTickets}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              Refresh
            </button>
          </div>
          
          {/* Status Filter */}
          <select
            value={statusFilter ?? ''}
            onChange={(e) => setStatusFilter(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {Object.entries(TicketStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ticket Queue - Left Panel */}
          <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Queue</h3>
              
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search ID, Title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={cn(
                    'px-4 py-1.5 text-sm font-medium rounded-lg transition-colors',
                    activeFilter === 'all'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-500 hover:bg-gray-50'
                  )}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveFilter('active')}
                  className={cn(
                    'px-4 py-1.5 text-sm font-medium rounded-lg transition-colors',
                    activeFilter === 'active'
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-blue-500 hover:bg-blue-50'
                  )}
                >
                  Active
                </button>
                <button
                  onClick={() => setActiveFilter('sla')}
                  className={cn(
                    'px-4 py-1.5 text-sm font-medium rounded-lg transition-colors',
                    activeFilter === 'sla'
                      ? 'bg-orange-100 text-orange-600'
                      : 'text-orange-500 hover:bg-orange-50'
                  )}
                >
                  SLA Risk
                </button>
              </div>
            </div>

            {/* Ticket List */}
            <div className="max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No tickets found
                </div>
              ) : (
                filteredTickets.map((ticket) => {
                  const priority = getPriorityConfig(ticket.priority);
                  const statusColor = TicketStatusColors[ticket.status] || TicketStatusColors[TicketStatus.TICKET_STATUS_UNSPECIFIED];
                  const isSelected = selectedTicket?.id === ticket.id;

                  return (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={cn(
                        'p-4 border-b border-gray-100 cursor-pointer transition-colors',
                        isSelected
                          ? 'bg-blue-50 border-l-4 border-l-blue-500'
                          : 'hover:bg-gray-50'
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-900">#{ticket.id.slice(0, 8)}</span>
                        <span className={cn('px-2 py-0.5 text-xs font-medium rounded', priority.color)}>
                          {priority.label}
                        </span>
                      </div>
                      <h4 className="text-sm font-medium text-gray-800 mb-1 line-clamp-2">{ticket.title}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <span className={cn('px-2 py-0.5 text-xs font-medium rounded', statusColor.bg, statusColor.text)}>
                          {TicketStatusLabels[ticket.status]}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(ticket.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Ticket Detail - Right Panel */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
            {selectedTicket ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h2 className="text-xl font-bold text-gray-900">{selectedTicket.title}</h2>
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                          #{selectedTicket.id.slice(0, 8)}
                        </span>
                        <span className={cn(
                          'px-2 py-0.5 text-xs font-medium rounded',
                          TicketStatusColors[selectedTicket.status]?.bg,
                          TicketStatusColors[selectedTicket.status]?.text
                        )}>
                          {TicketStatusLabels[selectedTicket.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                        <span>👨‍🔧 Tech: {selectedTicket.assignedTechId || 'Unassigned'}</span>
                        <span>💼 Sale: {selectedTicket.assignedSaleId || 'N/A'}</span>
                        <span>⏱️ SLA: {selectedTicket.slaHours}h</span>
                      </div>
                    </div>

                    {/* Right column: action buttons */}
                    <div className="flex flex-col items-end gap-3">
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {/* Approve/Reject for pending approval */}
                        {selectedTicket.status === TicketStatus.TICKET_STATUS_PENDING_APPROVAL && (
                          <>
                            <button
                              onClick={() => handleApprove(selectedTicket.id)}
                              disabled={actionLoading === 'approve'}
                              className="px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 flex items-center gap-1"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(selectedTicket.id)}
                              disabled={actionLoading === 'reject'}
                              className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 flex items-center gap-1"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </button>
                          </>
                        )}
                        
                        {/* Assign button */}
                        <button
                          onClick={() => setShowAssignModal(true)}
                          className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 flex items-center gap-1"
                        >
                          <UserPlus className="w-4 h-4" />
                          Assign
                        </button>
                        
                        {/* Quotation button */}
                        {[TicketStatus.TICKET_STATUS_OPEN, TicketStatus.TICKET_STATUS_QUOTING].includes(selectedTicket.status) && (
                          <button
                            onClick={() => setShowQuotationModal(true)}
                            className="px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 flex items-center gap-1"
                          >
                            <DollarSign className="w-4 h-4" />
                            Quotation
                          </button>
                        )}
                        
                        <button 
                          onClick={() => setShowIntervention(!showIntervention)}
                          className="px-3 py-1.5 text-sm font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 flex items-center gap-1"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          Intervention
                        </button>
                        <button 
                          onClick={() => setIsModalOpen(true)}
                          className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 flex items-center gap-1"
                        >
                          <FileText className="w-4 h-4" />
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Status Update */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-gray-500">Update Status:</span>
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => handleUpdateStatus(selectedTicket.id, Number(e.target.value))}
                        disabled={actionLoading === 'status'}
                        className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {Object.entries(TicketStatusLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      {actionLoading === 'status' && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                    </div>
                  </div>
                </div>

                {/* Admin Intervention Alert */}
                {showIntervention && (
                  <div className="p-4 bg-red-50 border-b border-red-200">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <AlertTriangle className="w-3 h-3 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-sm font-bold text-red-900">Admin Intervention Required</h3>
                            <p className="text-xs text-red-700 mt-0.5">Select an action to resolve the conflict or delay.</p>
                          </div>
                          <button
                            onClick={() => setShowIntervention(false)}
                            className="text-red-500 hover:text-red-700 flex-shrink-0"
                          >
                            <span className="text-lg font-bold">✕</span>
                          </button>
                        </div>
                        <div className="flex gap-3 mt-3 flex-wrap">
                          <button 
                            onClick={() => setShowAssignModal(true)}
                            className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 flex items-center gap-2"
                          >
                            <span>🔄</span>
                            Re-assign Technician
                          </button>
                          <button className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 flex items-center gap-2">
                            <span>⚠️</span>
                            Issue Warning
                          </button>
                          <button className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-lg hover:bg-red-700 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Takeover Support
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tabs */}
                <div className="border-b border-gray-100">
                  <div className="flex gap-6 px-4">
                    <button
                      onClick={() => setActiveTab('chat')}
                      className={cn(
                        'py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
                        activeTab === 'chat'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      )}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Monitor Chat
                    </button>
                    <button
                      onClick={() => setActiveTab('timeline')}
                      className={cn(
                        'py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
                        activeTab === 'timeline'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      )}
                    >
                      <Clock className="w-4 h-4" />
                      Timeline
                    </button>
                    <button
                      onClick={() => setActiveTab('audit')}
                      className={cn(
                        'py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
                        activeTab === 'audit'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      )}
                    >
                      <FileText className="w-4 h-4" />
                      Audit
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  {activeTab === 'chat' && (
                    <>
                      {/* Auditor Mode Warning */}
                      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                        <Lock className="w-5 h-5 text-yellow-600" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">Auditor Mode (Read-only)</p>
                          <p className="text-xs text-yellow-600">E2E session. Access logged in audit_logs.</p>
                        </div>
                      </div>

                      {/* Chat Messages */}
                      <div className="relative h-[420px]">
                        <div
                          ref={chatScrollRef}
                          onScroll={handleChatScroll}
                          style={{ willChange: 'scroll-position' }}
                          className="absolute inset-0 overflow-y-auto p-4 flex flex-col gap-4"
                        >
                        {chatLoading ? (
                          <div className="space-y-3 py-2">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="flex justify-start">
                                <div className="max-w-xs pr-12">
                                  <div className="h-3 w-20 bg-gray-200 animate-pulse rounded mb-2" />
                                  <div className="h-10 w-48 bg-gray-200 animate-pulse rounded-lg" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : !chatRoomId ? (
                          <p className="text-sm text-gray-500 py-4 text-center">Ticket này chưa có chat room.</p>
                        ) : processedMessages.length === 0 ? (
                          <p className="text-sm text-gray-500 py-4 text-center">Chưa có tin nhắn trong room này.</p>
                        ) : (
                          <>
                            <div className="flex justify-center py-2">
                              {loadingMoreChat ? (
                                <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Đang tải...
                                </span>
                              ) : chatNextPageToken ? (
                                <button
                                  onClick={() => void handleLoadMoreChat()}
                                  className="text-xs text-blue-600 hover:text-blue-700 font-medium px-3 py-1 rounded-full border border-blue-200 hover:bg-blue-50 transition-colors"
                                >
                                  Tải thêm tin nhắn cũ hơn
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400">Đã hiển thị toàn bộ hội thoại</span>
                              )}
                            </div>
                            {processedMessages.map(({ msg, attachmentUrl, attachmentFileName, attachmentFileId, attachmentSize }) => (
                              <AdminChatMessageItem
                                key={msg.id}
                                msg={msg}
                                attachmentUrl={attachmentUrl}
                                attachmentFileName={attachmentFileName}
                                attachmentFileId={attachmentFileId}
                                attachmentSize={attachmentSize}
                              />
                            ))}
                          </>
                        )}
                        </div>{/* end scroll container */}
                      </div>{/* end relative wrapper */}
                    </>
                  )}

                  {activeTab === 'timeline' && (
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          </div>
                          <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-gray-900">TICKET CREATED</h4>
                              <span className="text-xs text-gray-500">{formatDate(selectedTicket.createdAt)}</span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">Ticket created</p>
                            <p className="text-xs text-gray-500">Creator ID: {selectedTicket.creatorId}</p>
                          </div>
                        </div>
                      </div>

                      {selectedTicket.updatedAt && selectedTicket.updatedAt !== selectedTicket.createdAt && (
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold text-gray-900">LAST UPDATED</h4>
                                <span className="text-xs text-gray-500">{formatDate(selectedTicket.updatedAt)}</span>
                              </div>
                              <p className="text-sm text-gray-700">Status: {TicketStatusLabels[selectedTicket.status]}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'audit' && (
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(selectedTicket.createdAt)}</span>
                        <span className="px-2 py-1 bg-green-50 text-green-600 text-xs font-mono rounded whitespace-nowrap">
                          TICKET_CREATED
                        </span>
                        <p className="text-sm text-gray-700 flex-1 text-right">Ticket created by user</p>
                      </div>
                      
                      {selectedTicket.assignedTechId && (
                        <div className="flex items-start gap-4">
                          <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(selectedTicket.updatedAt)}</span>
                          <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-mono rounded whitespace-nowrap">
                            TECH_ASSIGNED
                          </span>
                          <p className="text-sm text-gray-700 flex-1 text-right">Technician assigned: {selectedTicket.assignedTechId}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[600px] text-gray-500">
                <p>Select a ticket to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Details Modal */}
      {isModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-md font-semibold text-gray-900">
                  Ticket Details
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 hover:bg-gray-200 p-1 rounded-full"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">TICKET ID</h4>
                <p className="text-sm font-mono text-gray-700">{selectedTicket.id}</p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">TITLE</h4>
                <p className="text-lg font-semibold text-gray-900">{selectedTicket.title}</p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">DESCRIPTION</h4>
                <p className="text-sm text-gray-700">{selectedTicket.description || 'No description provided'}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">STATUS</h4>
                  <span className={cn(
                    'px-2 py-1 text-sm font-medium rounded',
                    TicketStatusColors[selectedTicket.status]?.bg,
                    TicketStatusColors[selectedTicket.status]?.text
                  )}>
                    {TicketStatusLabels[selectedTicket.status]}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">PRIORITY</h4>
                  <span className={cn('px-2 py-1 text-sm font-medium rounded', getPriorityConfig(selectedTicket.priority).color)}>
                    {getPriorityConfig(selectedTicket.priority).label}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">ASSIGNED TECH</h4>
                  <p className="text-sm text-gray-700">{selectedTicket.assignedTechId || 'Unassigned'}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">ASSIGNED SALE</h4>
                  <p className="text-sm text-gray-700">{selectedTicket.assignedSaleId || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">CREATED</h4>
                  <p className="text-sm text-gray-700">{formatDate(selectedTicket.createdAt)}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">UPDATED</h4>
                  <p className="text-sm text-gray-700">{formatDate(selectedTicket.updatedAt)}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">SLA HOURS</h4>
                <p className="text-sm text-gray-700">{selectedTicket.slaHours} hours</p>
              </div>

              {selectedTicket.attributes && selectedTicket.attributes !== '{}' && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">ATTRIBUTES</h4>
                  <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-auto max-h-32">
                    {JSON.stringify(JSON.parse(selectedTicket.attributes), null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Quotation Modal */}
      {selectedTicket && (
        <SubmitQuotationModal
          isOpen={showQuotationModal}
          onClose={() => setShowQuotationModal(false)}
          onSuccess={fetchTickets}
          ticketId={selectedTicket.id}
          ticketTitle={selectedTicket.title}
        />
      )}

      {/* Assign Ticket Modal */}
      {selectedTicket && (
        <AssignTicketModal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          onSuccess={fetchTickets}
          ticketId={selectedTicket.id}
          ticketTitle={selectedTicket.title}
          currentTechId={selectedTicket.assignedTechId}
          currentSaleId={selectedTicket.assignedSaleId}
        />
      )}
    </div>
  );
}
