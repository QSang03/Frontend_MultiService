'use client';

import { useState, useEffect, useRef } from 'react';
import { FileText, Plus, Send, Clock, AlertCircle, X, Calculator, Loader2, SendHorizontal, Eye, Activity, AlertTriangle, CheckCircle2, TrendingUp, Search, Users, Tag } from 'lucide-react';
import { useToast } from '@/components/ui';

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
type ApprovalStep = { stepName?: string; approver?: string; status?: string };
type TicketActivityItem = { id?: string; actorId?: string; actorName?: string; action?: string; detail?: string; createdAt?: string };
type QuotationItemRow = { description: string; quantity: string; unit_price: string };
type CustomerOption = { id: string; name: string; company: string; email?: string };
type TicketOption = { id: string; title: string; status: number; creatorId?: string };

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
  const [selectedDealType, setSelectedDealType] = useState<'one-deal' | 'long-term'>('one-deal');
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
  const [loadingRequestReview, setLoadingRequestReview] = useState(false);
  const [loadingSendToClient, setLoadingSendToClient] = useState(false);
  const [loadingApproval, setLoadingApproval] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [approvalSteps, setApprovalSteps] = useState<ApprovalStep[]>([]);
  const [ticketActivities, setTicketActivities] = useState<TicketActivityItem[]>([]);
  const [reviewNote, setReviewNote] = useState('');
  const [statusFilter, setStatusFilter] = useState<Quote['status'] | 'all'>('all');
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  // Customer selector
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
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
      setCustomers(Array.isArray(json?.customers) ? json.customers : []);
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
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowCreateModal(false); };
    if (showCreateModal) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showCreateModal]);

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
    if (!selectedClient || !ticketId) {
      addToast('Vui lòng chọn Client và chọn Ticket trước khi tạo báo giá.', { type: 'error' });
      return;
    }
    setLoadingSubmitQuotation(true);
    try {
      const response = await fetch('/api/sale/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticketId,
          total_amount: quotationTotalAmount || '0',
          tax_amount: quotationTaxAmount || '0',
          currency: 'VND',
          note: quotationNote,
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
        addToast(json?.error || 'SubmitQuotation thất bại.', { type: 'error' });
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
        dealType: selectedDealType,
        totalValue: `${total.toLocaleString()} ₫`,
        netProfit: '',
        createdDate: new Date().toISOString().slice(0, 10),
        services: quotationItemRows.map(r => r.description).filter(Boolean),
        quotationId: newQid,
        ticketId,
      };
      setQuotes(prev => [newQuote, ...prev]);
      addToast(`Đã tạo báo giá: ${newQid}`, { type: 'success' });
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

  const handleRequestInternalReview = async () => {
    if (!ticketId || !quotationId) {
      addToast('Cần tạo báo giá trước khi xin duyệt.', { type: 'error' });
      return;
    }
    setLoadingRequestReview(true);
    try {
      const response = await fetch('/api/sale/quotations/request-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: ticketId, quotation_id: quotationId, note: reviewNote }),
      });
      const json = await response.json();
      if (!response.ok) {
        addToast(json?.error || 'RequestInternalReview thất bại.', { type: 'error' });
        return;
      }
      addToast('Đã gửi yêu cầu duyệt nội bộ thành công.', { type: 'success' });
      setReviewNote('');
    } catch {
      addToast('Lỗi kết nối khi xin duyệt.', { type: 'error' });
    } finally {
      setLoadingRequestReview(false);
    }
  };

  const handleSendQuotationToClient = async () => {
    if (!quotationId) {
      addToast('Cần tạo báo giá trước khi gửi cho khách.', { type: 'error' });
      return;
    }
    setLoadingSendToClient(true);
    try {
      const response = await fetch('/api/sale/quotations/send-to-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotation_id: quotationId }),
      });
      const json = await response.json();
      if (!response.ok) {
        addToast(json?.error || 'SendQuotationToClient thất bại.', { type: 'error' });
        return;
      }
      setQuotes(prev => prev.map(q => q.quotationId === quotationId ? { ...q, status: 'sent' } : q));
      addToast('Đã gửi báo giá cho khách hàng thành công.', { type: 'success' });
    } catch {
      addToast('Lỗi kết nối khi gửi báo giá.', { type: 'error' });
    } finally {
      setLoadingSendToClient(false);
    }
  };

  const handleGetApprovalWorkflow = async () => {
    if (!ticketId) {
      addToast('Vui lòng chọn Ticket trước.', { type: 'error' });
      return;
    }
    setLoadingApproval(true);
    try {
      const response = await fetch(`/api/sale/quotations/approval-workflow?ticket_id=${encodeURIComponent(ticketId)}`);
      const json = await response.json();
      if (!response.ok) {
        addToast(json?.error || 'GetTicketApprovalWorkflow thất bại.', { type: 'error' });
        return;
      }
      const steps = Array.isArray(json?.steps) ? json.steps as ApprovalStep[] : [];
      setApprovalSteps(steps);
      addToast(`ApprovalWorkflow: ${steps.length} bước.`, { type: 'success' });
    } catch {
      addToast('Lỗi kết nối khi tải approval workflow.', { type: 'error' });
    } finally {
      setLoadingApproval(false);
    }
  };

  const handleListActivities = async () => {
    if (!ticketId) {
      addToast('Vui lòng chọn Ticket trước.', { type: 'error' });
      return;
    }
    setLoadingActivities(true);
    try {
      const response = await fetch(`/api/sale/quotations/activities?ticket_id=${encodeURIComponent(ticketId)}&page_size=20`);
      const json = await response.json();
      if (!response.ok) {
        addToast(json?.error || 'ListTicketActivities thất bại.', { type: 'error' });
        return;
      }
      const activities = Array.isArray(json?.activities) ? json.activities as TicketActivityItem[] : [];
      setTicketActivities(activities);
      addToast(`Loaded ${activities.length} activities (total: ${json.total_count ?? '?'}).`, { type: 'success' });
    } catch {
      addToast('Lỗi kết nối khi tải activities.', { type: 'error' });
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleApproveQuotation = async (quote: Quote) => {
    if (!quote.quotationId || !quote.ticketId) {
      addToast('Quotation này chưa có ID backend để approve.', { type: 'error' });
      return;
    }

    addToast('Đang ApproveQuotation và chuyển Ticket sang OPEN...', { type: 'info' });
    try {
      const approveRes = await fetch('/api/admin/tickets/quotations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept', quotation_id: quote.quotationId }),
      });

      const approveJson = await approveRes.json();
      if (!approveRes.ok) {
        addToast(approveJson?.error || 'ApproveQuotation thất bại.', { type: 'error' });
        return;
      }

      const updateTicketRes = await fetch('/api/admin/tickets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', ticket_id: quote.ticketId, status: 3 }),
      });

      if (!updateTicketRes.ok) {
        const updateJson = await updateTicketRes.json().catch(() => ({}));
        addToast(updateJson?.error || 'Approved nhưng không update được ticket OPEN.', { type: 'error' });
      }

      setQuotes((prev) => prev.map((item) => (item.id === quote.id ? { ...item, status: 'approved' } : item)));
      addToast('Quotation đã được approve, ticket đã chuyển OPEN.', { type: 'success' });
    } catch {
      addToast('Lỗi kết nối khi approve quotation.', { type: 'error' });
    }
  };

  const getStatusBadge = (status: Quote['status']) => {
    switch (status) {
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <Send className="w-3 h-3" />
            Đã gửi
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            <FileText className="w-3 h-3" />
            Draft
          </span>
        );
      case 'approval':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
            <AlertCircle className="w-3 h-3" />
            Chờ duyệt
          </span>
        );
      case 'internal-review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            <Clock className="w-3 h-3" />
            Chờ nội bộ
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-3 h-3" />
            Đã duyệt
          </span>
        );
    }
  };

  const getDealTypeBadge = (type: Quote['dealType']) => {
    return type === 'long-term' ? (
      <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">Long-term</span>
    ) : (
      <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-700 font-medium">One-deal</span>
    );
  };

  const filteredQuotes = quotes.filter(q => {
    const matchStatus = statusFilter === 'all' || q.status === statusFilter;
    const q2 = searchQuery.toLowerCase();
    const matchSearch = !q2 || q.id.toLowerCase().includes(q2) || q.customer.toLowerCase().includes(q2) || q.services.some(s => s.toLowerCase().includes(q2));
    return matchStatus && matchSearch;
  });

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
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm text-gray-700 font-medium"
          >
            <FileText className="w-4 h-4" />
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 leading-tight">{quotes.length}</p>
            <p className="text-xs text-gray-500">Tổng báo giá</p>
          </div>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 leading-tight">{quotes.filter(q => q.status === 'approval' || q.status === 'internal-review').length}</p>
            <p className="text-xs text-gray-500">Chờ duyệt</p>
          </div>
        </div>
        <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
            <Send className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 leading-tight">{quotes.filter(q => q.status === 'sent').length}</p>
            <p className="text-xs text-gray-500">Đã gửi KH</p>
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 leading-tight">{quotes.filter(q => q.status === 'approved').length}</p>
            <p className="text-xs text-gray-500">Đã duyệt</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-0.5 p-1 bg-gray-100 rounded-xl overflow-x-auto flex-shrink-0">
          {(['all', 'draft', 'sent', 'internal-review', 'approval', 'approved'] as const).map((key) => {
            const labels: Record<string, string> = { all: 'Tất cả', draft: 'Draft', sent: 'Đã gửi', 'internal-review': 'Chờ nội bộ', approval: 'Chờ duyệt', approved: 'Đã duyệt' };
            const count = key === 'all' ? quotes.length : quotes.filter(q => q.status === key).length;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  statusFilter === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {labels[key]}
                <span className={`tabular-nums text-[10px] px-1.5 py-0.5 rounded-full ${
                  statusFilter === key ? 'bg-violet-100 text-violet-700 font-bold' : 'bg-gray-200 text-gray-500'
                }`}>{count}</span>
              </button>
            );
          })}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm mã, khách hàng, dịch vụ..."
            className="pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl w-60 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
          />
        </div>
      </div>

      {/* Quotes List */}
      <div className="space-y-3">
        {filteredQuotes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-100">
            <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">Không tìm thấy báo giá nào</p>
            <p className="text-xs text-gray-400 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          filteredQuotes.map((quote) => (
            <div
              key={quote.id}
              className={`bg-white rounded-2xl border border-gray-100 border-l-4 overflow-hidden hover:shadow-md transition-all duration-200 ${
                quote.status === 'approved' ? 'border-l-emerald-500' :
                quote.status === 'approval' || quote.status === 'internal-review' ? 'border-l-amber-400' :
                quote.status === 'sent' ? 'border-l-blue-500' :
                'border-l-gray-300'
              }`}
            >
              <div className="p-5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    quote.status === 'approved' ? 'bg-emerald-100' :
                    quote.status === 'approval' || quote.status === 'internal-review' ? 'bg-amber-100' :
                    'bg-blue-100'
                  }`}>
                    <FileText className={`w-5 h-5 ${
                      quote.status === 'approved' ? 'text-emerald-600' :
                      quote.status === 'approval' || quote.status === 'internal-review' ? 'text-amber-600' :
                      'text-blue-600'
                    }`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="font-bold text-gray-900">{quote.id}</span>
                      {getStatusBadge(quote.status)}
                      {getDealTypeBadge(quote.dealType)}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-700 mb-1">
                      <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="font-medium truncate">{quote.customer}</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">Ngày tạo: {quote.createdDate}</p>
                    <div className="flex flex-wrap gap-1">
                      {quote.services.map((service, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          <Tag className="w-2.5 h-2.5" />
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 flex flex-col items-end">
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Giá trị</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5">{quote.totalValue}</p>
                  <p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5 justify-end">
                    <TrendingUp className="w-3 h-3" />
                    {quote.netProfit}
                  </p>
                  {quote.status === 'approval' && (
                    <span className="mt-1.5 text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-200">15% Discount</span>
                  )}
                  {quote.status === 'approved' && (
                    <span className="mt-1.5 text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-200">✓ Approved</span>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <button className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                      <Eye className="w-3 h-3" />
                      Chi tiết
                    </button>
                    {quote.status === 'draft' ? (
                      <button className="inline-flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        <Send className="w-3 h-3" />
                        Gửi E-Sign
                      </button>
                    ) : quote.status === 'sent' && quote.quotationId ? (
                      <button
                        onClick={() => handleApproveQuotation(quote)}
                        className="inline-flex items-center gap-1.5 text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        KH Duyệt
                      </button>
                    ) : quote.status === 'approval' || quote.status === 'internal-review' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg font-medium">
                        <Clock className="w-3 h-3" />
                        Chờ duyệt
                      </span>
                    ) : quote.status === 'approved' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Ticket OPEN
                      </span>
                    ) : (
                      <button className="inline-flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        <Send className="w-3 h-3" />
                        Gửi E-Sign
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300"
          onClick={() => setShowTemplates(false)}
        >
          {/* Detailed mockTemplates closer to Screenshot 1 if needed, but current data seems fine.
              The screenshot 1 has "Standard Maintenance", "Office Setup Pack", "Cloud Migration", "PC Refresh".
              My mock data has these.
              Prices:
              - 5,000,000 / mo
              - 20,000,000
              - 15,000,000
              - Call for Quote
              My mock data has these.
          */}
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
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
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Client / Ticket Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Client selector */}
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Client</label>
                  {selectedClient ? (
                    <div className="flex items-center gap-2 px-3 py-2 border border-violet-300 rounded-md bg-violet-50">
                      <span className="flex-1 text-sm font-medium text-violet-800 truncate">{selectedClient}</span>
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
                  <label className="block text-xs font-medium text-gray-600 mb-1">Engagement Model</label>
                  <div className="flex gap-4 mt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="radio" name="dealType" className="w-4 h-4 text-violet-600" checked={selectedDealType === 'one-deal'} onChange={() => setSelectedDealType('one-deal')} />
                      One-deal
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="radio" name="dealType" className="w-4 h-4 text-violet-600" checked={selectedDealType === 'long-term'} onChange={() => setSelectedDealType('long-term')} />
                      Long-term
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Thuế (VNĐ)</label>
                  <input type="text" value={quotationTaxAmount} onChange={(e) => setQuotationTaxAmount(e.target.value)}
                    placeholder="0" className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
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

              {/* Note */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ghi chú</label>
                <input type="text" value={quotationNote} onChange={(e) => setQuotationNote(e.target.value)}
                  placeholder="Ghi chú cho báo giá..." className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button onClick={() => void handleSubmitQuotation()} disabled={loadingSubmitQuotation || !quotationTotalAmount}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-violet-300 text-violet-800 bg-violet-100 hover:bg-violet-200 disabled:opacity-50">
                  {loadingSubmitQuotation ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />} SubmitQuotation
                </button>
                <button onClick={() => void handleCalculateMargin()} disabled={loadingMargin || !quotationTotalAmount}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-emerald-300 text-emerald-800 bg-emerald-100 hover:bg-emerald-200 disabled:opacity-50">
                  {loadingMargin ? <Loader2 className="w-3 h-3 animate-spin" /> : <Calculator className="w-3 h-3" />} CalculateMargin
                </button>
                <button onClick={() => void handleSendQuotationToClient()} disabled={loadingSendToClient || !quotationId}
                  title={!quotationId ? 'Cần tạo báo giá trước' : undefined}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-blue-300 text-blue-800 bg-blue-100 hover:bg-blue-200 disabled:opacity-50">
                  {loadingSendToClient ? <Loader2 className="w-3 h-3 animate-spin" /> : <SendHorizontal className="w-3 h-3" />} SendQuotationToClient
                </button>
              </div>

              {/* Margin Result */}
              {marginResult && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-xs font-semibold text-emerald-800 mb-2">Margin Result</p>
                  <div className="grid grid-cols-3 gap-3 text-xs text-emerald-700">
                    <div>
                      <p className="text-gray-500">Gross Margin</p>
                      <p className={`text-2xl font-bold ${parseFloat(marginResult.grossMarginPercent) < 15 ? 'text-red-600' : 'text-emerald-700'}`}>{marginResult.grossMarginPercent}%</p>
                    </div>
                    <div><p className="text-gray-500">Net Profit</p><p className="font-semibold text-sm">{Number(marginResult.netProfit).toLocaleString()} ₫</p></div>
                    <div><p className="text-gray-500">Total Cost</p><p className="font-semibold text-sm">{Number(marginResult.totalCost).toLocaleString()} ₫</p></div>
                  </div>
                  {parseFloat(marginResult.grossMarginPercent) < 15 && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-red-600"><AlertTriangle className="w-3 h-3" /> Margin dưới ngưỡng (15%). Cần xin duyệt nội bộ.</div>
                  )}
                </div>
              )}

              {/* Internal Review */}
              {quotationId && (
                <div className="rounded-lg border border-violet-200 bg-violet-50/30 p-3 space-y-2">
                  <p className="text-xs font-semibold text-violet-800">Quotation ID: <span className="font-mono text-violet-600">{quotationId}</span></p>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Ghi chú xin duyệt</label>
                      <input type="text" value={reviewNote} onChange={(e) => setReviewNote(e.target.value)}
                        placeholder="Margin thấp do khách VIP..." className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500" />
                    </div>
                    <button onClick={() => void handleRequestInternalReview()} disabled={loadingRequestReview}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-amber-300 text-amber-800 bg-amber-100 hover:bg-amber-200 disabled:opacity-50 whitespace-nowrap">
                      {loadingRequestReview ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3" />} RequestInternalReview
                    </button>
                  </div>
                </div>
              )}

              {/* Workflow & Activities */}
              <div className="flex flex-wrap gap-2">
                <button onClick={() => void handleGetApprovalWorkflow()} disabled={loadingApproval}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-indigo-300 text-indigo-800 bg-indigo-100 hover:bg-indigo-200 disabled:opacity-50">
                  {loadingApproval ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />} GetApprovalWorkflow
                </button>
                <button onClick={() => void handleListActivities()} disabled={loadingActivities}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50">
                  {loadingActivities ? <Loader2 className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />} ListActivities
                </button>
              </div>

              {approvalSteps.length > 0 && (
                <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                  <p className="text-xs font-semibold text-indigo-800 mb-2">Approval Workflow</p>
                  <div className="space-y-1.5">
                    {approvalSteps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${step.status === 'APPROVED' ? 'bg-green-200 text-green-800' : step.status === 'REJECTED' ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-600'}`}>{idx + 1}</span>
                        <span className="font-medium text-gray-800">{step.stepName || `Step ${idx + 1}`}</span>
                        <span className="text-gray-400">—</span>
                        <span className="text-gray-600">{step.approver || '?'}</span>
                        <span className={`ml-auto px-1.5 py-0.5 rounded text-[10px] font-semibold ${step.status === 'APPROVED' ? 'bg-green-100 text-green-700' : step.status === 'REJECTED' ? 'bg-red-100 text-red-700' : step.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>{step.status || 'UNKNOWN'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {ticketActivities.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <p className="text-xs font-semibold text-gray-800 mb-2">Ticket Activities</p>
                  <div className="space-y-1.5">
                    {ticketActivities.map((act, idx) => (
                      <div key={act.id || idx} className="flex items-start gap-2 text-xs">
                        <Activity className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="font-medium text-gray-800">{act.actorName || act.actorId || 'System'}</span>{' '}
                          <span className="text-gray-600">{act.action || act.detail || 'activity'}</span>
                          {act.createdAt && <span className="text-gray-400 ml-1">{new Date(act.createdAt).toLocaleString('vi-VN')}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}


            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/60">
              <p className="text-xs text-gray-400">
                {quotationId
                  ? <span className="inline-flex items-center gap-1 text-violet-600 font-medium"><CheckCircle2 className="w-3.5 h-3.5" /> Quotation đã tạo</span>
                  : 'Chưa có quotation nào được tạo'}
              </p>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-5 py-2 text-sm font-medium rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
