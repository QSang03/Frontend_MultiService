'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { FileText, Plus, Send, AlertCircle, X, Calculator, Loader2, AlertTriangle, CheckCircle2, TrendingUp, Search, BookOpen, GitBranch, RefreshCw, ArrowRightCircle, Link2, ChevronDown, ChevronUp, ChevronsUpDown, ChevronLeft, ChevronRight, Copy, Check, BarChart3, ScrollText, Mail, Phone } from 'lucide-react';
import { useToast } from '@/components/ui';
import ContractsList from '@/components/contract/ContractsList';
import ContractDetailModal from '@/components/contract/ContractDetailModal';
import CancelContractModal from '@/components/contract/CancelContractModal';
import { useContracts } from '@/hooks/useContracts';
import type { Contract } from '@/types/contract';

/** Relative time helper */
const relativeTime = (iso?: string): string => {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  const months = Math.floor(days / 30);
  return `${months} tháng trước`;
};

/** Skeleton row for loading state */
const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-2 py-3"><div className="w-3 h-3 bg-gray-200 rounded mx-auto" /></td>
    <td className="px-4 py-3"><div className="w-20 h-3 bg-gray-200 rounded" /></td>
    <td className="px-4 py-3"><div className="w-24 h-3 bg-gray-200 rounded" /></td>
    <td className="px-4 py-3"><div className="w-16 h-4 bg-gray-200 rounded-full" /></td>
    <td className="px-4 py-3"><div className="w-20 h-3 bg-gray-200 rounded ml-auto" /></td>
    <td className="px-4 py-3"><div className="w-12 h-3 bg-gray-200 rounded ml-auto" /></td>
    <td className="px-4 py-3"><div className="w-16 h-3 bg-gray-200 rounded ml-auto" /></td>
    <td className="px-4 py-3"><div className="w-18 h-3 bg-gray-200 rounded" /></td>
    <td className="px-4 py-3"><div className="flex gap-1"><div className="w-14 h-5 bg-gray-200 rounded" /><div className="w-14 h-5 bg-gray-200 rounded" /></div></td>
  </tr>
);

/** Lifecycle steps for status stepper */
const LIFECYCLE_STEPS = [
  { status: 1, label: 'Draft', color: 'gray' },
  { status: 2, label: 'Đã gửi', color: 'blue' },
  { status: 3, label: 'Xét duyệt', color: 'amber' },
  { status: 4, label: 'Chấp nhận', color: 'emerald' },
  { status: 6, label: 'Ký HĐ', color: 'violet' },
] as const;

interface Quote {
  id: string;
  customer: string;
  status: 'sent' | 'draft' | 'internal-review' | 'approval' | 'approved';
  dealType: 'long-term' | 'one-deal';
  totalValue: string;
  netProfit: string;
  createdDate: string;
  services: string[];
  quotationId?: string;
  ticketId?: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  price: string;
  defaultItems: { name: string; price: number }[];
}

type MarginResult = {
  grossMarginPercent: string;
  netProfit: string;
  totalCost: string;
};
type QuotationItemRow = { description: string; quantity: string; unit_price: string };
type CustomerOption = { id: string; name: string; company: string; email?: string };
type TicketOption = { id: string; title: string; status: number; creatorId?: string };

// UC-9 types
type RealQuotation = {
  id: string;
  orgId: string;
  creatorId: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  ticketId?: string;
  status: number; // 1=DRAFT,2=SENT,3=APPROVED,4=REJECTED,5=EXPIRED
  totalAmount: string;
  taxAmount: string;
  currency: string;
  items: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
  marginPercent?: string;
  netProfit?: string;
};
type RealTemplate = {
  id: string;
  name: string;
  description: string;
  items: string;
  category: string;
  isActive: boolean;
};
type ContractStatus = {
  quotation: RealQuotation | null;
  contract_id: string;
  contract_status: string;
};
type ConvertForm = {
  title: string;
  start_date: string;
  end_date: string;
};

type MainTab = 'pipeline' | 'templates' | 'contracts';
const MAIN_TAB_STORAGE_KEY = 'sale-quotations-main-tab';

const isValidMainTab = (value: string | null): value is MainTab =>
  value === 'pipeline' || value === 'templates' || value === 'contracts';

const mockQuotes: Quote[] = [
  {
    id: 'Q-2024-001',
    customer: 'TechSolutions Ltd',
    status: 'sent',
    dealType: 'long-term',
    totalValue: '50.000.000 ₫',
    netProfit: '12.000.000 ₫',
    createdDate: '2024-01-15',
    services: ['Maintenance 12 months', 'Server Upgrade'],
  },
  {
    id: 'Q-2024-002',
    customer: 'Nguyen Van A',
    status: 'draft',
    dealType: 'one-deal',
    totalValue: '1.500.000 ₫',
    netProfit: '500.000 ₫',
    createdDate: '2024-01-20',
    services: ['Laptop Repair', 'RAM 8GB'],
  },
  {
    id: 'Q-2024-004',
    customer: 'Big Corp Inc',
    status: 'internal-review',
    dealType: 'long-term',
    totalValue: '200.000.000 ₫',
    netProfit: '40.000.000 ₫',
    createdDate: '2024-02-05',
    services: ['Full Office IT Setup', 'Cloud Migration'],
  },
];

const mockTemplates: Template[] = [
  {
    id: '1',
    name: 'Standard Maintenance',
    description: 'Basic server & network monitoring',
    price: '5,000,000 / mo',
    defaultItems: [
        { name: 'Server Maintenance (Monthly)', price: 5000000 }
    ]
  },
  {
    id: '2',
    name: 'Office Setup Pack',
    description: 'Cabling, router config for <20 users',
    price: '20,000,000',
    defaultItems: [
        { name: 'Cabling Infrastructure', price: 15000000 },
        { name: 'Router Configuration', price: 5000000 }
    ]
  },
  {
    id: '3',
    name: 'Cloud Migration',
    description: 'Move on-prem to AWS/Azure',
    price: '15,000,000',
    defaultItems: [
        { name: 'Cloud Assessment', price: 5000000 },
        { name: 'Migration Service', price: 10000000 }
    ]
  },
  {
    id: '4',
    name: 'PC Refresh',
    description: 'Bulk hardware upgrade',
    price: 'Call for Quote',
    defaultItems: []
  },
];

