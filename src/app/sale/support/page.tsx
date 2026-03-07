'use client';

import { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo, memo, type ChangeEvent, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, Plus, MoreVertical, Paperclip, Send, ChevronDown, Volume2, VolumeX,
  Clock, CheckCircle2 
} from 'lucide-react';
import CreateTicketModal from '@/components/CreateTicketModal';
import { useToast } from '@/components/ui';

type ServiceCategory = { id: string; name: string; attributesSchema?: string };
type ServiceOption = { id: string; name: string; categoryId?: string };
type AssetOption = { id: string; orgId: string; name: string; serialNumber?: string; model?: string; status?: string };
type SlaPreview = {
  ticketId: string;
  appliedSource: 'tenant-config' | 'system-default';
  businessHours: string;
  targetResponseMinutes: number;
  targetResolutionMinutes: number;
  breachRisk: 'low' | 'medium' | 'high';
};
type PricingPreview = {
  ticketId: string;
  baseAmount: number;
  totalMultiplier: number;
  estimatedAmount: number;
  breakdown: Array<{ code: string; label: string; k: number; note: string }>;
};

const TICKET_STATUS_VALUE: Record<Ticket['status'], number> = {
  DRAFT: 1,
  AGREED: 5,
  OPEN: 3,
  IN_PROGRESS: 7,
  RESOLVED: 9,
  CLOSED: 10,
};

const STATUS_FROM_NUMBER: Record<number, Ticket['status']> = {
  1: 'DRAFT',
  5: 'AGREED',
  3: 'OPEN',
  7: 'IN_PROGRESS',
  9: 'RESOLVED',
  10: 'CLOSED',
};

const CHAT_LOAD_MORE_TOP_THRESHOLD = 80;

interface Ticket {
  id: string;
  code: string;
  orgId?: string;
  creatorId?: string;
  assignedTechId?: string;
  assignedSaleId?: string;
  categoryId?: string;
  serviceId?: string;
  title: string;
  client: string;
  status: 'DRAFT' | 'AGREED' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'High' | 'Medium' | 'Low' | 'Urgent' | 'Critical';
  attributes?: string;
  slaHours?: number;
  assetId?: string;
  createdAt?: string;
  targetResponseAt?: string;
  targetResolutionAt?: string;
  date: string;
  dueTime?: string;
  slaStatus?: 'Met' | 'Breached' | 'Warning';
  assignee?: string;
}

interface ChatUiMessage {
  id: string;
  senderId: string;
  senderLabel: string;
  role: 'Client' | 'Sale' | 'Tech' | 'System';
  content: string;
  metadata?: string;
  messageType: number;
  createdAt?: string;
  time: string;
  isMe?: boolean;
}

type ChatAttachmentMeta = {
  fileId?: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  url?: string;
  dataUrl?: string;
};

/* ── helpers moved outside component to avoid re-creation ── */

function parseAttachmentMetaStatic(metadata?: string): ChatAttachmentMeta | null {
  const raw = String(metadata ?? '').trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      fileId: parsed.fileId == null ? (parsed.file_id == null ? undefined : String(parsed.file_id)) : String(parsed.fileId),
      fileName: parsed.file_name == null ? (parsed.fileName == null ? undefined : String(parsed.fileName)) : String(parsed.file_name),
      mimeType: parsed.mime_type == null ? (parsed.mimeType == null ? undefined : String(parsed.mimeType)) : String(parsed.mime_type),
      size: parsed.file_size == null ? (parsed.size == null ? undefined : Number(parsed.size)) : Number(parsed.file_size),
      url:
        parsed.url == null
          ? (parsed.downloadUrl == null
            ? (parsed.download_url == null ? undefined : String(parsed.download_url))
            : String(parsed.downloadUrl))
          : String(parsed.url),
      dataUrl: parsed.dataUrl == null ? undefined : String(parsed.dataUrl),
    };
  } catch {
    return null;
  }
}

function extractFileIdFromS3UrlStatic(url: string): string {
  try {
    const { pathname } = new URL(url);
    const segments = pathname.split('/');
    return segments[segments.length - 1] ?? '';
  } catch {
    return '';
  }
}