export default function SaleQuotationsPage() {
  const [quotes, setQuotes] = useState<Quote[]>(mockQuotes);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [quotationCurrency, setQuotationCurrency] = useState('VND');
  const [ticketId, setTicketId] = useState('');

  // UC-3 Quoting state
  const [quotationId, setQuotationId] = useState('');
  const [quotationTotalAmount, setQuotationTotalAmount] = useState('');
  const [quotationTaxAmount, setQuotationTaxAmount] = useState('');
  const [quotationNote, setQuotationNote] = useState('');
  const [quotationItemRows, setQuotationItemRows] = useState<QuotationItemRow[]>([]);
  const [marginResult, setMarginResult] = useState<MarginResult | null>(null);
  const [loadingSubmitQuotation, setLoadingSubmitQuotation] = useState(false);
  const [loadingMargin, setLoadingMargin] = useState(false);
  const { addToast } = useToast();

  // UC-9: Main tab
  const [mainTab, setMainTab] = useState<MainTab>('pipeline');

  // UC-9: Real quotations from API (Pipeline tab)
  const [realQuotations, setRealQuotations] = useState<RealQuotation[]>([]);
  const [loadingRealQuotations, setLoadingRealQuotations] = useState(false);
  const [pipelineSearchQuery, setPipelineSearchQuery] = useState('');
  const [pipelineStatusFilter, setPipelineStatusFilter] = useState<number | 'all'>('all');

  // UC-9: Templates
  const [realTemplates, setRealTemplates] = useState<RealTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showCreateTemplateForm, setShowCreateTemplateForm] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('');
  const [newTemplateItemRows, setNewTemplateItemRows] = useState<QuotationItemRow[]>([]);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // UC-9: GetQuoteContractStatus
  const [contractStatusMap, setContractStatusMap] = useState<Record<string, ContractStatus>>({});
  const [loadingContractStatus, setLoadingContractStatus] = useState<Record<string, boolean>>({});

  // Sort & Pagination for pipeline
  type SortField = 'createdAt' | 'totalAmount' | 'status' | 'marginPercent';
  type SortDir = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Expanded row detail
  const [expandedQuotationId, setExpandedQuotationId] = useState<string | null>(null);

  // Confirm dialog
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  // Copied ID feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // UC-9: ConvertToContract modal
  const [convertModalQuotation, setConvertModalQuotation] = useState<RealQuotation | null>(null);
  const [convertForm, setConvertForm] = useState<ConvertForm>({ title: '', start_date: '', end_date: '' });
  const [loadingConvert, setLoadingConvert] = useState(false);

  // Contracts tab state
  const {
    cancelContract,
    sendForSignature,
    activateContract,
    approveRenewal,
    finalizeContract,
    uploadRevisedContract,
    getContractTimeline,
  } = useContracts();
  const [showContractDetail, setShowContractDetail] = useState(false);
  const [showCancelContract, setShowCancelContract] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [contractModalLoading, setContractModalLoading] = useState(false);
  const [contractRefreshKey, setContractRefreshKey] = useState(0);

  // Customer selector
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customerLookup, setCustomerLookup] = useState<Record<string, string>>({});
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Ticket selector
  const [tickets, setTickets] = useState<TicketOption[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketSearch, setTicketSearch] = useState('');
  const [selectedTicketTitle, setSelectedTicketTitle] = useState('');
  const [showTicketDropdown, setShowTicketDropdown] = useState(false);

  const customerSearchRef = useRef<HTMLInputElement>(null);
  const ticketSearchRef = useRef<HTMLInputElement>(null);

  const fetchCustomers = async (search = '') => {
    setLoadingCustomers(true);
    try {
      const params = new URLSearchParams({ page_size: '50' });
      if (search) params.set('search_term', search);
      const res = await fetch(`/api/sale/crm/list-customers?${params}`);
      const json = await res.json() as { customers?: CustomerOption[] };
      const list = Array.isArray(json?.customers) ? json.customers : [];
      setCustomers(list);
      // Populate lookup map id → name for pipeline table
      if (list.length > 0) {
        setCustomerLookup(prev => {
          const updated = { ...prev };
          list.forEach(c => { updated[c.id] = c.company && c.company !== 'Individual' ? `${c.name} (${c.company})` : c.name; });
          return updated;
        });
      }
    } catch {
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchTickets = async (creatorId = '') => {
    setLoadingTickets(true);
    try {
      const params = new URLSearchParams({ page_size: '50' });
      if (creatorId) params.set('creator_id', creatorId);
      const res = await fetch(`/api/sale/tickets?${params}`);
      const json = await res.json() as { tickets?: TicketOption[] };
      setTickets(Array.isArray(json?.tickets) ? json.tickets : []);
    } catch {
      setTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (showCreateModal) {
      void fetchCustomers();
      void fetchTickets(selectedCustomerId);
    }
  }, [showCreateModal]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowCreateModal(false);
      // Ctrl+N / Cmd+N to open create modal
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !showCreateModal) {
        e.preventDefault();
        setShowCreateModal(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showCreateModal]);

  // UC-9: Load real data on mount
  useEffect(() => {
    void fetchRealQuotations();
    void fetchRealTemplates();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Restore tab from URL or localStorage on first load (for F5 persistence)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tabFromUrl = params.get('tab');
    const tabFromStorage = window.localStorage.getItem(MAIN_TAB_STORAGE_KEY);
    const nextTab = isValidMainTab(tabFromUrl)
      ? tabFromUrl
      : isValidMainTab(tabFromStorage)
      ? tabFromStorage
      : 'pipeline';
    setMainTab(nextTab);
  }, []);

  // Keep selected tab in URL + localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(MAIN_TAB_STORAGE_KEY, mainTab);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', mainTab);
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', nextUrl);
  }, [mainTab]);

  // UC-9: Fetch real quotations (ListQuotations API)
  // Parse proto Timestamp object { seconds, nanos } → ISO string
  const parseProtoTimestamp = (val: unknown): string | undefined => {
    if (!val) return undefined;
    if (typeof val === 'string') return val;
    const obj = val as Record<string, unknown>;
    if (obj.seconds != null) return new Date(Number(obj.seconds) * 1000).toISOString();
    return undefined;
  };

  // Map proto string enum → numeric status
  const protoStatusMap: Record<string, number> = {
    QUOTATION_STATUS_UNSPECIFIED: 0,
    QUOTATION_STATUS_DRAFT: 1,
    QUOTATION_STATUS_SENT: 2,
    QUOTATION_STATUS_UNDER_REVIEW: 3,
    QUOTATION_STATUS_APPROVED: 4,
    QUOTATION_STATUS_REJECTED: 5,
    QUOTATION_STATUS_CONTRACTED: 6,
    QUOTATION_STATUS_CANCELLED: 7,
  };
  const parseProtoStatus = (val: unknown): number => {
    if (typeof val === 'number' && !isNaN(val)) return val;
    if (typeof val === 'string') {
      if (val in protoStatusMap) return protoStatusMap[val];
      const num = Number(val);
      if (!isNaN(num)) return num;
    }
    return 1;
  };

  // Normalize proto/snake_case fields → camelCase for RealQuotation
  const normalizeQuotation = (raw: Record<string, unknown>): RealQuotation => ({
    id: String(raw.id ?? ''),
    orgId: String(raw.orgId ?? raw.org_id ?? ''),
    creatorId: String(raw.creatorId ?? raw.creator_id ?? ''),
    customerId: String(raw.customerId ?? raw.customer_id ?? ''),
    customerName: raw.customerName != null ? String(raw.customerName) : raw.customer_name != null ? String(raw.customer_name) : undefined,
    customerEmail: raw.customerEmail != null ? String(raw.customerEmail) : raw.customer_email != null ? String(raw.customer_email) : undefined,
    customerPhone: raw.customerPhone != null ? String(raw.customerPhone) : raw.customer_phone != null ? String(raw.customer_phone) : undefined,
    ticketId: raw.ticketId != null ? String(raw.ticketId) : raw.ticket_id != null ? String(raw.ticket_id) : undefined,
    status: parseProtoStatus(raw.status),
    totalAmount: String(raw.totalAmount ?? raw.total_amount ?? '0'),
    taxAmount: String(raw.taxAmount ?? raw.tax_amount ?? '0'),
    currency: String(raw.currency ?? 'VND'),
    items: String(raw.items ?? '[]'),
    note: raw.note != null ? String(raw.note) : undefined,
    createdAt: parseProtoTimestamp(raw.createdAt ?? raw.created_at),
    updatedAt: parseProtoTimestamp(raw.updatedAt ?? raw.updated_at),
    marginPercent: raw.marginPercent != null ? String(raw.marginPercent) : raw.margin_percent != null ? String(raw.margin_percent) : undefined,
    netProfit: raw.netProfit != null ? String(raw.netProfit) : raw.net_profit != null ? String(raw.net_profit) : undefined,
  });

  const fetchRealQuotations = async () => {
    setLoadingRealQuotations(true);
    try {
      const params = new URLSearchParams({ page_size: '100' });
      const res = await fetch(`/api/sale/quotations/list?${params}`);
      const json = await res.json() as { quotations?: Record<string, unknown>[] };
      setRealQuotations(Array.isArray(json?.quotations) ? json.quotations.map(normalizeQuotation) : []);
    } catch {
      addToast('Lỗi tải danh sách báo giá.', { type: 'error' });
    } finally {
      setLoadingRealQuotations(false);
    }
  };

  // UC-9: Fetch real templates (ListQuotationTemplates API)
  const fetchRealTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch('/api/sale/quotations/templates');
      const json = await res.json() as { templates?: RealTemplate[] };
      setRealTemplates(Array.isArray(json?.templates) ? json.templates : []);
    } catch {
      addToast('Lỗi tải templates.', { type: 'error' });
    } finally {
      setLoadingTemplates(false);
    }
  };

  // UC-9: Update quotation status
  const [loadingUpdateStatus, setLoadingUpdateStatus] = useState<Record<string, boolean>>({});

  const handleSubmitForReview = async (quotationId: string) => {
    setLoadingUpdateStatus(prev => ({ ...prev, [quotationId]: true }));
    try {
      const res = await fetch('/api/sale/quotations/send-to-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotation_id: quotationId }),
      });
      const json = await res.json() as { quotation?: Record<string, unknown>; error?: string };
      if (!res.ok) { addToast(json.error ?? 'Gửi xét duyệt thất bại.', { type: 'error' }); return; }
      if (json.quotation) {
        const updated = normalizeQuotation(json.quotation);
        setRealQuotations(prev => prev.map(q => q.id === quotationId ? updated : q));
      } else {
        // BE trả 200 nhưng không kèm quotation → cập nhật status local + reload
        setRealQuotations(prev => prev.map(q => q.id === quotationId ? { ...q, status: 3 } : q));
        void fetchRealQuotations();
      }
      addToast('Báo giá đã chuyển sang Đang xét duyệt.', { type: 'success' });
    } catch {
      addToast('Lỗi kết nối khi cập nhật trạng thái.', { type: 'error' });
    } finally {
      setLoadingUpdateStatus(prev => ({ ...prev, [quotationId]: false }));
    }
  };

  // UC-9: Get Quote + Contract Status
  const handleGetContractStatus = async (quotationId: string) => {
    setLoadingContractStatus(prev => ({ ...prev, [quotationId]: true }));
    try {
      const res = await fetch(`/api/sale/quotations/contract-status?quotation_id=${encodeURIComponent(quotationId)}`);
      const json = await res.json() as ContractStatus;
      if (!res.ok) { addToast((json as { error?: string }).error ?? 'GetQuoteContractStatus thất bại.', { type: 'error' }); return; }
      setContractStatusMap(prev => ({ ...prev, [quotationId]: json }));
      addToast(`Contract: ${json.contract_status || 'N/A'} | ID: ${json.contract_id || 'chưa có'}`, { type: 'info' });
    } catch {
      addToast('Lỗi kết nối khi lấy contract status.', { type: 'error' });
    } finally {
      setLoadingContractStatus(prev => ({ ...prev, [quotationId]: false }));
    }
  };

  // UC-9: ConvertToContract
  const handleConvertToContract = async () => {
    if (!convertModalQuotation) return;
    if (!convertForm.title || !convertForm.start_date || !convertForm.end_date) {
      addToast('Vui lòng điền đầy đủ tiêu đề & ngày hợp đồng.', { type: 'error' });
      return;
    }
    setLoadingConvert(true);
    try {
      const res = await fetch('/api/sale/quotations/convert-to-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotation_id: convertModalQuotation.id,
          title: convertForm.title,
          start_date: convertForm.start_date,
          end_date: convertForm.end_date,
        }),
      });
      const json = await res.json() as { contract_id?: string; status?: string; error?: string };
      if (!res.ok) { addToast(json.error ?? 'ConvertToContract thất bại.', { type: 'error' }); return; }
      const contractId = json.contract_id ?? '';
      const contractStatus = json.status ?? '';
      addToast(`Đã tạo hợp đồng: ${contractId} (${contractStatus})`, { type: 'success' });
      // Cập nhật ngay contractStatusMap từ dữ liệu BE trả về (không cần refetch)
      setContractStatusMap(prev => ({
        ...prev,
        [convertModalQuotation.id]: {
          quotation: convertModalQuotation,
          contract_id: contractId,
          contract_status: contractStatus,
        },
      }));
      setConvertModalQuotation(null);
      setConvertForm({ title: '', start_date: '', end_date: '' });
    } catch {
      addToast('Lỗi kết nối khi chuyển hợp đồng.', { type: 'error' });
    } finally {
      setLoadingConvert(false);
    }
  };

  // UC-9: Create template
  const handleCreateTemplate = async () => {
    if (!newTemplateName) { addToast('Tên template không được để trống.', { type: 'error' }); return; }
    setSavingTemplate(true);
    try {
      const res = await fetch('/api/sale/quotations/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTemplateName,
          description: newTemplateDesc,
          category: newTemplateCategory,
          items: JSON.stringify(newTemplateItemRows.map(r => ({
            description: r.description,
            quantity: r.quantity,
            unit_price: r.unit_price,
            total_price: String(Math.round(parseFloat(r.quantity || '0') * parseFloat(r.unit_price || '0'))),
          }))),
        }),
      });
      const json = await res.json() as { template?: RealTemplate; error?: string };
      if (!res.ok) { addToast(json.error ?? 'Tạo template thất bại.', { type: 'error' }); return; }
      addToast('Đã tạo template mới!', { type: 'success' });
      setNewTemplateName(''); setNewTemplateDesc(''); setNewTemplateCategory(''); setNewTemplateItemRows([]);
      setShowCreateTemplateForm(false);
      void fetchRealTemplates();
    } catch {
      addToast('Lỗi kết nối khi tạo template.', { type: 'error' });
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleTemplateSelect = (template: Template) => {
    setQuotationItemRows(template.defaultItems.map(item => ({
      description: item.name,
      quantity: '1',
      unit_price: String(item.price),
    })));
    const total = template.defaultItems.reduce((s, i) => s + i.price, 0);
    setQuotationTotalAmount(String(total));
    setShowTemplates(false);
    setShowCreateModal(true);
  };

  const handleSubmitQuotation = async () => {
    if (!selectedCustomerId) {
      addToast('Vui lòng chọn Khách hàng trước khi tạo báo giá.', { type: 'error' });
      return;
    }
    setLoadingSubmitQuotation(true);
    try {
      const response = await fetch('/api/sale/quotations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedCustomerId,
          ticket_id: ticketId || undefined,
          template_id: selectedTemplateId || undefined,
          total_amount: quotationTotalAmount || '0',
          tax_amount: quotationTaxAmount || '0',
          currency: quotationCurrency,
          note: quotationNote || undefined,
          items: JSON.stringify(quotationItemRows.map(r => ({
            description: r.description,
            quantity: r.quantity,
            unit_price: r.unit_price,
            total_price: String(Math.round(parseFloat(r.quantity || '0') * parseFloat(r.unit_price || '0'))),
            metadata: {},
          }))),
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        addToast(json?.error || 'Tạo báo giá thất bại.', { type: 'error' });
        return;
      }
      const q = json.quotation as Record<string, unknown>;
      const newQid = String(q?.id ?? '');
      if (newQid) setQuotationId(newQid);
      const total = Number(quotationTotalAmount) || 0;
      const newQuote: Quote = {
        id: `Q-${new Date().getFullYear()}-${String(quotes.length + 1).padStart(3, '0')}`,
        customer: selectedClient,
        status: 'draft',
        dealType: 'one-deal',
        totalValue: `${total.toLocaleString()} ₫`,
        netProfit: '',
        createdDate: new Date().toISOString().slice(0, 10),
        services: quotationItemRows.map(r => r.description).filter(Boolean),
        quotationId: newQid,
        ticketId,
      };
      setQuotes(prev => [newQuote, ...prev]);
      // Cập nhật ngay Pipeline từ dữ liệu BE trả về (không cần refetch)
      if (json.quotation) {
        const realQ = normalizeQuotation(json.quotation as Record<string, unknown>);
        setRealQuotations(prev => [realQ, ...prev.filter(r => r.id !== realQ.id)]);
      }
      addToast(`Đã tạo báo giá: ${newQid}`, { type: 'success' });
      // Reset form và đóng modal
      setShowCreateModal(false);
      setSelectedClient('');
      setSelectedCustomerId('');
      setSelectedTemplateId('');
      setTicketId('');
      setSelectedTicketTitle('');
      setQuotationTotalAmount('');
      setQuotationTaxAmount('');
      setQuotationCurrency('VND');
      setQuotationNote('');
      setQuotationItemRows([]);
      setMainTab('pipeline');
    } catch {
      addToast('Lỗi kết nối khi tạo báo giá.', { type: 'error' });
    } finally {
      setLoadingSubmitQuotation(false);
    }
  };

  const handleCalculateMargin = async () => {
    if (!ticketId) {
      addToast('Vui lòng chọn Ticket trước.', { type: 'error' });
      return;
    }
    setLoadingMargin(true);
    try {
      const response = await fetch('/api/sale/quotations/calculate-margin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticketId,
          quotation_id: quotationId,
          total_amount: quotationTotalAmount || '0',
          items: JSON.stringify(quotationItemRows.map(r => ({
            description: r.description,
            quantity: r.quantity,
            unit_price: r.unit_price,
            total_price: String(Math.round(parseFloat(r.quantity || '0') * parseFloat(r.unit_price || '0'))),
            metadata: {},
          }))),
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        addToast(json?.error || 'CalculateMargin thất bại.', { type: 'error' });
        return;
      }
      setMarginResult({
        grossMarginPercent: String(json.gross_margin_percent ?? '0'),
        netProfit: String(json.net_profit ?? '0'),
        totalCost: String(json.total_cost ?? '0'),
      });
      addToast('CalculateMargin thành công.', { type: 'success' });
    } catch {
      addToast('Lỗi kết nối khi tính margin.', { type: 'error' });
    } finally {
      setLoadingMargin(false);
    }
  };

  // UC-9 helpers
  const quotationStatusLabels: Record<number, string> = {
    0: 'Không xác định',
    1: 'Draft',
    2: 'Đã gửi',
    3: 'Đang xét duyệt',
    4: 'Đã chấp nhận',
    5: 'Từ chối',
    6: 'Đã tạo HĐ',
    7: 'Đã hủy',
  };
  const quotationStatusColors: Record<number, string> = {
    0: 'bg-gray-100 text-gray-500',
    1: 'bg-gray-100 text-gray-600',
    2: 'bg-blue-100 text-blue-700',
    3: 'bg-amber-100 text-amber-700',
    4: 'bg-emerald-100 text-emerald-700',
    5: 'bg-red-100 text-red-700',
    6: 'bg-violet-100 text-violet-700',
    7: 'bg-orange-100 text-orange-700',
  };

  const filteredRealQuotations = realQuotations.filter(q => {
    const matchStatus = pipelineStatusFilter === 'all' || q.status === pipelineStatusFilter;
    const term = pipelineSearchQuery.toLowerCase();
    const customerName = q.customerName ?? customerLookup[q.customerId] ?? '';
    const customerEmail = q.customerEmail ?? '';
    const customerPhone = q.customerPhone ?? '';
    const matchSearch = !term || q.id.toLowerCase().includes(term) || (q.customerId ?? '').toLowerCase().includes(term) || customerName.toLowerCase().includes(term) || customerEmail.toLowerCase().includes(term) || customerPhone.toLowerCase().includes(term) || (q.note ?? '').toLowerCase().includes(term);
    return matchStatus && matchSearch;
  });

  // Sorting
  const sortedRealQuotations = useMemo(() => {
    const sorted = [...filteredRealQuotations];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'createdAt':
          cmp = (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
          break;
        case 'totalAmount':
          cmp = (Number(a.totalAmount) || 0) - (Number(b.totalAmount) || 0);
          break;
        case 'status':
          cmp = a.status - b.status;
          break;
        case 'marginPercent':
          cmp = (parseFloat(a.marginPercent ?? '0') || 0) - (parseFloat(b.marginPercent ?? '0') || 0);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [filteredRealQuotations, sortField, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedRealQuotations.length / PAGE_SIZE));
  const paginatedQuotations = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedRealQuotations.slice(start, start + PAGE_SIZE);
  }, [sortedRealQuotations, currentPage]);

  // Reset page when filter changes
  useEffect(() => { setCurrentPage(1); }, [pipelineStatusFilter, pipelineSearchQuery]);

  // Pipeline totals
  const pipelineTotals = useMemo(() => {
    const totalValue = filteredRealQuotations.reduce((s, q) => s + (Number(q.totalAmount) || 0), 0);
    const totalProfit = filteredRealQuotations.reduce((s, q) => s + (Number(q.netProfit) || 0), 0);
    return { totalValue, totalProfit };
  }, [filteredRealQuotations]);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }, [sortField]);

  const handleCopyId = useCallback((id: string) => {
    void navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }, []);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown className="w-3 h-3 text-gray-300" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">Quotes &amp; Contracts</span>
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Tạo báo giá, theo dõi ký kết &amp; quản lý duyệt chiết khấu đặc biệt.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setMainTab('templates'); void fetchRealTemplates(); }}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm text-gray-700 font-medium"
          >
            <BookOpen className="w-4 h-4" />
            Templates
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 text-white px-4 py-2.5 rounded-xl hover:from-violet-700 hover:to-blue-700 transition-all shadow-sm shadow-violet-200 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Tạo báo giá
          </button>
        </div>
      </div>

      {/* KPI Cards — real data with pipeline totals */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {([
          { label: 'Tổng báo giá', count: realQuotations.length, icon: <FileText className="w-4 h-4 text-blue-600" />, border: 'border-blue-100', bg: 'bg-blue-50' },
          { label: 'Draft', count: realQuotations.filter(q => q.status === 1).length, icon: <AlertCircle className="w-4 h-4 text-gray-500" />, border: 'border-gray-200', bg: 'bg-gray-50' },
          { label: 'Đã gửi KH', count: realQuotations.filter(q => q.status === 2).length, icon: <Send className="w-4 h-4 text-violet-600" />, border: 'border-violet-100', bg: 'bg-violet-50' },
          { label: 'Đã chấp nhận', count: realQuotations.filter(q => q.status === 4).length, icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />, border: 'border-emerald-100', bg: 'bg-emerald-50' },
        ] as { label: string; count: number; icon: React.ReactNode; border: string; bg: string }[]).map(kpi => (
          <div key={kpi.label} className={`rounded-2xl border ${kpi.border} ${kpi.bg} p-4 flex items-center gap-3`}>
            <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">{kpi.icon}</div>
            <div>
              <p className="text-xl font-bold text-gray-900 leading-tight">{loadingRealQuotations ? '…' : kpi.count}</p>
              <p className="text-xs text-gray-500">{kpi.label}</p>
            </div>
          </div>
        ))}
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 leading-tight truncate">{loadingRealQuotations ? '…' : pipelineTotals.totalValue.toLocaleString('vi-VN')}<span className="text-xs font-normal text-gray-400 ml-0.5">₫</span></p>
            <p className="text-xs text-gray-500">Pipeline Value</p>
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 leading-tight truncate">{loadingRealQuotations ? '…' : pipelineTotals.totalProfit.toLocaleString('vi-VN')}<span className="text-xs font-normal text-gray-400 ml-0.5">₫</span></p>
            <p className="text-xs text-gray-500">Tổng Profit</p>
          </div>
        </div>
      </div>

      {/* ─── UC-9: Quotes & Contracts Hub ────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Tab header */}
        <div className="flex items-center gap-1 px-5 pt-4 pb-0 border-b border-gray-100">
          <button
            onClick={() => { setMainTab('pipeline'); void fetchRealQuotations(); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${mainTab === 'pipeline' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <GitBranch className="w-4 h-4" />
            Pipeline Báo Giá
            {realQuotations.length > 0 && (
              <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{realQuotations.length}</span>
            )}
          </button>
          <button
            onClick={() => { setMainTab('templates'); void fetchRealTemplates(); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${mainTab === 'templates' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <BookOpen className="w-4 h-4" />
            Templates
            {realTemplates.length > 0 && (
              <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{realTemplates.length}</span>
            )}
          </button>
          <button
            onClick={() => setMainTab('contracts')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${mainTab === 'contracts' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <ScrollText className="w-4 h-4" />
            Hợp đồng
          </button>
          <div className="ml-auto pb-2">
            <button onClick={() => { if (mainTab === 'pipeline') void fetchRealQuotations(); else if (mainTab === 'templates') void fetchRealTemplates(); else setContractRefreshKey(k => k + 1); }}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Pipeline Tab */}
        {mainTab === 'pipeline' && (
          <div className="p-5">
            {/* Pipeline filters */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="flex items-center gap-0.5 p-1 bg-gray-100 rounded-lg overflow-x-auto">
                {([
                  { val: 'all' as const, label: 'Tất cả', count: realQuotations.length },
                  { val: 1, label: 'Draft', count: realQuotations.filter(q => q.status === 1).length },
                  { val: 2, label: 'Đã gửi', count: realQuotations.filter(q => q.status === 2).length },
                  { val: 3, label: 'Đang xét duyệt', count: realQuotations.filter(q => q.status === 3).length },
                  { val: 4, label: 'Đã chấp nhận', count: realQuotations.filter(q => q.status === 4).length },
                  { val: 5, label: 'Từ chối', count: realQuotations.filter(q => q.status === 5).length },
                  { val: 6, label: 'Đã ký HĐ', count: realQuotations.filter(q => q.status === 6).length },
                  { val: 7, label: 'Đã hủy', count: realQuotations.filter(q => q.status === 7).length },
                ] as { val: number | 'all'; label: string; count: number }[]).map(tab => (
                  <button key={String(tab.val)} onClick={() => setPipelineStatusFilter(tab.val)}
                    className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${pipelineStatusFilter === tab.val ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {tab.label}
                    {tab.count > 0 && <span className={`text-[9px] font-bold px-1 py-px rounded-full ${pipelineStatusFilter === tab.val ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>{tab.count}</span>}
                  </button>
                ))}
              </div>
              <div className="relative sm:ml-auto">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input value={pipelineSearchQuery} onChange={e => setPipelineSearchQuery(e.target.value)}
                  placeholder="Tìm ID, khách hàng, ghi chú..." className="pl-8 pr-8 py-1.5 text-xs border border-gray-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
                {pipelineSearchQuery && (
                  <button onClick={() => setPipelineSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Result count + pipeline value summary */}
            <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
              <span>{filteredRealQuotations.length} báo giá · Tổng giá trị: <span className="font-semibold text-gray-700">{pipelineTotals.totalValue.toLocaleString('vi-VN')} ₫</span></span>
              <span>Trang {currentPage}/{totalPages}</span>
            </div>

            {/* Pipeline table */}
            {loadingRealQuotations ? (
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="w-8 px-2 py-2.5" /><th className="px-4 py-2.5" /><th className="px-4 py-2.5" /><th className="px-4 py-2.5" /><th className="px-4 py-2.5" /><th className="px-4 py-2.5" /><th className="px-4 py-2.5" /><th className="px-4 py-2.5" /><th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</tbody>
                </table>
              </div>
            ) : filteredRealQuotations.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl">
                <GitBranch className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-500 font-medium">Không có báo giá nào</p>
                <p className="text-xs text-gray-400 mt-1">
                  {pipelineSearchQuery || pipelineStatusFilter !== 'all'
                    ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.'
                    : 'Tạo báo giá mới để bắt đầu theo dõi pipeline.'}
                </p>
                {(pipelineSearchQuery || pipelineStatusFilter !== 'all') && (
                  <button onClick={() => { setPipelineSearchQuery(''); setPipelineStatusFilter('all'); }}
                    className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium">
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-100 max-h-[60vh] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="w-8 px-2 py-2.5 bg-gray-50"></th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">#</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">Mã BG</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">Khách hàng</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 cursor-pointer select-none hover:text-gray-700"
                        onClick={() => handleSort('status')}>
                        <span className="inline-flex items-center gap-1">Trạng thái <SortIcon field="status" /></span>
                      </th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 cursor-pointer select-none hover:text-gray-700"
                        onClick={() => handleSort('totalAmount')}>
                        <span className="inline-flex items-center gap-1 justify-end">Tổng tiền <SortIcon field="totalAmount" /></span>
                      </th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 cursor-pointer select-none hover:text-gray-700"
                        onClick={() => handleSort('marginPercent')}>
                        <span className="inline-flex items-center gap-1 justify-end">Gross Margin <SortIcon field="marginPercent" /></span>
                      </th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">Net Profit</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 cursor-pointer select-none hover:text-gray-700"
                        onClick={() => handleSort('createdAt')}>
                        <span className="inline-flex items-center gap-1">Ngày tạo <SortIcon field="createdAt" /></span>
                      </th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedQuotations.map((q, rowIdx) => {
                      const contractInfo = contractStatusMap[q.id];
                      const isLoadingStatus = loadingContractStatus[q.id];
                      const grossMargin = q.marginPercent ?? '—';
                      const netProfit = q.netProfit
                        ? Number(q.netProfit).toLocaleString('vi-VN') + ' ₫'
                        : '—';
                      const total = q.totalAmount
                        ? Number(q.totalAmount).toLocaleString('vi-VN') + ' ₫'
                        : '—';
                      const isExpanded = expandedQuotationId === q.id;
                      let parsedItems: { description?: string; quantity?: string | number; unit_price?: string | number; total_price?: string | number }[] = [];
                      try { parsedItems = JSON.parse(q.items || '[]'); } catch { /* noop */ }
                      const rowNumber = (currentPage - 1) * PAGE_SIZE + rowIdx + 1;

                      return (
                        <React.Fragment key={q.id || Math.random()}>
                          <tr className={`hover:bg-gray-50/60 transition-colors group cursor-pointer ${isExpanded ? 'bg-blue-50/40' : ''} ${rowIdx % 2 === 1 ? 'bg-gray-50/30' : ''}`}
                            onClick={() => setExpandedQuotationId(isExpanded ? null : q.id)}>
                            <td className="px-2 py-3 text-center">
                              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform mx-auto ${isExpanded ? 'rotate-180 text-blue-600' : ''}`} />
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-400 font-medium">{rowNumber}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs text-gray-500">{(q.id || '—').slice(0, 12)}{q.id?.length > 12 ? '…' : ''}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleCopyId(q.id); }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
                                  title="Copy ID"
                                >
                                  {copiedId === q.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-800 text-xs" title={q.customerName ?? customerLookup[q.customerId] ?? q.customerId}>
                              <div className="group/customer relative inline-block max-w-[180px] cursor-help">
                                <div className="max-w-[160px] truncate font-medium">
                                  {q.customerName ?? customerLookup[q.customerId] ?? q.customerId ?? '-'}
                                </div>
                                <div className="pointer-events-none absolute left-0 top-full mt-1 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-lg z-20 opacity-0 invisible translate-y-1 transition-all duration-150 ease-out group-hover/customer:opacity-100 group-hover/customer:visible group-hover/customer:translate-y-0">
                                  <div className="text-xs font-semibold text-gray-900 truncate">{q.customerName ?? customerLookup[q.customerId] ?? 'Unknown Customer'}</div>
                                  <div className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">ID: {q.customerId || '-'}</div>
                                  <div className="mt-2 space-y-1.5 text-[11px] text-gray-600">
                                    <div className="flex items-center gap-1.5">
                                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                                      <span className="truncate">{q.customerEmail || 'Chua co email'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                                      <span className="truncate">{q.customerPhone || 'Chua co so dien thoai'}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${quotationStatusColors[q.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                {quotationStatusLabels[q.status] ?? q.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-xs font-semibold text-gray-800">{total}</td>
                            <td className="px-4 py-3 text-right text-xs">
                              {grossMargin !== '—' ? (
                                <span className={`font-bold ${parseFloat(grossMargin) < 15 ? 'text-red-600' : parseFloat(grossMargin) < 25 ? 'text-amber-600' : 'text-emerald-600'}`}>{grossMargin}%</span>
                              ) : <span className="text-gray-400">—</span>}
                            </td>
                            <td className="px-4 py-3 text-right text-xs text-emerald-700 font-medium">{netProfit}</td>
                            <td className="px-4 py-3 text-xs text-gray-400" title={q.createdAt ? new Date(q.createdAt).toLocaleString('vi-VN') : ''}>
                              {relativeTime(q.createdAt)}
                            </td>
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-1.5">
                                {/* Submit for Review — only for Draft */}
                                {q.status === 1 && (
                                  <button
                                    onClick={() => setConfirmAction({
                                      title: 'Xét duyệt báo giá',
                                      message: `Bạn có chắc muốn chuyển báo giá "${(q.id || '').slice(0, 8)}…" sang trạng thái Đang xét duyệt?`,
                                      onConfirm: () => { void handleSubmitForReview(q.id); setConfirmAction(null); },
                                    })}
                                    disabled={loadingUpdateStatus[q.id]}
                                    title="Chuyển sang Đang xét duyệt"
                                    className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 disabled:opacity-50 transition-colors"
                                  >
                                    {loadingUpdateStatus[q.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                    Xét duyệt
                                  </button>
                                )}
                                {/* GetQuoteContractStatus */}
                                <button
                                  onClick={() => void handleGetContractStatus(q.id)}
                                  disabled={isLoadingStatus}
                                  title="Kiểm tra trạng thái hợp đồng"
                                  className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 disabled:opacity-50 transition-colors"
                                >
                                  {isLoadingStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />}
                                  Contract
                                </button>
                                {/* ConvertToContract — only for approved / under review */}
                                {(q.status === 4 || q.status === 3) && (
                                  <button
                                    onClick={() => {
                                      const custName = q.customerName || customerLookup[q.customerId] || '';
                                      const autoTitle = custName ? `HĐ - ${custName}` : '';
                                      setConvertModalQuotation(q);
                                      setConvertForm({ title: autoTitle, start_date: '', end_date: '' });
                                    }}
                                    className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                                    title="Chuyển sang hợp đồng"
                                  >
                                    <ArrowRightCircle className="w-3 h-3" />
                                    Tạo HĐ
                                  </button>
                                )}
                              </div>
                              {/* Inline contract status info */}
                              {contractInfo && (
                                <div className="mt-1 text-[10px] text-gray-500 flex items-center gap-1">
                                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${contractInfo.contract_id ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                  {contractInfo.contract_id
                                    ? <><span className="font-mono">{(contractInfo.contract_id || '').slice(0, 8)}{(contractInfo.contract_id?.length ?? 0) > 8 ? '…' : ''}</span> · <span className="text-blue-600">{contractInfo.contract_status}</span></>
                                    : <span>Chưa có hợp đồng</span>
                                  }
                                </div>
                              )}
                            </td>
                          </tr>
                          {/* Expanded detail row */}
                          {isExpanded && (
                            <tr className="bg-blue-50/30">
                              <td colSpan={10} className="px-6 py-4">
                                {/* Status lifecycle stepper */}
                                <div className="flex items-center gap-0 mb-4 px-2">
                                  {LIFECYCLE_STEPS.map((step, si) => {
                                    const isCurrent = q.status === step.status;
                                    const isPast = (q.status !== 5 && q.status !== 7) && q.status > step.status;
                                    return (
                                      <React.Fragment key={step.status}>
                                        <div className="flex flex-col items-center gap-1 min-w-[56px]">
                                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                                            isCurrent
                                              ? 'border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-200'
                                              : isPast
                                                ? 'border-emerald-400 bg-emerald-400 text-white'
                                                : 'border-gray-200 bg-white text-gray-400'
                                          }`}>
                                            {isPast ? <Check className="w-3 h-3" /> : si + 1}
                                          </div>
                                          <span className={`text-[9px] font-medium ${isCurrent ? 'text-gray-800' : isPast ? 'text-emerald-600' : 'text-gray-400'}`}>
                                            {step.label}
                                          </span>
                                        </div>
                                        {si < LIFECYCLE_STEPS.length - 1 && (
                                          <div className={`flex-1 h-0.5 mt-[-14px] ${isPast ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                                        )}
                                      </React.Fragment>
                                    );
                                  })}
                                  {(q.status === 5 || q.status === 7) && (
                                    <div className="ml-3 flex items-center gap-1.5">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${q.status === 5 ? 'bg-red-500' : 'bg-orange-500'}`}>
                                        <X className="w-3 h-3" />
                                      </div>
                                      <span className={`text-[9px] font-medium ${q.status === 5 ? 'text-red-600' : 'text-orange-600'}`}>{q.status === 5 ? 'Từ chối' : 'Đã hủy'}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Left: Items */}
                                  <div>
                                    <p className="text-xs font-semibold text-gray-700 mb-2">Chi tiết hạng mục ({parsedItems.length})</p>
                                    {parsedItems.length === 0 ? (
                                      <p className="text-xs text-gray-400 italic">Không có hạng mục</p>
                                    ) : (
                                      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                                        <table className="w-full text-xs">
                                          <thead>
                                            <tr className="bg-gray-50">
                                              <th className="text-left px-3 py-1.5 text-gray-500 font-medium">Mô tả</th>
                                              <th className="text-center px-2 py-1.5 text-gray-500 font-medium">SL</th>
                                              <th className="text-right px-3 py-1.5 text-gray-500 font-medium">Đơn giá</th>
                                              <th className="text-right px-3 py-1.5 text-gray-500 font-medium">Thành tiền</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-50">
                                            {parsedItems.map((item, i) => (
                                              <tr key={i}>
                                                <td className="px-3 py-1.5 text-gray-700">{item.description || '—'}</td>
                                                <td className="px-2 py-1.5 text-center text-gray-600">{item.quantity ?? 1}</td>
                                                <td className="px-3 py-1.5 text-right text-gray-600">{Number(item.unit_price || 0).toLocaleString('vi-VN')}</td>
                                                <td className="px-3 py-1.5 text-right font-medium text-gray-800">{Number(item.total_price || 0).toLocaleString('vi-VN')}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                  {/* Right: Meta info */}
                                  <div className="space-y-2">
                                    <p className="text-xs font-semibold text-gray-700 mb-2">Thông tin chi tiết</p>
                                    <div className="bg-white rounded-lg border border-gray-100 p-3 space-y-2 text-xs">
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">ID đầy đủ:</span>
                                        <span className="font-mono text-gray-700 text-[10px] select-all">{q.id}</span>
                                      </div>
                                      {q.ticketId && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">Ticket ID:</span>
                                          <span className="font-mono text-blue-600 text-[10px]">{q.ticketId}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">Tiền tệ:</span>
                                        <span className="font-medium text-gray-700">{q.currency}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">Thuế:</span>
                                        <span className="font-medium text-gray-700">{Number(q.taxAmount || 0).toLocaleString('vi-VN')} ₫</span>
                                      </div>
                                      {q.note && (
                                        <div className="pt-1.5 border-t border-gray-100">
                                          <span className="text-gray-500">Ghi chú:</span>
                                          <p className="text-gray-700 mt-0.5">{q.note}</p>
                                        </div>
                                      )}
                                      {q.updatedAt && (
                                        <div className="flex justify-between pt-1.5 border-t border-gray-100">
                                          <span className="text-gray-500">Cập nhật:</span>
                                          <span className="text-gray-600">{new Date(q.updatedAt).toLocaleString('vi-VN')}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!loadingRealQuotations && filteredRealQuotations.length > PAGE_SIZE && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Hiển thị {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredRealQuotations.length)} / {filteredRealQuotations.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .reduce<(number | 'dots')[]>((acc, p, i, arr) => {
                      if (i > 0 && p - (arr[i - 1] ?? 0) > 1) acc.push('dots');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === 'dots' ? (
                        <span key={`dots-${i}`} className="px-1 text-xs text-gray-400">…</span>
                      ) : (
                        <button key={p} onClick={() => setCurrentPage(p)}
                          className={`w-7 h-7 rounded-md text-xs font-medium transition-colors ${currentPage === p ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                          {p}
                        </button>
                      )
                    )}
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Templates Tab */}
        {mainTab === 'templates' && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">Quản lý kho mẫu báo giá chuẩn của công ty.</p>
              <button
                onClick={() => setShowCreateTemplateForm(v => !v)}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Tạo template mới
              </button>
            </div>

            {/* Create template form */}
            {showCreateTemplateForm && (
              <div className="mb-5 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                <p className="text-xs font-semibold text-gray-700">Tạo template từ báo giá thành công</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Tên template <span className="text-red-400">*</span></label>
                    <input value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)}
                      placeholder="VD: Gói Bảo trì Server" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Danh mục</label>
                    <input value={newTemplateCategory} onChange={e => setNewTemplateCategory(e.target.value)}
                      placeholder="VD: maintenance" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Mô tả</label>
                    <input value={newTemplateDesc} onChange={e => setNewTemplateDesc(e.target.value)}
                      placeholder="Mô tả nội dung gói dịch vụ..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs text-gray-500">Hạng mục</label>
                      <span className="text-xs text-gray-400">{newTemplateItemRows.length} dòng</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {['Linh kiện', 'Công thợ', 'Phụ tùng', 'Dịch vụ', 'Vận chuyển', 'Khác'].map(label => (
                        <button key={label} type="button"
                          onClick={() => setNewTemplateItemRows(prev => [...prev, { description: label, quantity: '1', unit_price: '' }])}
                          className="px-2 py-0.5 text-xs rounded-full border border-blue-200 text-blue-700 bg-white hover:bg-blue-50 transition-colors">
                          + {label}
                        </button>
                      ))}
                      <button type="button" onClick={() => setNewTemplateItemRows(prev => [...prev, { description: '', quantity: '1', unit_price: '' }])}
                        className="px-2 py-0.5 text-xs rounded-full border border-dashed border-gray-300 text-gray-400 bg-white hover:bg-gray-50 transition-colors">
                        + Dòng trống
                      </button>
                    </div>
                    {newTemplateItemRows.length === 0 ? (
                      <p className="text-xs text-gray-400 italic py-1">Bấm nhãn bên trên để thêm hạng mục...</p>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="grid gap-x-1.5 text-xs text-gray-400 font-medium px-0.5" style={{ gridTemplateColumns: '1fr 52px 90px 72px 18px' }}>
                          <span>Mô tả</span><span className="text-center">SL</span><span>Đơn giá (₫)</span><span className="text-right">Thành tiền</span><span></span>
                        </div>
                        {newTemplateItemRows.map((row, idx) => {
                          const rowTotal = Math.round(parseFloat(row.quantity || '0') * parseFloat(row.unit_price || '0'));
                          return (
                            <div key={idx} className="grid gap-x-1.5 items-center" style={{ gridTemplateColumns: '1fr 52px 90px 72px 18px' }}>
                              <input type="text" value={row.description}
                                onChange={(e) => setNewTemplateItemRows(prev => prev.map((r, i) => i === idx ? { ...r, description: e.target.value } : r))}
                                placeholder="Mô tả hạng mục" className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
                              <input type="number" value={row.quantity} min="1"
                                onChange={(e) => setNewTemplateItemRows(prev => prev.map((r, i) => i === idx ? { ...r, quantity: e.target.value } : r))}
                                className="border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 text-center" />
                              <input type="text" value={row.unit_price}
                                onChange={(e) => setNewTemplateItemRows(prev => prev.map((r, i) => i === idx ? { ...r, unit_price: e.target.value } : r))}
                                placeholder="500000" className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
                              <span className="text-xs text-gray-600 font-medium text-right truncate">{rowTotal > 0 ? rowTotal.toLocaleString('vi-VN') : '—'}</span>
                              <button type="button"
                                onClick={() => setNewTemplateItemRows(prev => prev.filter((_, i) => i !== idx))}
                                className="text-red-400 hover:text-red-600 text-xs leading-none flex items-center justify-center">✕</button>
                            </div>
                          );
                        })}
                        <div className="grid gap-x-1.5 border-t border-gray-200 pt-1.5" style={{ gridTemplateColumns: '1fr 52px 90px 72px 18px' }}>
                          <span className="text-xs font-semibold text-gray-600 col-span-3 text-right">Tổng cộng:</span>
                          <span className="text-xs font-bold text-blue-800 text-right">
                            {newTemplateItemRows.reduce((s, r) => s + Math.round(parseFloat(r.quantity || '0') * parseFloat(r.unit_price || '0')), 0).toLocaleString('vi-VN')} ₫
                          </span>
                          <span></span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => void handleCreateTemplate()} disabled={savingTemplate || !newTemplateName}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    {savingTemplate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Lưu template
                  </button>
                  <button onClick={() => setShowCreateTemplateForm(false)}
                    className="px-4 py-2 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                    Hủy
                  </button>
                </div>
              </div>
            )}

            {/* Templates grid */}
            {loadingTemplates ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                <span className="ml-2 text-sm text-gray-500">Đang tải...</span>
              </div>
            ) : realTemplates.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl">
                <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-500 font-medium">Chưa có template nào</p>
                <p className="text-xs text-gray-400 mt-1">Tạo template để tăng tốc việc lập báo giá.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {realTemplates.map(tmpl => (
                  <div key={tmpl.id} className="border border-gray-100 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all bg-white">
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                        <FileText className="w-4.5 h-4.5 text-blue-500" style={{ width: '18px', height: '18px' }} />
                      </div>
                      <div className="flex items-center gap-1">
                        {tmpl.category && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">{tmpl.category}</span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tmpl.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {tmpl.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">{tmpl.name}</h3>
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">{tmpl.description || '(Chưa có mô tả)'}</p>
                    {(() => {
                      try {
                        const items = JSON.parse(tmpl.items || '[]') as { price?: number; unit_price?: number }[];
                        const count = items.length;
                        const total = items.reduce((s, it) => s + (it.price ?? it.unit_price ?? 0), 0);
                        if (count > 0) return (
                          <div className="flex items-center gap-2 mb-2 text-[10px] text-gray-400">
                            <span>{count} hạng mục</span>
                            <span>·</span>
                            <span className="font-medium text-gray-600">≈ {total.toLocaleString('vi-VN')} ₫</span>
                          </div>
                        );
                      } catch { /* noop */ }
                      return null;
                    })()}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          try {
                            const items = JSON.parse(tmpl.items || '[]') as { name?: string; description?: string; price?: number; unit_price?: number }[];
                            setQuotationItemRows(items.map(it => ({
                              description: it.name ?? it.description ?? '',
                              quantity: '1',
                              unit_price: String(it.price ?? it.unit_price ?? ''),
                            })));
                            const total = items.reduce((s, it) => s + (it.price ?? it.unit_price ?? 0), 0);
                            setQuotationTotalAmount(String(total));
                          } catch { /* invalid JSON items */ }
                          setShowCreateModal(true);
                        }}
                        className="flex-1 text-center text-xs py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors"
                      >
                        Dùng template này
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Contracts Tab */}
        {mainTab === 'contracts' && (
          <div className="p-5">
            <ContractsList
              key={contractRefreshKey}
              onViewContract={(c) => { setSelectedContract(c); setShowContractDetail(true); }}
              onSignContract={async (c) => {
                setContractModalLoading(true);
                try {
                  const result = await sendForSignature(c.id);
                  if (result?.signingUrl) {
                    addToast('Đã tạo yêu cầu ký. Link ký đã sẵn sàng (không tự động chuyển hướng).', { type: 'success' });
                  } else {
                    addToast('Đã gửi yêu cầu ký hợp đồng.', { type: 'success' });
                  }
                  setContractRefreshKey(k => k + 1);
                } finally { setContractModalLoading(false); }
              }}
              onRenewContract={(c) => { setSelectedContract(c); setShowContractDetail(true); }}
            />
          </div>
        )}
      </div>
      {convertModalQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setConvertModalQuotation(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ArrowRightCircle className="w-5 h-5 text-emerald-600" />
                <h2 className="text-sm font-bold text-gray-900">Convert Quotation → Hợp Đồng</h2>
              </div>
              <button onClick={() => setConvertModalQuotation(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                <p className="font-semibold text-gray-800 mb-1">Quotation ID:</p>
                <p className="font-mono text-blue-600">{convertModalQuotation.id}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tiêu đề hợp đồng <span className="text-red-400">*</span></label>
                <input value={convertForm.title} onChange={e => setConvertForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="VD: Hợp đồng bảo trì Q2-2026" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ngày bắt đầu <span className="text-red-400">*</span></label>
                  <input type="date" value={convertForm.start_date} onChange={e => setConvertForm(f => ({ ...f, start_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ngày kết thúc <span className="text-red-400">*</span></label>
                  <input type="date" value={convertForm.end_date} onChange={e => setConvertForm(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <button onClick={() => setConvertModalQuotation(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Hủy</button>
              <button onClick={() => void handleConvertToContract()} disabled={loadingConvert || !convertForm.title || !convertForm.start_date || !convertForm.end_date}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                {loadingConvert ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightCircle className="w-4 h-4" />}
                Tạo Hợp Đồng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal (legacy mock templates) */}
      {showTemplates && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300"
          onClick={() => setShowTemplates(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl border border-gray-100 max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Select a Template</h2>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                {mockTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className="text-left p-6 border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all group h-full flex flex-col items-start"
                  >
                    <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors mb-4">
                        <FileText className="w-6 h-6 text-gray-500 group-hover:text-blue-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{template.name}</h3>
                    <p className="text-sm text-gray-500 mb-4 flex-1">{template.description}</p>
                    <p className="text-blue-600 font-semibold">{template.price}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Quote Modal — UC-3 Quoting & Margin */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
                  <Calculator className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Tạo Báo Giá Mới</h2>
                  <p className="text-xs text-gray-400">Điền thông tin, xây dựng hạng mục &amp; kiểm tra margin</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex text-[10px] text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">ESC để đóng</span>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Client / Ticket Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Client selector */}
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Client</label>
                  {selectedClient ? (
                    <div className="flex items-center gap-2 px-3 py-2 border border-violet-300 rounded-md bg-violet-50">
                      <div className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-violet-800 truncate">{selectedClient}</span>
                        {selectedCustomerId && (
                          <span className="block text-[10px] text-violet-500 font-mono truncate">ID: {selectedCustomerId}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClient('');
                          setSelectedCustomerId('');
                          setCustomerSearch('');
                          setShowCustomerDropdown(false);
                          // reset ticket và tải lại toàn bộ danh sách
                          setTicketId('');
                          setSelectedTicketTitle('');
                          void fetchTickets();
                        }}
                        className="text-violet-400 hover:text-violet-600 text-xs leading-none flex-shrink-0"
                      >✕</button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        ref={customerSearchRef}
                        value={customerSearch}
                        onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); void fetchCustomers(e.target.value); }}
                        onFocus={() => setShowCustomerDropdown(true)}
                        onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 150)}
                        placeholder={loadingCustomers ? 'Đang tải...' : 'Tìm khách hàng...'}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                      {showCustomerDropdown && (
                        <div className="absolute z-20 top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg max-h-44 overflow-y-auto mt-0.5">
                          {loadingCustomers ? (
                            <div className="px-3 py-2 text-xs text-gray-400">Đang tải...</div>
                          ) : customers.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-gray-400">Không có dữ liệu</div>
                          ) : (
                            customers
                              .filter(c => !customerSearch || c.name.toLowerCase().includes(customerSearch.toLowerCase()) || (c.company && c.company.toLowerCase().includes(customerSearch.toLowerCase())))
                              .map(c => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onMouseDown={() => {
                                    setSelectedClient(c.name);
                                    setSelectedCustomerId(c.id);
                                    setCustomerSearch('');
                                    setShowCustomerDropdown(false);
                                    // reset ticket và load lại danh sách ticket theo client vừa chọn
                                    setTicketId('');
                                    setSelectedTicketTitle('');
                                    void fetchTickets(c.id);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-violet-50 border-b border-gray-100 last:border-0"
                                >
                                  <span className="font-medium text-gray-800">{c.name}</span>
                                  {c.company && c.company !== 'Individual' && <span className="text-gray-400 ml-1.5 text-xs">{c.company}</span>}
                                  {c.email && <span className="block text-xs text-gray-400">{c.email}</span>}
                                </button>
                              ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* Ticket selector */}
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ticket</label>
                  {ticketId ? (
                    <div className="flex items-center gap-2 px-3 py-2 border border-violet-300 rounded-md bg-violet-50">
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-mono text-violet-500">#{ticketId.slice(0, 8)}…</span>
                        {selectedTicketTitle && <span className="ml-1 text-sm text-violet-800 font-medium truncate">{selectedTicketTitle}</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => { setTicketId(''); setSelectedTicketTitle(''); setTicketSearch(''); setShowTicketDropdown(false); }}
                        className="text-violet-400 hover:text-violet-600 text-xs leading-none flex-shrink-0"
                      >✕</button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        ref={ticketSearchRef}
                        value={ticketSearch}
                        onChange={(e) => setTicketSearch(e.target.value)}
                        onFocus={() => setShowTicketDropdown(true)}
                        onBlur={() => setTimeout(() => setShowTicketDropdown(false), 150)}
                        placeholder={loadingTickets ? 'Đang tải...' : 'Tìm ticket...'}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                      {showTicketDropdown && (
                        <div className="absolute z-20 top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg max-h-44 overflow-y-auto mt-0.5">
                          {loadingTickets ? (
                            <div className="px-3 py-2 text-xs text-gray-400">Đang tải...</div>
                          ) : tickets.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-gray-400">Không có dữ liệu</div>
                          ) : (
                            tickets
                              .filter(t => !ticketSearch || t.title.toLowerCase().includes(ticketSearch.toLowerCase()) || t.id.toLowerCase().includes(ticketSearch.toLowerCase()))
                              .map(t => (
                                <button
                                  key={t.id}
                                  type="button"
                                  onMouseDown={() => {
                                    setTicketId(t.id);
                                    setSelectedTicketTitle(t.title);
                                    setTicketSearch('');
                                    setShowTicketDropdown(false);
                                    // auto chọn client tương ứng nếu chưa chọn
                                    if (t.creatorId && !selectedClient) {
                                      const match = customers.find(c => c.id === t.creatorId);
                                      if (match) {
                                        setSelectedClient(match.name);
                                        setSelectedCustomerId(match.id);
                                        void fetchTickets(match.id);
                                      }
                                    }
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-violet-50 border-b border-gray-100 last:border-0"
                                >
                                  <span className="font-mono text-xs text-gray-400 mr-1.5">#{t.id.slice(0, 8)}…</span>
                                  <span className="font-medium text-gray-800">{t.title}</span>
                                </button>
                              ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Template <span className="text-gray-400 font-normal">(tuỳ chọn)</span></label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => {
                      setSelectedTemplateId(e.target.value);
                      if (e.target.value) {
                        const tpl = realTemplates.find(t => t.id === e.target.value);
                        if (tpl?.items) {
                          try {
                            const parsed = JSON.parse(tpl.items) as Array<{description?: string; quantity?: number|string; unit_price?: number|string}>;
                            const rows = parsed.map(it => ({
                              description: String(it.description ?? ''),
                              quantity: String(it.quantity ?? '1'),
                              unit_price: String(it.unit_price ?? ''),
                            }));
                            setQuotationItemRows(rows);
                            setQuotationTotalAmount(String(rows.reduce((s, r) => s + Math.round(parseFloat(r.quantity || '0') * parseFloat(r.unit_price || '0')), 0)));
                          } catch { /* invalid JSON */ }
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                  >
                    <option value="">— Không dùng template —</option>
                    {realTemplates.filter(t => t.isActive).map(t => (
                      <option key={t.id} value={t.id}>{t.name}{t.category ? ` (${t.category})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tiền tệ &amp; Thuế</label>
                  <div className="flex gap-2">
                    <select
                      value={quotationCurrency}
                      onChange={(e) => setQuotationCurrency(e.target.value)}
                      className="w-24 flex-shrink-0 border border-gray-200 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                    >
                      <option value="VND">VND</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                    <input type="text" value={quotationTaxAmount} onChange={(e) => setQuotationTaxAmount(e.target.value)}
                      placeholder="Thuế (0)" className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-gray-600">Hạng mục báo giá</label>
                  <span className="text-xs text-gray-400">{quotationItemRows.length} dòng</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {['Linh kiện', 'Công thợ', 'Phụ tùng', 'Dịch vụ', 'Vận chuyển', 'Khác'].map(label => (
                    <button key={label} type="button"
                      onClick={() => setQuotationItemRows(prev => [...prev, { description: label, quantity: '1', unit_price: '' }])}
                      className="px-2 py-0.5 text-xs rounded-full border border-violet-200 text-violet-700 bg-white hover:bg-violet-100 transition-colors">
                      + {label}
                    </button>
                  ))}
                  <button type="button" onClick={() => setQuotationItemRows(prev => [...prev, { description: '', quantity: '1', unit_price: '' }])}
                    className="px-2 py-0.5 text-xs rounded-full border border-dashed border-gray-300 text-gray-400 bg-white hover:bg-gray-50 transition-colors">
                    + Dòng trống
                  </button>
                </div>
                {quotationItemRows.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-1">Bấm nhãn bên trên để thêm hạng mục...</p>
                ) : (
                  <div className="space-y-1.5">
                    <div className="grid gap-x-1.5 text-xs text-gray-400 font-medium px-0.5" style={{ gridTemplateColumns: '1fr 52px 90px 72px 18px' }}>
                      <span>Mô tả</span><span className="text-center">SL</span><span>Đơn giá (₫)</span><span className="text-right">Thành tiền</span><span></span>
                    </div>
                    {quotationItemRows.map((row, idx) => {
                      const rowTotal = Math.round(parseFloat(row.quantity || '0') * parseFloat(row.unit_price || '0'));
                      return (
                        <div key={idx} className="grid gap-x-1.5 items-center" style={{ gridTemplateColumns: '1fr 52px 90px 72px 18px' }}>
                          <input type="text" value={row.description}
                            onChange={(e) => setQuotationItemRows(prev => prev.map((r, i) => i === idx ? { ...r, description: e.target.value } : r))}
                            placeholder="Mô tả hạng mục" className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-violet-400" />
                          <input type="number" value={row.quantity} min="1"
                            onChange={(e) => {
                              const newRows = quotationItemRows.map((r, i) => i === idx ? { ...r, quantity: e.target.value } : r);
                              setQuotationItemRows(newRows);
                              setQuotationTotalAmount(String(newRows.reduce((s, r) => s + Math.round(parseFloat(r.quantity || '0') * parseFloat(r.unit_price || '0')), 0)));
                            }}
                            className="border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-violet-400 text-center" />
                          <input type="text" value={row.unit_price}
                            onChange={(e) => {
                              const newRows = quotationItemRows.map((r, i) => i === idx ? { ...r, unit_price: e.target.value } : r);
                              setQuotationItemRows(newRows);
                              setQuotationTotalAmount(String(newRows.reduce((s, r) => s + Math.round(parseFloat(r.quantity || '0') * parseFloat(r.unit_price || '0')), 0)));
                            }}
                            placeholder="500000" className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-violet-400" />
                          <span className="text-xs text-gray-600 font-medium text-right truncate">{rowTotal > 0 ? rowTotal.toLocaleString('vi-VN') : '—'}</span>
                          <button type="button"
                            onClick={() => {
                              const newRows = quotationItemRows.filter((_, i) => i !== idx);
                              setQuotationItemRows(newRows);
                              if (newRows.length > 0) setQuotationTotalAmount(String(newRows.reduce((s, r) => s + Math.round(parseFloat(r.quantity || '0') * parseFloat(r.unit_price || '0')), 0)));
                            }}
                            className="text-red-400 hover:text-red-600 text-xs leading-none flex items-center justify-center">✕</button>
                        </div>
                      );
                    })}
                    <div className="grid gap-x-1.5 border-t border-gray-200 pt-1.5" style={{ gridTemplateColumns: '1fr 52px 90px 72px 18px' }}>
                      <span className="text-xs font-semibold text-gray-600 col-span-3 text-right">Tổng cộng:</span>
                      <span className="text-xs font-bold text-violet-800 text-right">
                        {quotationItemRows.reduce((s, r) => s + Math.round(parseFloat(r.quantity || '0') * parseFloat(r.unit_price || '0')), 0).toLocaleString('vi-VN')} ₫
                      </span>
                      <span></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Margin Calculator */}
              <div className="bg-gradient-to-r from-violet-50 to-blue-50 border border-violet-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-violet-700 flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5" /> Kiểm tra Gross Margin
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleCalculateMargin()}
                    disabled={loadingMargin || !ticketId || quotationItemRows.length === 0}
                    className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 transition-colors font-medium"
                  >
                    {loadingMargin ? <Loader2 className="w-3 h-3 animate-spin" /> : <Calculator className="w-3 h-3" />}
                    Tính margin
                  </button>
                </div>
                {!ticketId && <p className="text-[10px] text-gray-400 italic">Chọn Ticket để kích hoạt tính năng này.</p>}
                {marginResult && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="bg-white rounded-lg p-2 text-center border border-violet-100">
                      <p className="text-[10px] text-gray-500 mb-0.5">Gross Margin</p>
                      <p className={`text-sm font-bold ${parseFloat(marginResult.grossMarginPercent) < 15 ? 'text-red-600' : parseFloat(marginResult.grossMarginPercent) < 25 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {marginResult.grossMarginPercent}%
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center border border-violet-100">
                      <p className="text-[10px] text-gray-500 mb-0.5">Tổng chi phí</p>
                      <p className="text-sm font-bold text-gray-800">{Number(marginResult.totalCost).toLocaleString('vi-VN')} ₫</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center border border-violet-100">
                      <p className="text-[10px] text-gray-500 mb-0.5">Lợi nhuận ròng</p>
                      <p className="text-sm font-bold text-emerald-700">{Number(marginResult.netProfit).toLocaleString('vi-VN')} ₫</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ghi chú</label>
                <textarea value={quotationNote} onChange={(e) => setQuotationNote(e.target.value)}
                  placeholder="Ghi chú cho báo giá, điều kiện thanh toán, thời gian bảo hành..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
                <p className="text-[10px] text-gray-400 mt-0.5">{quotationNote.length}/500 ký tự</p>
              </div>

            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/60">
              <div className="text-xs text-gray-400">
                {selectedCustomerId && quotationItemRows.length > 0 && (
                  <span>Tổng: <span className="font-semibold text-gray-700">{Number(quotationTotalAmount || 0).toLocaleString('vi-VN')} ₫</span></span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => void handleSubmitQuotation()}
                  disabled={loadingSubmitQuotation || !selectedCustomerId || !quotationTotalAmount}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-medium rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
                >
                  {loadingSubmitQuotation ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} Tạo Báo Giá
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contract Detail Modal */}
      <ContractDetailModal
        open={showContractDetail}
        contract={selectedContract}
        onClose={() => { setShowContractDetail(false); setSelectedContract(null); }}
        onFinalize={async (c) => {
          setContractModalLoading(true);
          try {
            await finalizeContract(c.id);
            setContractRefreshKey(k => k + 1);
          } finally { setContractModalLoading(false); }
        }}
        onSendForSignature={async (c) => {
          setContractModalLoading(true);
          try {
            const result = await sendForSignature(c.id);
            if (result?.signingUrl) {
              addToast('Đã tạo yêu cầu ký. Link ký đã sẵn sàng (không tự động chuyển hướng).', { type: 'success' });
            } else {
              addToast('Đã gửi yêu cầu ký hợp đồng.', { type: 'success' });
            }
            setContractRefreshKey(k => k + 1);
          } finally { setContractModalLoading(false); }
        }}
        onActivate={async (c) => {
          setContractModalLoading(true);
          try {
            await activateContract(c.id);
            setShowContractDetail(false);
            setContractRefreshKey(k => k + 1);
          } finally { setContractModalLoading(false); }
        }}
        onCancel={async (c) => {
          setSelectedContract(c as Contract);
          setShowContractDetail(false);
          setShowCancelContract(true);
        }}
        onRenew={async (c, newEndDate) => {
          setContractModalLoading(true);
          try {
            await approveRenewal(c.id, newEndDate);
            setShowContractDetail(false);
            setContractRefreshKey(k => k + 1);
          } finally { setContractModalLoading(false); }
        }}
        onUploadRevised={async (c, fileType, fileId) => {
          setContractModalLoading(true);
          try {
            await uploadRevisedContract(c.id, fileType, fileId);
            setContractRefreshKey(k => k + 1);
          } finally { setContractModalLoading(false); }
        }}
        onLoadTimeline={async (contractId) => {
          return await getContractTimeline(contractId);
        }}
        isLoading={contractModalLoading}
      />

      {/* Cancel Contract Modal */}
      <CancelContractModal
        open={showCancelContract}
        contractId={selectedContract?.id || ''}
        contractTitle={selectedContract?.title}
        onClose={() => { setShowCancelContract(false); setSelectedContract(null); }}
        onConfirm={async (contractId, reason) => {
          setContractModalLoading(true);
          try {
            const result = await cancelContract(contractId, reason);
            if (result) {
              setShowCancelContract(false);
              setSelectedContract(null);
              setContractRefreshKey(k => k + 1);
            }
          } finally { setContractModalLoading(false); }
        }}
        isLoading={contractModalLoading}
      />

      {/* Confirm Action Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setConfirmAction(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">{confirmAction.title}</h3>
              <p className="text-xs text-gray-500">{confirmAction.message}</p>
            </div>
            <div className="px-5 pb-5 flex items-center gap-2">
              <button onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                Hủy
              </button>
              <button onClick={confirmAction.onConfirm}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition-colors">
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