function formatBytesStatic(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileExtensionStatic(fileName: string): string {
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
  rar: { icon: 'RAR', bg: 'bg-yellow-100', color: 'text-yellow-700' },
  '7z': { icon: '7Z', bg: 'bg-yellow-100', color: 'text-yellow-700' },
  tar: { icon: 'TAR', bg: 'bg-yellow-100', color: 'text-yellow-700' },
  gz: { icon: 'GZ', bg: 'bg-yellow-100', color: 'text-yellow-700' },
  mp3: { icon: 'MP3', bg: 'bg-pink-100', color: 'text-pink-600' },
  wav: { icon: 'WAV', bg: 'bg-pink-100', color: 'text-pink-600' },
  mp4: { icon: 'MP4', bg: 'bg-purple-100', color: 'text-purple-600' },
  avi: { icon: 'AVI', bg: 'bg-purple-100', color: 'text-purple-600' },
  mkv: { icon: 'MKV', bg: 'bg-purple-100', color: 'text-purple-600' },
  txt: { icon: 'TXT', bg: 'bg-gray-100', color: 'text-gray-600' },
  json: { icon: 'JSON', bg: 'bg-gray-100', color: 'text-gray-600' },
  xml: { icon: 'XML', bg: 'bg-gray-100', color: 'text-gray-600' },
  html: { icon: 'HTML', bg: 'bg-orange-100', color: 'text-orange-600' },
  js: { icon: 'JS', bg: 'bg-yellow-100', color: 'text-yellow-700' },
  ts: { icon: 'TS', bg: 'bg-blue-100', color: 'text-blue-600' },
  py: { icon: 'PY', bg: 'bg-blue-100', color: 'text-blue-600' },
  exe: { icon: 'EXE', bg: 'bg-red-100', color: 'text-red-500' },
  iso: { icon: 'ISO', bg: 'bg-indigo-100', color: 'text-indigo-600' },
  svg: { icon: 'SVG', bg: 'bg-teal-100', color: 'text-teal-600' },
};
const DEFAULT_FILE_ICON = { icon: 'FILE', bg: 'bg-gray-100', color: 'text-gray-500' };

function getFileIconStatic(ext: string) {
  return FILE_ICON_MAP[ext] ?? DEFAULT_FILE_ICON;
}

/* ── Memoized chat message row ── */

interface ChatMessageItemProps {
  msg: ChatUiMessage;
  attachmentUrl: string;
  attachmentFileName: string;
  attachmentFileId: string;
  attachmentSize?: number;
}

const ChatMessageItem = memo(function ChatMessageItem({ msg, attachmentUrl, attachmentFileName, attachmentFileId, attachmentSize }: ChatMessageItemProps) {
  return (
    <div className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[80%]">
        <div className={`flex items-baseline gap-2 mb-1 ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-xs font-bold ${
            msg.role === 'Client' ? 'text-gray-900' :
            msg.role === 'Sale' ? 'text-blue-600' :
            msg.role === 'Tech' ? 'text-purple-600' :
            'text-gray-500'
          }`}>
            {msg.senderLabel}
            <span className="text-gray-400 font-normal ml-1">({msg.role})</span>
          </span>
          <span className="text-xs text-gray-400">{msg.time}</span>
        </div>
        {msg.messageType === 2 && attachmentUrl ? (
          <div className="space-y-1">
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
          <div className="space-y-1">
            <div className="h-40 w-60 rounded-xl animate-pulse bg-gray-200" />
            <p className="text-xs text-gray-400">Đang tải ảnh...</p>
          </div>
        ) : msg.messageType === 3 && attachmentUrl ? (
          <a
            href={attachmentUrl}
            download={attachmentFileName}
            className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors max-w-xs"
          >
            {(() => {
              const ext = getFileExtensionStatic(attachmentFileName);
              const fi = getFileIconStatic(ext);
              return (
                <div className={`flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center ${fi.bg}`}>
                  <span className={`text-xs font-bold ${fi.color}`}>{fi.icon}</span>
                </div>
              );
            })()}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{attachmentFileName}</p>
              <p className="text-xs text-gray-400 mt-0.5">{formatBytesStatic(attachmentSize)}</p>
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
          <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
            msg.isMe
              ? 'bg-blue-600 text-white rounded-tr-none'
              : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
          }`}>
            {msg.content}
          </div>
        )}
      </div>
    </div>
  );
});

export default function SupportTrackingPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const router = useRouter();
  const { addToast } = useToast();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | Ticket['status']>('ALL');
  const [ticketNextPageToken, setTicketNextPageToken] = useState('');
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [loadingMoreTickets, setLoadingMoreTickets] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [chatRoomId, setChatRoomId] = useState('');
  const [chatRoomOrgId, setChatRoomOrgId] = useState('');
  const [chatRoomType, setChatRoomType] = useState<number | null>(null);
  const [chatRoomTicketId, setChatRoomTicketId] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatUiMessage[]>([]);
  const [chatNextPageToken, setChatNextPageToken] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [loadingMoreChat, setLoadingMoreChat] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [attachmentUrlByFileId, setAttachmentUrlByFileId] = useState<Record<string, string>>({});
  const [urlRefreshTick, setUrlRefreshTick] = useState(0);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [unreadNewCount, setUnreadNewCount] = useState(0);
  const [enableNewMessageSound, setEnableNewMessageSound] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const previousChatLengthRef = useRef(0);
  const skipAutoScrollRef = useRef(false);
  const initialScrollDoneRef = useRef(false);
  const needsInitialScrollRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const resolvingFileIdsRef = useRef<Set<string>>(new Set());
  const attachmentUrlByFileIdRef = useRef(attachmentUrlByFileId);
  attachmentUrlByFileIdRef.current = attachmentUrlByFileId;
  const chatEventSourceRef = useRef<EventSource | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loadingDiscovery, setLoadingDiscovery] = useState(false);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [, setServices] = useState<ServiceOption[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [flowMessage, setFlowMessage] = useState('');
  const [, setAssets] = useState<AssetOption[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [slaPreview, setSlaPreview] = useState<SlaPreview | null>(null);
  const [pricingPreview, setPricingPreview] = useState<PricingPreview | null>(null);
  const [loadingSlaPreview, setLoadingSlaPreview] = useState(false);
  const [loadingPricingPreview, setLoadingPricingPreview] = useState(false);
  const [contextOwnerId, setContextOwnerId] = useState('');
  const [contextClientName, setContextClientName] = useState('');
  const [contextClientEmail, setContextClientEmail] = useState('');
  const [contextClientPhone, setContextClientPhone] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');

  const statusOptions: Ticket['status'][] = ['DRAFT', 'AGREED', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

  const toPriorityLabel = (value: unknown): Ticket['priority'] => {
    const normalized = String(value ?? '').trim().toLowerCase();
    if (normalized.includes('critical') || normalized === '5') return 'Critical';
    if (normalized.includes('urgent') || normalized === '4') return 'Urgent';
    if (normalized.includes('high') || normalized === '3') return 'High';
    if (normalized.includes('low') || normalized === '1') return 'Low';
    return 'Medium';
  };

  const toTicketStatus = (value: unknown): Ticket['status'] => {
    if (typeof value === 'number') {
      return STATUS_FROM_NUMBER[value] ?? 'DRAFT';
    }
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) {
      return STATUS_FROM_NUMBER[numeric] ?? 'DRAFT';
    }
    const normalized = String(value ?? '').trim().toUpperCase();
    if (normalized === 'AGREED' || normalized === 'OPEN' || normalized === 'IN_PROGRESS' || normalized === 'RESOLVED' || normalized === 'CLOSED') {
      return normalized;
    }
    return 'DRAFT';
  };

  const parseClientFromAttributes = (attributes?: string): string | undefined => {
    if (!attributes) return undefined;
    try {
      const parsed = JSON.parse(attributes) as Record<string, unknown>;
      const clientName = parsed.client_name ?? parsed.clientName ?? parsed.client;
      const value = String(clientName ?? '').trim();
      return value || undefined;
    } catch {
      return undefined;
    }
  };

  const formatChatTime = (createdAt?: string): string => {
    const raw = String(createdAt ?? '').trim();
    if (!raw) return '--:--';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '--:--';
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const extractFileIdFromS3Url = extractFileIdFromS3UrlStatic;

  // Returns true if a presigned S3 URL has expired (or will expire within bufferMs)
  const isPresignedUrlExpired = (url: string, bufferMs = 30_000): boolean => {
    try {
      const params = new URL(url).searchParams;
      const dateStr = params.get('X-Amz-Date');
      const expiresStr = params.get('X-Amz-Expires');
      if (!dateStr || !expiresStr) return false;
      // X-Amz-Date format: 20260307T044348Z
      const signedAt = Date.UTC(
        parseInt(dateStr.slice(0, 4)),
        parseInt(dateStr.slice(4, 6)) - 1,
        parseInt(dateStr.slice(6, 8)),
        parseInt(dateStr.slice(9, 11)),
        parseInt(dateStr.slice(11, 13)),
        parseInt(dateStr.slice(13, 15)),
      );
      const expiresAt = signedAt + parseInt(expiresStr) * 1000;
      return Date.now() + bufferMs >= expiresAt;
    } catch {
      return false;
    }
  };

  const parseAttachmentMeta = parseAttachmentMetaStatic;

  const mergeChatMessages = useCallback((current: ChatUiMessage[], incoming: ChatUiMessage[]): ChatUiMessage[] => {
    const merged = new Map<string, ChatUiMessage>();
    current.forEach((item) => merged.set(item.id, item));
    incoming.forEach((item) => {
      if (!merged.has(item.id)) {
        merged.set(item.id, item);
      }
    });
    return Array.from(merged.values());
  }, []);

  const formatBytes = formatBytesStatic;

  const isNearChatBottom = (): boolean => {
    const container = chatScrollRef.current;
    if (!container) return true;
    return container.scrollHeight - container.clientHeight - container.scrollTop <= 80;
  };

  const evaluateScrollToBottomVisibility = () => {
    const container = chatScrollRef.current;
    if (!container) return;
    const distanceToBottom = container.scrollHeight - container.clientHeight - container.scrollTop;
    const shouldShow = distanceToBottom > 80;
    setShowScrollToBottom((prev) => (prev === shouldShow ? prev : shouldShow));
    if (!shouldShow) {
      setUnreadNewCount((prev) => (prev === 0 ? prev : 0));
    }
  };

  const playNewMessageSound = useCallback(() => {
    if (!enableNewMessageSound) return;
    try {
      const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;

      const audioContext = audioContextRef.current ?? new Ctx();
      audioContextRef.current = audioContext;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = 920;
      gainNode.gain.value = 0.08;

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.12);
    } catch {
    }
  }, [enableNewMessageSound]);

  useEffect(() => {
    let cancelled = false;

    const loadCurrentUserId = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        const json = await response.json().catch(() => ({}));
        if (!response.ok || cancelled) return;
        const userId = String(json?.user_id ?? '').trim();
        if (userId) setCurrentUserId(userId);
      } catch {
      }
    };

    void loadCurrentUserId();

    return () => {
      cancelled = true;
    };
  }, []);

  const mapChatMessageToUi = useCallback((raw: Record<string, unknown>): ChatUiMessage => {
    const senderId = String(raw.senderId ?? raw.sender_id ?? '').trim();
    const normalizedSenderId = senderId.toLowerCase();
    const normalizedCurrentUserId = currentUserId.trim().toLowerCase();
    const messageType = Number(raw.messageType ?? raw.message_type ?? 0);
    const resolveRole = (): ChatUiMessage['role'] => {
      if (messageType === 4) return 'System';
      if (!senderId) return 'Sale';

      const isTicketRoom = chatRoomType === 2;
      const ticketIdMatchesRoom = !chatRoomTicketId || chatRoomTicketId === selectedTicket?.id;

      if (isTicketRoom && ticketIdMatchesRoom && senderId === chatRoomOrgId) return 'Client';
      if (senderId === contextOwnerId || senderId === selectedTicket?.orgId) return 'Client';
      if (senderId === selectedTicket?.assignedTechId) return 'Tech';
      if (senderId === selectedTicket?.assignedSaleId || senderId === selectedTicket?.creatorId) return 'Sale';
      return 'Sale';
    };

    const role = resolveRole();
    const senderNameFromApi = String(raw.senderName ?? raw.sender_name ?? '').trim();
    const suffix = senderId ? senderId.slice(-6) : '------';
    const senderLabel = senderNameFromApi
      ? senderNameFromApi
      : role === 'System'
        ? 'System'
        : role === 'Client'
          ? `Client ${suffix}`
          : role === 'Tech'
            ? `Tech ${suffix}`
            : `Sale ${suffix}`;

    return {
      id: String(raw.id ?? `${Date.now()}`),
      senderId,
      senderLabel,
      role,
      content: String(raw.content ?? ''),
      metadata: raw.metadata == null ? undefined : String(raw.metadata),
      messageType,
      createdAt: String(raw.createdAt ?? raw.created_at ?? '').trim() || undefined,
      time: formatChatTime(String(raw.createdAt ?? raw.created_at ?? '')),
      isMe: Boolean(normalizedSenderId && normalizedCurrentUserId && normalizedSenderId === normalizedCurrentUserId),
    };
  }, [chatRoomType, chatRoomTicketId, selectedTicket, chatRoomOrgId, contextOwnerId, currentUserId]);

  const formatSlaTargetTime = (raw: { targetResolutionAt?: string; createdAt?: string; slaHours?: number }): string => {
    const resolutionRaw = String(raw.targetResolutionAt ?? '').trim();
    if (resolutionRaw) {
      const resolution = new Date(resolutionRaw);
      if (!Number.isNaN(resolution.getTime())) {
        return resolution.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
      }
    }

    const createdRaw = String(raw.createdAt ?? '').trim();
    const hours = Number(raw.slaHours ?? 0);
    if (createdRaw && Number.isFinite(hours) && hours > 0) {
      const created = new Date(createdRaw);
      if (!Number.isNaN(created.getTime())) {
        const fallback = new Date(created.getTime() + hours * 60 * 60 * 1000);
        return fallback.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
      }
    }

    return 'N/A';
  };

  const mapApiTicketToUi = (raw: Record<string, unknown>, fallbackClient?: string): Ticket => {
    const id = String(raw.id ?? '');
    const title = String(raw.title ?? 'Untitled Ticket');
    const attributes = raw.attributes == null ? undefined : String(raw.attributes);
    const parsedClient = parseClientFromAttributes(attributes);
    const createdAtRaw = String(raw.createdAt ?? raw.created_at ?? '').trim();
    const targetResponseAtRaw = String(raw.targetResponseAt ?? raw.target_response_at ?? '').trim();
    const targetResolutionAtRaw = String(raw.targetResolutionAt ?? raw.target_resolution_at ?? '').trim();
    const slaHours = raw.slaHours == null ? undefined : Number(raw.slaHours);
    const createdDate = createdAtRaw ? new Date(createdAtRaw) : new Date();
    const date = Number.isNaN(createdDate.getTime()) ? new Date().toISOString().split('T')[0] : createdDate.toISOString().split('T')[0];
    const dueTime = formatSlaTargetTime({
      targetResolutionAt: targetResolutionAtRaw || undefined,
      createdAt: createdAtRaw || undefined,
      slaHours,
    });

    return {
      id,
      code: id ? `TICK-${id.slice(-6).toUpperCase()}` : `TICK-${Math.floor(10000 + Math.random() * 90000)}`,
      orgId: raw.orgId == null ? undefined : String(raw.orgId),
      creatorId: raw.creatorId == null ? undefined : String(raw.creatorId),
      assignedTechId: raw.assignedTechId == null ? undefined : String(raw.assignedTechId),
      assignedSaleId: raw.assignedSaleId == null ? undefined : String(raw.assignedSaleId),
      categoryId: raw.categoryId == null ? undefined : String(raw.categoryId),
      serviceId: raw.serviceId == null ? undefined : String(raw.serviceId),
      title,
      client: parsedClient || fallbackClient || 'Khách hàng',
      status: toTicketStatus(raw.status),
      priority: toPriorityLabel(raw.priority),
      attributes,
      slaHours,
      assetId: raw.assetId == null ? undefined : String(raw.assetId),
      createdAt: createdAtRaw || undefined,
      targetResponseAt: targetResponseAtRaw || undefined,
      targetResolutionAt: targetResolutionAtRaw || undefined,
      date,
      dueTime,
    };
  };

  const getTicketCategoryId = (ticket: Ticket): string => {
    const direct = String(ticket.categoryId ?? '').trim();
    if (direct) return direct;
    if (!ticket.attributes) return '';
    try {
      const parsed = JSON.parse(ticket.attributes) as Record<string, unknown>;
      return String(parsed.category_id ?? parsed.categoryId ?? '').trim();
    } catch {
      return '';
    }
  };

  const getTicketServiceId = (ticket: Ticket): string => {
    const direct = String(ticket.serviceId ?? '').trim();
    if (direct) return direct;
    if (!ticket.attributes) return '';
    try {
      const parsed = JSON.parse(ticket.attributes) as Record<string, unknown>;
      return String(parsed.service_id ?? parsed.serviceId ?? '').trim();
    } catch {
      return '';
    }
  };

  const effectiveSelectedCategoryId = selectedTicket ? getTicketCategoryId(selectedTicket) || selectedCategoryId : selectedCategoryId;
  const selectedCategory = categories.find((category) => category.id === effectiveSelectedCategoryId);

  const loadTicketsPage = async (opts?: { pageToken?: string; append?: boolean; orgId?: string; status?: 'ALL' | Ticket['status'] }) => {
    const pageToken = opts?.pageToken ?? '';
    const append = Boolean(opts?.append);
    const orgId = String(opts?.orgId ?? contextOwnerId ?? '').trim();
    const status = opts?.status ?? statusFilter;

    if (append) {
      setLoadingMoreTickets(true);
    } else {
      setLoadingTickets(true);
    }

    try {
      const params = new URLSearchParams({
        page_size: '20',
        page_token: pageToken,
      });
      if (orgId) {
        params.set('org_id', orgId);
      }
      if (status !== 'ALL') {
        params.set('status', status);
      }

      const response = await fetch(`/api/sale/tickets?${params.toString()}`);
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        setFlowMessage(json?.error || 'Không tải được danh sách tickets.');
        return;
      }

      const listRaw = Array.isArray(json?.tickets) ? (json.tickets as Record<string, unknown>[]) : [];
      const incoming = listRaw.map((item) => mapApiTicketToUi(item, contextClientName || undefined));
      setTicketNextPageToken(String(json?.next_page_token ?? json?.nextPageToken ?? ''));

      setTickets((prev) => {
        if (!append) {
          return incoming;
        }
        const map = new Map<string, Ticket>();
        prev.forEach((ticket) => map.set(ticket.id, ticket));
        incoming.forEach((ticket) => map.set(ticket.id, ticket));
        return Array.from(map.values());
      });

      setSelectedTicket((prev) => {
        if (prev) {
          const matchedIncoming = incoming.find((item) => item.id === prev.id);
          if (matchedIncoming) {
            return matchedIncoming;
          }
          const stillExistsInCurrentList = append && tickets.some((item) => item.id === prev.id);
          if (stillExistsInCurrentList) return prev;
        }
        return incoming[0] ?? prev;
      });
    } catch {
      setFlowMessage('Lỗi kết nối khi tải danh sách tickets.');
    } finally {
      if (append) {
        setLoadingMoreTickets(false);
      } else {
        setLoadingTickets(false);
      }
    }
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ownerId = String(params.get('owner_id') ?? '').trim();
    const clientName = String(params.get('client_name') ?? '').trim();
    const clientEmail = String(params.get('client_email') ?? '').trim();
    const clientPhone = String(params.get('client_phone') ?? '').trim();
    const ticketId = String(params.get('ticket_id') ?? '').trim();

    if (!ownerId && !clientName && !clientEmail && !clientPhone && !ticketId) return;

    setContextOwnerId(ownerId);
    setContextClientName(clientName);
    setContextClientEmail(clientEmail);
    setContextClientPhone(clientPhone);
    if (clientName) {
      setSearch(clientName);
    }
    const syncCategoryServiceFromTicket = (ticket: Ticket) => {
      const directCategoryId = String(ticket.categoryId ?? '').trim();
      const directServiceId = String(ticket.serviceId ?? '').trim();
      if (directCategoryId) {
        setSelectedCategoryId(directCategoryId);
      }
      if (directServiceId) {
        setSelectedServiceId(directServiceId);
      }

      if (!ticket.attributes) return;
      try {
        const parsed = JSON.parse(ticket.attributes) as Record<string, unknown>;
        const categoryFromAttributes = String(parsed.category_id ?? parsed.categoryId ?? '').trim();
        const serviceFromAttributes = String(parsed.service_id ?? parsed.serviceId ?? '').trim();
        if (!directCategoryId && categoryFromAttributes) {
          setSelectedCategoryId(categoryFromAttributes);
        }
        if (!directServiceId && serviceFromAttributes) {
          setSelectedServiceId(serviceFromAttributes);
        }
      } catch {
      }
    };

    const hydrateFromTicketId = async () => {
      if (!ticketId) return;

      const existing = tickets.find((ticket) => ticket.id === ticketId);
      if (existing) {
        setSelectedTicket(existing);
        syncCategoryServiceFromTicket(existing);
        return;
      }

      try {
        const qs = new URLSearchParams({ ticket_id: ticketId });
        if (ownerId) qs.set('org_id', ownerId);

        const response = await fetch(`/api/sale/tickets?${qs.toString()}`);
        const json = await response.json().catch(() => ({}));

        if (response.ok && json?.ticket) {
          const raw = json.ticket as {
            id?: string;
            orgId?: string;
            categoryId?: string;
            serviceId?: string;
            title?: string;
            status?: number;
            priority?: string;
            attributes?: string;
            slaHours?: number;
            assetId?: string;
            createdAt?: string;
            targetResponseAt?: string;
            targetResolutionAt?: string;
          };

          const hydratedTicket = mapApiTicketToUi(raw as unknown as Record<string, unknown>, clientName || undefined);

          setTickets((prev) => [hydratedTicket, ...prev.filter((ticket) => ticket.id !== hydratedTicket.id)]);
          setSelectedTicket(hydratedTicket);
          syncCategoryServiceFromTicket(hydratedTicket);
          return;
        }
      } catch {
      }

      const projectedTicket: Ticket = {
        id: ticketId,
        code: `TICK-${ticketId.slice(-6).toUpperCase()}`,
        orgId: ownerId || undefined,
        title: 'UC-2 Ticket (from CRM)',
        client: clientName || 'Khách từ CRM',
        status: 'DRAFT',
        priority: 'Medium',
        attributes: JSON.stringify({
          source: 'sale_customers_uc2',
          owner_id: ownerId || undefined,
          client_name: clientName || undefined,
          client_email: clientEmail || undefined,
          client_phone: clientPhone || undefined,
        }),
        date: new Date().toISOString().split('T')[0],
        dueTime: 'N/A',
      };

      setTickets((prev) => [projectedTicket, ...prev.filter((ticket) => ticket.id !== ticketId)]);
      setSelectedTicket(projectedTicket);
      syncCategoryServiceFromTicket(projectedTicket);
    };

    void loadTicketsPage({ pageToken: '', append: false, orgId: ownerId, status: statusFilter });
    void hydrateFromTicketId();

    setFlowMessage(
      ticketId
        ? `Đã nhận context khách + ticket_id (${ticketId}) từ CRM. Đang focus ticket vừa tạo cho UC-2.`
        : 'Đã nhận context khách từ CRM. UC-2 sẽ ưu tiên owner_id này cho ListAssets/Preview*.'
    );
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (tickets.length === 0 && !loadingTickets) {
      void loadTicketsPage({ pageToken: '', append: false, orgId: contextOwnerId || undefined, status: statusFilter });
    }
  }, [contextOwnerId]);
  /* eslint-enable react-hooks/exhaustive-deps */

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    setTicketNextPageToken('');
    void loadTicketsPage({ pageToken: '', append: false, orgId: contextOwnerId || undefined, status: statusFilter });
  }, [statusFilter]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const handleLoadMoreTickets = async () => {
    if (!ticketNextPageToken || loadingMoreTickets) return;
    await loadTicketsPage({ pageToken: ticketNextPageToken, append: true, orgId: contextOwnerId || undefined, status: statusFilter });
  };

  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setFlowMessage('');
    setSlaPreview(null);
    setPricingPreview(null);
    setCategories([]);
    setServices([]);
    setAssets([]);
    setSelectedAssetId('');
    setChatRoomId('');
    setChatRoomOrgId('');
    setChatRoomType(null);
    setChatRoomTicketId('');
    setChatMessages([]);
    setAttachmentUrlByFileId({});
    resolvingFileIdsRef.current.clear();
    setChatNextPageToken('');
    setMessageInput('');
  };

  const loadChatForTicket = useCallback(async (ticketId: string) => {
    if (!ticketId) return;
    setLoadingChat(true);
    try {
      const roomRes = await fetch(`/api/sale/chat/ticket-room?ticket_id=${encodeURIComponent(ticketId)}`);
      const roomJson = await roomRes.json().catch(() => ({}));
      if (!roomRes.ok || !roomJson?.room?.id) {
        setChatRoomId('');
        setChatRoomOrgId('');
        setChatRoomType(null);
        setChatRoomTicketId('');
        setChatMessages([]);
        setAttachmentUrlByFileId({});
        resolvingFileIdsRef.current.clear();
        setChatNextPageToken('');
        return;
      }

      const room = roomJson.room as Record<string, unknown>;
      const roomId = String(room.id ?? '');
      setChatRoomId(roomId);
      setChatRoomOrgId(String(room.orgId ?? room.org_id ?? '').trim());
      setChatRoomType(Number(room.roomType ?? room.room_type ?? 0));
      setChatRoomTicketId(String(room.ticketId ?? room.ticket_id ?? '').trim());

      const msgRes = await fetch(`/api/sale/chat/messages?room_id=${encodeURIComponent(roomId)}&page_size=30`);
      const msgJson = await msgRes.json().catch(() => ({}));
      if (!msgRes.ok) {
        setChatMessages([]);
        setAttachmentUrlByFileId({});
        resolvingFileIdsRef.current.clear();
        setChatNextPageToken('');
        return;
      }

      const incomingRaw = Array.isArray(msgJson?.messages) ? (msgJson.messages as Record<string, unknown>[]) : [];
      setChatMessages(incomingRaw.map((item) => mapChatMessageToUi(item)));
      setChatNextPageToken(String(msgJson?.next_page_token ?? ''));

      await fetch('/api/sale/chat/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId }),
      });
    } catch {
      setChatRoomId('');
      setChatRoomOrgId('');
      setChatRoomType(null);
      setChatRoomTicketId('');
      setChatMessages([]);
      setAttachmentUrlByFileId({});
      resolvingFileIdsRef.current.clear();
      setChatNextPageToken('');
    } finally {
      setLoadingChat(false);
    }
  }, [mapChatMessageToUi]);

  const pendingScrollRestoreRef = useRef<{ prevScrollHeight: number } | null>(null);

  const handleLoadMoreChat = async () => {
    if (!chatRoomId || !chatNextPageToken || loadingMoreChat) return;
    skipAutoScrollRef.current = true;
    const container = chatScrollRef.current;
    if (container) {
      pendingScrollRestoreRef.current = { prevScrollHeight: container.scrollHeight };
    }
    setLoadingMoreChat(true);
    try {
      const response = await fetch(
        `/api/sale/chat/messages?room_id=${encodeURIComponent(chatRoomId)}&page_size=30&page_token=${encodeURIComponent(chatNextPageToken)}`
      );
      const json = await response.json().catch(() => ({}));
      if (!response.ok) return;
      const incomingRaw = Array.isArray(json?.messages) ? (json.messages as Record<string, unknown>[]) : [];
      const mapped = incomingRaw.map((item) => mapChatMessageToUi(item));
      setChatMessages((prev) => mergeChatMessages(prev, mapped));
      setChatNextPageToken(String(json?.next_page_token ?? ''));
    } catch {
    } finally {
      setLoadingMoreChat(false);
    }
  };

  const scrollRafRef = useRef(0);

  const handleChatScroll = () => {
    if (scrollRafRef.current) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = 0;
      evaluateScrollToBottomVisibility();
      const container = chatScrollRef.current;
      if (!container) return;
      if (loadingChat || loadingMoreChat) return;
      if (!chatNextPageToken) return;

      if (container.scrollTop <= CHAT_LOAD_MORE_TOP_THRESHOLD) {
        void handleLoadMoreChat();
      }
    });
  };

  const handleSendChatMessage = async () => {
    const content = messageInput.trim();
    if (!chatRoomId || !content || sendingMessage) return;

    setSendingMessage(true);
    try {
      const response = await fetch('/api/sale/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: chatRoomId,
          message_type: 1,
          content,
          metadata: '{}',
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json?.message) return;

      const mapped = mapChatMessageToUi(json.message as Record<string, unknown>);
      setChatMessages((prev) => {
        if (prev.some((item) => item.id === mapped.id)) return prev;
        return [{ ...mapped, isMe: true }, ...prev];
      });
      setMessageInput('');
    } catch {
    } finally {
      setSendingMessage(false);
    }
  };

  const handleMessageInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter') return;
    if (event.shiftKey) return;
    if (event.nativeEvent.isComposing) return;

    event.preventDefault();
    void handleSendChatMessage();
  };

  useEffect(() => {
    if (!selectedTicket?.id) {
      setChatRoomId('');
      setChatRoomOrgId('');
      setChatRoomType(null);
      setChatRoomTicketId('');
      setChatMessages([]);
      setChatNextPageToken('');
      setAttachmentUrlByFileId({});
      resolvingFileIdsRef.current.clear();
      previousChatLengthRef.current = 0;
      skipAutoScrollRef.current = false;
      setUnreadNewCount(0);
      return;
    }
    initialScrollDoneRef.current = false;
    needsInitialScrollRef.current = false;
    previousChatLengthRef.current = 0;
    void loadChatForTicket(selectedTicket.id);
  }, [selectedTicket?.id, loadChatForTicket]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const el = chatScrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior });
    }
  }, []);

  // Restore scroll position after loading older messages (prepended at top)
  useLayoutEffect(() => {
    const restore = pendingScrollRestoreRef.current;
    if (!restore) return;
    pendingScrollRestoreRef.current = null;
    const container = chatScrollRef.current;
    if (!container) return;
    const addedHeight = container.scrollHeight - restore.prevScrollHeight;
    if (addedHeight > 0) {
      container.scrollTop += addedHeight;
    }
  }, [chatMessages]);

  // Auto-scroll to bottom on initial load
  useEffect(() => {
    if (!loadingChat && chatMessages.length > 0 && !initialScrollDoneRef.current) {
      initialScrollDoneRef.current = true;
      requestAnimationFrame(() => scrollToBottom('auto'));
    }
  }, [loadingChat, chatMessages.length, scrollToBottom]);

  // Handle scroll for live incoming messages (after initial load)
  useEffect(() => {
    const currentLength = chatMessages.length;
    const previousLength = previousChatLengthRef.current;
    const hasNewMessages = currentLength > previousLength;
    const addedCount = Math.max(0, currentLength - previousLength);

    if (hasNewMessages && initialScrollDoneRef.current) {
      if (skipAutoScrollRef.current) {
        skipAutoScrollRef.current = false;
      } else {
        const nearBottom = isNearChatBottom();
        if (nearBottom) {
          setUnreadNewCount(0);
          requestAnimationFrame(() => scrollToBottom('auto'));
        } else {
          setUnreadNewCount((prev) => prev + addedCount);
          playNewMessageSound();
        }
      }
    }

    previousChatLengthRef.current = currentLength;
  }, [chatMessages, playNewMessageSound, scrollToBottom]);



  useEffect(() => {
    if (chatEventSourceRef.current) {
      chatEventSourceRef.current.close();
      chatEventSourceRef.current = null;
    }

    if (!chatRoomId) return;

    const eventSource = new EventSource(`/api/sale/chat/stream?room_id=${encodeURIComponent(chatRoomId)}`);
    chatEventSourceRef.current = eventSource;

    const onMessage = (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data) as Record<string, unknown>;
        const mapped = mapChatMessageToUi(payload);
        setChatMessages((prev) => {
          if (prev.some((item) => item.id === mapped.id)) return prev;
          return [mapped, ...prev];
        });
      } catch {
      }
    };

    eventSource.addEventListener('message', onMessage as EventListener);

    return () => {
      eventSource.removeEventListener('message', onMessage as EventListener);
      eventSource.close();
      if (chatEventSourceRef.current === eventSource) {
        chatEventSourceRef.current = null;
      }
    };
  }, [chatRoomId, chatRoomOrgId, chatRoomType, chatRoomTicketId, mapChatMessageToUi]);

  // Ticker: every 60s nudge the URL-resolution effect so expired presigned URLs get refreshed
  useEffect(() => {
    const interval = setInterval(() => setUrlRefreshTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const currentUrls = attachmentUrlByFileIdRef.current;
    const fileIds = new Set<string>();
    chatMessages.forEach((message) => {
      const meta = parseAttachmentMeta(message.metadata);
      const fileId = String(meta?.fileId ?? '').trim();
      const urlInMeta = String(meta?.url ?? '').trim();

      if (fileId && !urlInMeta) {
        const cached = currentUrls[fileId];
        if (!cached || isPresignedUrlExpired(cached)) fileIds.add(fileId);
      }

      if (urlInMeta && isPresignedUrlExpired(urlInMeta)) {
        const fid = extractFileIdFromS3Url(urlInMeta);
        if (fid) {
          const cached = currentUrls[fid];
          if (!cached || isPresignedUrlExpired(cached)) fileIds.add(fid);
        }
      }
    });

    Object.entries(currentUrls).forEach(([fid, url]) => {
      if (isPresignedUrlExpired(url)) fileIds.add(fid);
    });

    const toResolve = Array.from(fileIds).filter((id) => !resolvingFileIdsRef.current.has(id));
    if (toResolve.length === 0) return;
    toResolve.forEach((id) => resolvingFileIdsRef.current.add(id));

    void Promise.allSettled(
      toResolve.map((fileId) =>
        fetch(`/api/sale/chat/download-url?file_id=${encodeURIComponent(fileId)}`)
          .then((r) => r.json().catch(() => ({})).then((j) => ({ ok: r.ok, json: j, fileId })))
          .then(({ ok, json, fileId: fid }) => {
            resolvingFileIdsRef.current.delete(fid);
            if (!ok) return null;
            const downloadUrl = String(json?.download_url ?? '').trim();
            return downloadUrl ? { fid, downloadUrl } : null;
          })
          .catch(() => {
            resolvingFileIdsRef.current.delete(fileId);
            return null;
          })
      )
    ).then((results) => {
      const updates: Record<string, string> = {};
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) {
          updates[r.value.fid] = r.value.downloadUrl;
        }
      }
      if (Object.keys(updates).length > 0) {
        setAttachmentUrlByFileId((prev) => ({ ...prev, ...updates }));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMessages, urlRefreshTick]);

  const handleSendAttachment = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !chatRoomId || uploadingAttachment) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setFlowMessage('File quá lớn. Giới hạn tối đa 10MB/tệp.');
      addToast('File quá lớn. Giới hạn 10MB.', { type: 'error' });
      return;
    }

    const isImage = file.type.startsWith('image/');
    setUploadingAttachment(true);
    try {
      // Step 1: Get presigned upload URL from backend
      // Sale/Tech/Admin (system users) do NOT send organization_id for file/image uploads
      const getUrlRes = await fetch('/api/sale/chat/get-upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          mime_type: file.type || 'application/octet-stream',
          size: file.size,
        }),
      });
      const getUrlJson = await getUrlRes.json().catch(() => ({}));
      if (!getUrlRes.ok || !getUrlJson?.upload_url || !getUrlJson?.file_id) {
        setFlowMessage(getUrlJson?.error || 'Không lấy được link upload.');
        addToast(getUrlJson?.error || 'Lấy link upload thất bại', { type: 'error' });
        return;
      }

      const uploadUrl = String(getUrlJson.upload_url);
      const fileId = String(getUrlJson.file_id);

      // Step 2: Upload file directly to S3 using the presigned URL
      const s3Res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });
      if (!s3Res.ok) {
        setFlowMessage('Upload tệp lên storage thất bại.');
        addToast('Upload tệp lên storage thất bại', { type: 'error' });
        return;
      }

      // Step 3: Register upload with backend to confirm success
      const registerRes = await fetch('/api/sale/chat/register-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id: fileId,
          filename: file.name,
          mime_type: file.type || 'application/octet-stream',
          size: file.size,
        }),
      });
      const registerJson = await registerRes.json().catch(() => ({}));
      if (!registerRes.ok || !registerJson?.success) {
        setFlowMessage(registerJson?.error || 'Đăng ký upload thất bại.');
        addToast(registerJson?.error || 'Đăng ký upload thất bại', { type: 'error' });
        return;
      }

      // Step 4: Get download URL for the uploaded file
      let downloadUrl = '';
      const dlRes = await fetch(`/api/sale/chat/download-url?file_id=${encodeURIComponent(fileId)}`);
      const dlJson = await dlRes.json().catch(() => ({}));
      if (dlRes.ok && dlJson?.download_url) {
        downloadUrl = String(dlJson.download_url).trim();
      }
      if (downloadUrl) {
        setAttachmentUrlByFileId((prev) => ({ ...prev, [fileId]: downloadUrl }));
      }

      // Step 5: Send chat message with file metadata
      const metadata = isImage
        ? JSON.stringify({
            url: downloadUrl,
          })
        : JSON.stringify({
            url: downloadUrl,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type || 'application/octet-stream',
          });

      const response = await fetch('/api/sale/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: chatRoomId,
          message_type: isImage ? 2 : 3,
          content: file.name,
          metadata,
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json?.message) {
        setFlowMessage(json?.error || 'Không gửi được tệp đính kèm.');
        addToast(json?.error || 'Gửi tệp vào chat thất bại', { type: 'error' });
        return;
      }

      const mapped = mapChatMessageToUi(json.message as Record<string, unknown>);
      setChatMessages((prev) => mergeChatMessages(prev, [{ ...mapped, isMe: true }]));
      addToast(isImage ? 'Đã gửi ảnh' : 'Đã gửi tệp', { type: 'success' });
    } catch {
      setFlowMessage('Lỗi kết nối khi gửi tệp đính kèm.');
      addToast('Lỗi mạng khi gửi tệp', { type: 'error' });
    } finally {
      setUploadingAttachment(false);
    }
  };

  const getTicketOrgId = (ticket: Ticket): string => {
    const directOrg = String(ticket.orgId ?? '').trim();
    if (directOrg) return directOrg;
    if (!ticket.attributes) return '';

    try {
      const parsed = JSON.parse(ticket.attributes) as Record<string, unknown>;
      const orgId = parsed.org_id ?? parsed.orgId ?? parsed.owner_id ?? parsed.ownerId;
      return String(orgId ?? '').trim();
    } catch {
      return '';
    }
  };

  const getEffectiveOrgOrOwnerId = (ticket: Ticket): string => {
    return getTicketOrgId(ticket) || contextOwnerId;
  };

  const effectiveContextId = selectedTicket ? getEffectiveOrgOrOwnerId(selectedTicket) : contextOwnerId;
  const hasEffectiveContextId = !!effectiveContextId;

  const handleStatusChange = async (ticketId: string, status: Ticket['status']) => {
    setTickets((prev) => prev.map((ticket) => (ticket.id === ticketId ? { ...ticket, status } : ticket)));
    setSelectedTicket((prev) => (prev && prev.id === ticketId ? { ...prev, status } : prev));

    try {
      const response = await fetch('/api/sale/tickets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticketId,
          status: TICKET_STATUS_VALUE[status],
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        setFlowMessage(err?.error || 'Không thể đồng bộ trạng thái ticket với server.');
      } else {
        setFlowMessage(`Đã cập nhật trạng thái ticket -> ${status}.`);
      }
    } catch {
      setFlowMessage('Lỗi kết nối khi cập nhật trạng thái ticket.');
    }
  };

  const handleLoadDiscovery = async () => {
    setLoadingDiscovery(true);
    setFlowMessage('Đang tải ListCategories/ListServices...');

    try {
      const [categoriesRes, servicesRes] = await Promise.all([
        fetch('/api/admin/catalog/categories?page_size=50&has_services=true&show_approved=true'),
        fetch('/api/admin/catalog/services?page_size=100&show_inactive=false'),
      ]);

      const categoryJson = await categoriesRes.json();
      const serviceJson = await servicesRes.json();

      if (!categoriesRes.ok || !servicesRes.ok) {
        setFlowMessage(categoryJson?.error || serviceJson?.error || 'Không tải được danh mục dịch vụ.');
        return;
      }

      const categoryData: ServiceCategory[] = (categoryJson.categories ?? []).map((item: Record<string, unknown>) => ({
        id: String(item.id ?? ''),
        name: String(item.name ?? ''),
        attributesSchema: item.attributesSchema == null ? undefined : String(item.attributesSchema),
      }));
      const serviceData: ServiceOption[] = (serviceJson.services ?? []).map((item: Record<string, unknown>) => ({
        id: String(item.id ?? ''),
        name: String(item.name ?? ''),
        categoryId: item.categoryId == null ? undefined : String(item.categoryId),
      }));

      setCategories(categoryData);
      setServices(serviceData);
      if (categoryData.length > 0) {
        const preferredCategoryId = categoryData.some((item) => item.id === selectedCategoryId)
          ? selectedCategoryId
          : categoryData[0].id;
        setSelectedCategoryId(preferredCategoryId);

        const servicesInCategory = serviceData.filter(
          (item) => !item.categoryId || item.categoryId === preferredCategoryId
        );
        const preferredServiceId = servicesInCategory.some((item) => item.id === selectedServiceId)
          ? selectedServiceId
          : (servicesInCategory[0]?.id ?? '');
        setSelectedServiceId(preferredServiceId);
      } else if (serviceData.length > 0) {
        const preferredServiceId = serviceData.some((item) => item.id === selectedServiceId)
          ? selectedServiceId
          : serviceData[0].id;
        setSelectedServiceId(preferredServiceId);
      }
      setFlowMessage('Đã tải danh mục. Bạn có thể tạo ticket DRAFT theo UC-2.');
    } catch {
      setFlowMessage('Lỗi kết nối khi tải danh mục dịch vụ.');
    } finally {
      setLoadingDiscovery(false);
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.code.toLowerCase().includes(search.toLowerCase()) || 
    t.client.toLowerCase().includes(search.toLowerCase()) ||
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  const processedMessages = useMemo(() => {
    return chatMessages.map((msg) => {
      const attachment = parseAttachmentMeta(msg.metadata);
      const attachmentFileId = String(attachment?.fileId ?? '').trim();
      const fileIdFromMetaUrl = attachment?.url ? extractFileIdFromS3Url(attachment.url) : '';
      const attachmentUrl = String(
        (fileIdFromMetaUrl && attachmentUrlByFileId[fileIdFromMetaUrl])
          ? attachmentUrlByFileId[fileIdFromMetaUrl]
          : attachment?.url ?? attachment?.dataUrl ?? (attachmentFileId ? attachmentUrlByFileId[attachmentFileId] ?? '' : '')
      );
      const attachmentFileName = String(attachment?.fileName ?? msg.content ?? 'attachment');
      return { msg, attachmentUrl, attachmentFileName, attachmentFileId, attachmentSize: attachment?.size };
    }).reverse();
  }, [chatMessages, attachmentUrlByFileId]);

  const handleCreateTicket = async (data: { subject: string; client: string; priority: string }) => {
    if (!selectedCategoryId) {
      setFlowMessage('Cần chạy ListCategories/ListServices trước khi CreateTicket.');
      return;
    }

    const customerId = (contextOwnerId || (selectedTicket ? getEffectiveOrgOrOwnerId(selectedTicket) : '')).trim();
    if (!customerId) {
      setFlowMessage('Thiếu customer_id. Hãy chọn khách từ CRM trước khi CreateTicket.');
      return;
    }

    const priorityValue = data.priority.toLowerCase().includes('critical')
      ? 'critical'
      : data.priority.toLowerCase().includes('high')
        ? 'high'
        : data.priority.toLowerCase().includes('low')
          ? 'low'
          : 'medium';

    try {
      const createRes = await fetch('/api/sale/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          category_id: selectedCategoryId,
          service_id: selectedServiceId || undefined,
          title: data.subject,
          description: `Client: ${data.client}`,
          priority: priorityValue,
          attributes: JSON.stringify({
            source: 'sale_support',
            client: data.client,
            category_id: selectedCategoryId,
            service_id: selectedServiceId || undefined,
            owner_id: contextOwnerId || undefined,
            client_name: contextClientName || data.client,
            client_email: contextClientEmail || undefined,
            client_phone: contextClientPhone || undefined,
          }),
          asset_id: selectedAssetId || undefined,
        }),
      });

      const createJson = await createRes.json();
      if (!createRes.ok) {
        setFlowMessage(createJson?.error || 'CreateTicket thất bại. Đã fallback local ticket.');
      }

      const responseTicket = createJson?.ticket as {
        id?: string;
        status?: number;
        orgId?: string;
        categoryId?: string;
        serviceId?: string;
        attributes?: string;
        slaHours?: number;
        assetId?: string;
      } | undefined;
      const apiId = responseTicket?.id;
      const mappedStatus = responseTicket?.status ? STATUS_FROM_NUMBER[responseTicket.status] : 'DRAFT';

      const newTicket: Ticket = {
        id: apiId || `tmp-${Date.now()}`,
        code: apiId ? `TICK-${apiId.slice(-6).toUpperCase()}` : `TICK-${Math.floor(10000 + Math.random() * 90000)}`,
        orgId: responseTicket?.orgId,
        categoryId: responseTicket?.categoryId ?? selectedCategoryId,
        serviceId: responseTicket?.serviceId ?? selectedServiceId,
        title: data.subject,
        client: data.client,
        status: mappedStatus || 'DRAFT',
        priority: data.priority.split(' ')[0] as Ticket['priority'],
        attributes: responseTicket?.attributes,
        slaHours: responseTicket?.slaHours,
        assetId: responseTicket?.assetId,
        date: new Date().toISOString().split('T')[0],
        dueTime: '12:00',
      };

      const newTicketList = [newTicket, ...tickets];
      setTickets(newTicketList);
      setSelectedTicket(newTicket);
      if (createRes.ok) {
        setFlowMessage('CreateTicket thành công ở trạng thái DRAFT.');
      }
      setIsCreateModalOpen(false);
      return;
    } catch {
      setFlowMessage('Lỗi kết nối CreateTicket. Đã fallback local ticket.');
    }

    const newId = (tickets.length + 1).toString();
    const newTicket: Ticket = {
      id: newId,
      code: `TICK-${Math.floor(10000 + Math.random() * 90000)}`, // Random 5-digit code for variety
      orgId: contextOwnerId || undefined,
      title: data.subject,
      client: data.client,
      status: 'DRAFT',
      priority: data.priority.split(' ')[0] as Ticket['priority'], // Extract 'Critical' from 'Critical (1h)'
      attributes: JSON.stringify({
        source: 'sale_support',
        client: data.client,
        category_id: selectedCategoryId,
        service_id: selectedServiceId || undefined,
        owner_id: contextOwnerId || undefined,
      }),
      date: new Date().toISOString().split('T')[0],
      // Approximate due time logic based on priority, simplified
      dueTime: '12:00', 
    };

    const newTicketList = [newTicket, ...tickets];
    setTickets(newTicketList);
    setSelectedTicket(newTicket);
    setIsCreateModalOpen(false);
  };

  const handlePreviewSla = async () => {
    if (!selectedTicket) return;
    const orgId = selectedTicket ? getEffectiveOrgOrOwnerId(selectedTicket) : '';
    const categoryId = getTicketCategoryId(selectedTicket) || selectedCategoryId;
    const serviceId = getTicketServiceId(selectedTicket) || selectedServiceId;
    if (!categoryId || !orgId) {
      setFlowMessage('Cần category + org_id trước khi gọi PreviewSLA.');
      return;
    }

    setLoadingSlaPreview(true);
    try {
      const response = await fetch('/api/sale/preview-sla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: categoryId,
          service_id: serviceId || undefined,
          priority: selectedTicket.priority.toLowerCase(),
          org_id: orgId,
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        setFlowMessage(json?.error || 'PreviewSLA thất bại.');
        return;
      }

      setSlaPreview(json as SlaPreview);
      setFlowMessage('PreviewSLA thành công.');
    } catch {
      setFlowMessage('Lỗi kết nối khi gọi PreviewSLA.');
    } finally {
      setLoadingSlaPreview(false);
    }
  };

  const handlePreviewPricingRules = async () => {
    if (!selectedTicket) return;
    const orgId = selectedTicket ? getEffectiveOrgOrOwnerId(selectedTicket) : '';
    if (!orgId) {
      setFlowMessage('Thiếu org_id của ticket để gọi PreviewPricingRules.');
      return;
    }

    setLoadingPricingPreview(true);
    try {
      const response = await fetch('/api/sale/preview-pricing-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          priority: selectedTicket.priority.toLowerCase(),
          sla_hours: selectedTicket.slaHours ?? 4,
          base_amount: 1000000,
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        setFlowMessage(json?.error || 'PreviewPricingRules thất bại.');
        return;
      }

      setPricingPreview(json as PricingPreview);
      setFlowMessage('PreviewPricingRules thành công.');
    } catch {
      setFlowMessage('Lỗi kết nối khi gọi PreviewPricingRules.');
    } finally {
      setLoadingPricingPreview(false);
    }
  };

  const handleListAssets = async () => {
    if (!selectedTicket) return;
    const orgId = selectedTicket ? getEffectiveOrgOrOwnerId(selectedTicket) : '';
    if (!orgId) {
      setFlowMessage('Thiếu org_id/owner_id của khách để tra cứu assets.');
      return;
    }

    setLoadingAssets(true);
    try {
      const params = new URLSearchParams({
        org_id: orgId,
        page_size: '20',
      });
      const response = await fetch(`/api/sale/assets?${params.toString()}`);
      const json = await response.json();

      if (!response.ok) {
        setFlowMessage(json?.error || 'ListAssets thất bại.');
        return;
      }

      const assetsData = Array.isArray(json?.assets) ? (json.assets as AssetOption[]) : [];
      setAssets(assetsData);
      if (assetsData.length > 0) {
        setSelectedAssetId(assetsData[0].id);
      }
      setFlowMessage(`ListAssets thành công: ${assetsData.length} tài sản.`);
    } catch {
      setFlowMessage('Lỗi kết nối khi gọi ListAssets.');
    } finally {
      setLoadingAssets(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-theme(spacing.6))] gap-6 p-6">
      {/* Left Pane: Active Tickets List */}
      <div className="w-[400px] flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden shrink-0">
        <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Active Tickets</h2>
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search ID, Client..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div className="mt-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | Ticket['status'])}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Status</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
            {loadingTickets && tickets.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">Đang tải danh sách tickets...</div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">Chưa có ticket nào.</div>
            ) : filteredTickets.map(ticket => (
                <div 
                    key={ticket.id}
                onClick={() => handleSelectTicket(ticket)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedTicket?.id === ticket.id ? 'bg-blue-50/50 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'
                    }`}
                >
                    <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-gray-900 text-sm">{ticket.code}</span>
                        <span className="text-xs text-gray-400">{ticket.date}</span>
                    </div>
                    <h3 className="font-medium text-gray-800 text-sm mb-1 truncate">{ticket.title}</h3>
                    <p className="text-xs text-gray-500 mb-3">{ticket.client}</p>
                    <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                           ticket.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                           ticket.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                           ticket.status === 'AGREED' ? 'bg-indigo-100 text-indigo-700' :
                           ticket.status === 'OPEN' ? 'bg-cyan-100 text-cyan-700' :
                           ticket.status === 'DRAFT' ? 'bg-gray-100 text-gray-700 border border-gray-200' :
                           'bg-gray-200 text-gray-700'
                         }`}>
                           {ticket.status}
                         </span>
                         {ticket.priority && (
                             <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border ${
                                ticket.priority === 'Critical' ? 'text-red-600 bg-red-50 border-red-100' :
                              ticket.priority === 'Urgent' ? 'text-rose-600 bg-rose-50 border-rose-100' :
                                ticket.priority === 'High' ? 'text-orange-600 bg-orange-50 border-orange-100' :
                                'text-gray-600 bg-gray-50 border-gray-200'
                             }`}>
                                 {ticket.priority === 'Critical' && <Clock className="w-3 h-3" />}
                                 {ticket.priority}
                             </span>
                         )}
                         {ticket.slaStatus === 'Met' && (
                             <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                                 <CheckCircle2 className="w-3 h-3" />
                                 SLA Met
                             </span>
                         )}
                    </div>
                </div>
            ))}
        </div>

        <div className="border-t border-gray-100 p-3 bg-white flex justify-center">
          <button
            onClick={() => void handleLoadMoreTickets()}
            disabled={!ticketNextPageToken || loadingMoreTickets || loadingTickets}
            className="px-4 py-2 text-xs font-medium rounded-lg border border-gray-200 text-gray-700 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMoreTickets ? 'Loading...' : ticketNextPageToken ? 'Load more tickets' : 'No more tickets'}
          </button>
        </div>
      </div>

      {/* Right Pane: Ticket Detail & Chat */}
      {selectedTicket && (
        <div className="flex-1 min-h-0 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-start justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        {selectedTicket.title} 
                        <span className="text-gray-400 font-normal text-base">#{selectedTicket.code}</span>
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <span className="font-medium text-gray-700">{selectedTicket.client}</span>
                    </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical className="w-5 h-5" />
                </button>
            </div>

            {/* Controls Row */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 grid grid-cols-12 gap-6">
                <div className="col-span-5">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Status</label>
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value as Ticket['status'])}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>
                <div className="col-span-5">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Assignee</label>
                    <select className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>DevOps Team A</option>
                        <option>Support L1</option>
                    </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Priority</label>
                  <div className="inline-flex items-center justify-center px-4 py-1.5 bg-red-50 text-red-600 font-bold text-sm rounded-lg border border-red-100 w-full">
                    {selectedTicket.priority}
                    </div>
                </div>
            </div>

            <div className="px-6 py-3 border-b border-gray-100 bg-white flex flex-wrap gap-2">
              <button
                onClick={handleLoadDiscovery}
                disabled={loadingDiscovery}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 text-gray-700 bg-gray-50 disabled:opacity-50"
              >
                ListCategories / ListServices
              </button>
              <button
                onClick={handleListAssets}
                disabled={loadingAssets || !hasEffectiveContextId}
                title={!hasEffectiveContextId ? 'Thiếu owner/org id. Hãy chọn khách từ CRM để prefill context.' : undefined}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-emerald-200 text-emerald-700 bg-emerald-50 disabled:opacity-50"
              >
                {loadingAssets ? 'Loading assets...' : 'ListAssets'}
              </button>
              <button
                onClick={handlePreviewSla}
                disabled={
                  loadingSlaPreview ||
                  !hasEffectiveContextId ||
                  !(selectedTicket ? getTicketCategoryId(selectedTicket) || selectedCategoryId : selectedCategoryId)
                }
                title={
                  !hasEffectiveContextId
                    ? 'Thiếu owner/org id. Hãy chọn khách từ CRM để prefill context.'
                    : !(selectedTicket ? getTicketCategoryId(selectedTicket) || selectedCategoryId : selectedCategoryId)
                      ? 'Thiếu category để gọi PreviewSLA.'
                      : undefined
                }
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-indigo-200 text-indigo-700 bg-indigo-50 disabled:opacity-50"
              >
                {loadingSlaPreview ? 'Previewing SLA...' : 'PreviewSLA'}
              </button>
              <button
                onClick={handlePreviewPricingRules}
                disabled={loadingPricingPreview || !hasEffectiveContextId}
                title={!hasEffectiveContextId ? 'Thiếu owner/org id. Hãy chọn khách từ CRM để prefill context.' : undefined}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-amber-200 text-amber-700 bg-amber-50 disabled:opacity-50"
              >
                {loadingPricingPreview ? 'Previewing Pricing...' : 'PreviewPricingRules'}
              </button>
              <button
                onClick={() => handleStatusChange(selectedTicket.id, 'AGREED')}
                disabled={selectedTicket.status === 'AGREED'}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-blue-200 text-blue-700 bg-blue-50 disabled:opacity-50"
              >
                Chuyển AGREED
              </button>
            </div>

            <div
              className={`px-6 py-2 border-b border-gray-100 text-xs ${
                effectiveContextId ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'
              }`}
            >
              <p>
                <span className="font-semibold">UC-2 Context:</span>{' '}
                {effectiveContextId ? `owner/org = ${effectiveContextId}` : 'Chưa có owner/org id'}
              </p>
              {(contextClientName || contextClientEmail || contextClientPhone) && (
                <p className={`mt-1 ${effectiveContextId ? 'text-emerald-700' : 'text-red-600'}`}>
                  Khách từ CRM: {contextClientName || '-'}
                  {contextClientEmail ? ` | ${contextClientEmail}` : ''}
                  {contextClientPhone ? ` | ${contextClientPhone}` : ''}
                </p>
              )}
              {!effectiveContextId && (
                <button
                  onClick={() => router.push('/sale/customers')}
                  className="mt-2 inline-flex items-center rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                >
                  Đi tới CRM & chọn khách
                </button>
              )}
            </div>

            {selectedCategory?.attributesSchema && (
              <div className="px-6 py-3 border-b border-gray-100 bg-amber-50">
                <p className="text-xs font-semibold text-amber-800 mb-1">attributes_schema (Discovery)</p>
                <pre className="whitespace-pre-wrap break-all text-[11px] text-amber-700">{selectedCategory.attributesSchema}</pre>
              </div>
            )}

            {flowMessage && (
              <div className="px-6 py-2 border-b border-gray-100 bg-blue-50 text-blue-700 text-xs">
                {flowMessage}
              </div>
            )}

            {(slaPreview || pricingPreview) && (
              <div className="px-6 py-3 border-b border-gray-100 bg-white grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3">
                  <p className="text-xs font-semibold text-indigo-800 mb-1">SLA Preview</p>
                  {slaPreview ? (
                    <div className="text-xs text-indigo-700 space-y-1">
                      <p>Source: {slaPreview.appliedSource}</p>
                      <p>Business Hours: {slaPreview.businessHours}</p>
                      <p>Response: {slaPreview.targetResponseMinutes} phút</p>
                      <p>Resolution: {slaPreview.targetResolutionMinutes} phút</p>
                      <p>Risk: {slaPreview.breachRisk}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-indigo-600">Chưa có dữ liệu SLA preview.</p>
                  )}
                </div>

                <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-800 mb-1">Pricing Rules Preview</p>
                  {pricingPreview ? (
                    <div className="text-xs text-amber-700 space-y-1">
                      <p>Base: {pricingPreview.baseAmount.toLocaleString()} ₫</p>
                      <p>Total K: x{pricingPreview.totalMultiplier.toFixed(2)}</p>
                      <p>Estimated: {pricingPreview.estimatedAmount.toLocaleString()} ₫</p>
                      <div className="pt-1">
                        {pricingPreview.breakdown.map((rule) => (
                          <p key={rule.code}>• {rule.label}: x{rule.k.toFixed(2)}</p>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-600">Chưa có dữ liệu pricing preview.</p>
                  )}
                </div>
              </div>
            )}

            {/* Chat Area */}
            <div className="relative flex-1 min-h-0 bg-white">
            <div
              ref={chatScrollRef}
              onScroll={handleChatScroll}
              style={{ willChange: 'scroll-position' }}
              className="absolute inset-0 overflow-y-auto p-6 flex flex-col gap-6"
            >
                {loadingChat ? (
                  <div className="text-sm text-gray-500">Đang tải hội thoại...</div>
                ) : !chatRoomId ? (
                  <div className="text-sm text-gray-500">Ticket này chưa có chat room.</div>
                ) : chatMessages.length === 0 ? (
                  <div className="text-sm text-gray-500">Chưa có tin nhắn trong room này.</div>
                ) : (
                  <>
                    <div className="flex justify-center py-2 text-xs text-gray-400">
                      {loadingMoreChat ? 'Loading older messages...' : chatNextPageToken ? 'Scroll up to load older messages' : 'No more messages'}
                    </div>
                    {processedMessages.map((pm) => (
                      <ChatMessageItem
                        key={pm.msg.id}
                        msg={pm.msg}
                        attachmentUrl={pm.attachmentUrl}
                        attachmentFileName={pm.attachmentFileName}
                        attachmentFileId={pm.attachmentFileId}
                        attachmentSize={pm.attachmentSize}
                      />
                    ))}
                    <div ref={chatBottomRef} />
                  </>
                )}
            </div>
            {showScrollToBottom && (
              <button
                onClick={() => {
                  scrollToBottom('smooth');
                  setUnreadNewCount(0);
                }}
                className="absolute right-4 bottom-4 inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                <ChevronDown className="h-3.5 w-3.5" />
                Tin mới nhất
                {unreadNewCount > 0 && (
                  <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {unreadNewCount > 99 ? '99+' : unreadNewCount}
                  </span>
                )}
              </button>
            )}
            {chatRoomId && (
              <button
                onClick={() => {
                  setEnableNewMessageSound((prev) => {
                    const next = !prev;
                    addToast(next ? 'Đã bật âm báo tin nhắn' : 'Đã tắt âm báo tin nhắn', { type: 'info' });
                    return next;
                  });
                }}
                title={enableNewMessageSound ? 'Tắt âm báo' : 'Bật âm báo'}
                className="absolute right-4 bottom-16 inline-flex items-center justify-center rounded-full border border-gray-200 bg-white p-2 text-gray-700 shadow-sm hover:bg-gray-50"
              >
                {enableNewMessageSound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
            )}
            </div>

            {/* Footer Input */}
            <div className="p-4 border-t border-gray-100 bg-white">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(event) => void handleSendAttachment(event)}
              />
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all shadow-sm">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!chatRoomId || uploadingAttachment || sendingMessage}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                        <Paperclip className="w-5 h-5" />
                    </button>
                    <textarea
                      placeholder="Type message to coordinate..."
                      className="flex-1 bg-transparent border-none focus:outline-none text-sm py-1 resize-none max-h-28"
                      rows={1}
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={handleMessageInputKeyDown}
                    />
                      <button
                        onClick={() => void handleSendChatMessage()}
                        disabled={!chatRoomId || !messageInput.trim() || sendingMessage || uploadingAttachment}
                        className="text-blue-600 hover:text-blue-700 bg-blue-50 p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
      )}

      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateTicket}
      />
    </div>
  );
}