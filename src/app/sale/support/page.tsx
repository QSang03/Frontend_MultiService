'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, Plus, MoreVertical, Paperclip, Send, 
  Clock, CheckCircle2 
} from 'lucide-react';
import CreateTicketModal from '@/components/CreateTicketModal';

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

interface Ticket {
  id: string;
  code: string;
  orgId?: string;
  categoryId?: string;
  serviceId?: string;
  title: string;
  client: string;
  status: 'DRAFT' | 'AGREED' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'High' | 'Medium' | 'Low' | 'Critical';
  attributes?: string;
  slaHours?: number;
  assetId?: string;
  date: string;
  dueTime?: string;
  slaStatus?: 'Met' | 'Breached' | 'Warning';
  assignee?: string;
}

interface Message {
  id: string;
  sender: string;
  role: 'Client' | 'Sale' | 'Tech' | 'System';
  content: string;
  time: string;
  isMe?: boolean;
}

const mockTickets: Ticket[] = [
  {
    id: '1',
    code: 'TICK-992',
    title: 'Server Downtime - Critical',
    client: 'TechSolutions Ltd',
    status: 'IN_PROGRESS',
    priority: 'Critical',
    date: '2026-02-09',
    dueTime: '16:35',
    assignee: 'DevOps Team A',
  },
  {
    id: '2',
    code: 'TICK-885',
    title: 'Laptop Battery Replacement',
    client: 'Nguyen Van A',
    status: 'AGREED',
    priority: 'Medium',
    date: '2026-02-09',
    dueTime: '15:35',
  },
  {
    id: '3',
    code: 'TICK-771',
    title: 'Office WiFi Setup',
    client: 'StartUp Alpha',
    status: 'RESOLVED',
    priority: 'High',
    date: '2026-02-08',
    slaStatus: 'Met',
  },
];

const mockMessages: Message[] = [
  {
    id: '1',
    sender: 'System',
    role: 'System',
    content: 'Ticket created via Monitoring Alert. • 10:00 AM',
    time: '10:00 AM',
  },
  {
    id: '2',
    sender: 'TechSolutions Admin',
    role: 'Client',
    content: 'Our main production server is unresponsive.',
    time: '10:05 AM',
  },
  {
    id: '3',
    sender: 'Alex Sale',
    role: 'Sale',
    content: 'I have escalated this to the DevOps team immediately.',
    time: '10:10 AM',
    isMe: true,
  },
  {
    id: '4',
    sender: 'DevOps Lead',
    role: 'Tech',
    content: 'Investigating. Looks like a memory leak in the container.',
    time: '10:15 AM',
  },
];

export default function SupportTrackingPage() {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const router = useRouter();
  const [selectedTicket, setSelectedTicket] = useState<Ticket>(mockTickets[0]);
  const [search, setSearch] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loadingDiscovery, setLoadingDiscovery] = useState(false);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [flowMessage, setFlowMessage] = useState('');
  const [assets, setAssets] = useState<AssetOption[]>([]);
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
  const [isCategoryServiceAutoFilled, setIsCategoryServiceAutoFilled] = useState(false);

  const statusOptions: Ticket['status'][] = ['DRAFT', 'AGREED', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);

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
      let autoFilled = false;
      if (directCategoryId) {
        setSelectedCategoryId(directCategoryId);
        autoFilled = true;
      }
      if (directServiceId) {
        setSelectedServiceId(directServiceId);
        autoFilled = true;
      }

      if (!ticket.attributes) return;
      try {
        const parsed = JSON.parse(ticket.attributes) as Record<string, unknown>;
        const categoryFromAttributes = String(parsed.category_id ?? parsed.categoryId ?? '').trim();
        const serviceFromAttributes = String(parsed.service_id ?? parsed.serviceId ?? '').trim();
        if (!directCategoryId && categoryFromAttributes) {
          setSelectedCategoryId(categoryFromAttributes);
          autoFilled = true;
        }
        if (!directServiceId && serviceFromAttributes) {
          setSelectedServiceId(serviceFromAttributes);
          autoFilled = true;
        }
      } catch {
      }
      setIsCategoryServiceAutoFilled(autoFilled);
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
          };

          const statusFromNumber: Record<number, Ticket['status']> = {
            1: 'DRAFT',
            5: 'AGREED',
            3: 'OPEN',
            7: 'IN_PROGRESS',
            9: 'RESOLVED',
            10: 'CLOSED',
          };

          const toPriority = (value?: string): Ticket['priority'] => {
            const normalized = String(value ?? '').trim().toLowerCase();
            if (normalized.includes('critical') || normalized === '4') return 'Critical';
            if (normalized.includes('high') || normalized === '3') return 'High';
            if (normalized.includes('low') || normalized === '1') return 'Low';
            return 'Medium';
          };

          const hydratedTicket: Ticket = {
            id: String(raw.id ?? ticketId),
            code: `TICK-${String(raw.id ?? ticketId).slice(-6).toUpperCase()}`,
            orgId: raw.orgId,
            categoryId: raw.categoryId,
            serviceId: raw.serviceId,
            title: String(raw.title ?? 'UC-2 Ticket'),
            client: clientName || 'Khách từ CRM',
            status: statusFromNumber[Number(raw.status ?? 1)] ?? 'DRAFT',
            priority: toPriority(raw.priority),
            attributes: raw.attributes,
            slaHours: raw.slaHours,
            assetId: raw.assetId,
            date: String(raw.createdAt ?? new Date().toISOString()).split('T')[0],
            dueTime: 'N/A',
          };

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

    void hydrateFromTicketId();

    setFlowMessage(
      ticketId
        ? `Đã nhận context khách + ticket_id (${ticketId}) từ CRM. Đang focus ticket vừa tạo cho UC-2.`
        : 'Đã nhận context khách từ CRM. UC-2 sẽ ưu tiên owner_id này cho ListAssets/Preview*.'
    );
  }, []);

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
    setSelectedTicket((prev) => (prev.id === ticketId ? { ...prev, status } : prev));

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

  // Filter tickets
  const filteredTickets = tickets.filter(t => 
    t.code.toLowerCase().includes(search.toLowerCase()) || 
    t.client.toLowerCase().includes(search.toLowerCase()) ||
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateTicket = async (data: { subject: string; client: string; priority: string }) => {
    if (!selectedCategoryId) {
      setFlowMessage('Cần chạy ListCategories/ListServices trước khi CreateTicket.');
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
    const orgId = selectedTicket ? getEffectiveOrgOrOwnerId(selectedTicket) : '';
    if (!selectedCategoryId || !orgId) {
      setFlowMessage('Cần category + org_id trước khi gọi PreviewSLA.');
      return;
    }

    setLoadingSlaPreview(true);
    try {
      const response = await fetch('/api/sale/preview-sla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: selectedCategoryId,
          service_id: selectedServiceId || undefined,
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
        </div>
        
        <div className="flex-1 overflow-y-auto">
            {filteredTickets.map(ticket => (
                <div 
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
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
      </div>

      {/* Right Pane: Ticket Detail & Chat */}
      {selectedTicket && (
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">SLA Target</label>
                    <div className="inline-flex items-center justify-center px-4 py-1.5 bg-red-50 text-red-600 font-bold text-sm rounded-lg border border-red-100 w-full">
                        {selectedTicket.dueTime || 'N/A'}
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
                disabled={loadingSlaPreview || !hasEffectiveContextId || !selectedCategoryId}
                title={!hasEffectiveContextId ? 'Thiếu owner/org id. Hãy chọn khách từ CRM để prefill context.' : !selectedCategoryId ? 'Thiếu category để gọi PreviewSLA.' : undefined}
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

            <div className="px-6 py-3 border-b border-gray-100 bg-white grid grid-cols-1 md:grid-cols-3 gap-2">
              {isCategoryServiceAutoFilled && (
                <div className="md:col-span-3">
                  <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                    Auto-filled from Ticket
                  </span>
                </div>
              )}
              <select
                value={selectedCategoryId}
                onChange={(e) => {
                  setSelectedCategoryId(e.target.value);
                  setIsCategoryServiceAutoFilled(false);
                }}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Chọn category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <select
                value={selectedServiceId}
                onChange={(e) => {
                  setSelectedServiceId(e.target.value);
                  setIsCategoryServiceAutoFilled(false);
                }}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Chọn service</option>
                {services
                  .filter((service) => !selectedCategoryId || !service.categoryId || service.categoryId === selectedCategoryId)
                  .map((service) => (
                    <option key={service.id} value={service.id}>{service.name}</option>
                  ))}
              </select>
              <select
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Chọn asset (ListAssets)</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}{asset.serialNumber ? ` - ${asset.serialNumber}` : ''}
                  </option>
                ))}
              </select>
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
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
                <div className="flex justify-center">
                    <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">
                        Ticket created via Monitoring Alert. • 10:00 AM
                    </span>
                </div>

                {mockMessages.filter(m => m.role !== 'System').map(msg => (
                    <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] ${msg.isMe ? 'order-2' : 'order-2'}`}>
                            <div className={`flex items-baseline gap-2 mb-1 ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                                <span className={`text-xs font-bold ${
                                    msg.role === 'Client' ? 'text-gray-900' :
                                    msg.role === 'Sale' ? 'text-blue-600' :
                                    'text-purple-600'
                                }`}>
                                    {msg.sender} 
                                    <span className="text-gray-400 font-normal ml-1">({msg.role})</span>
                                </span>
                                <span className="text-xs text-gray-400">{msg.time}</span>
                            </div>
                            <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                msg.isMe 
                                    ? 'bg-blue-600 text-white rounded-tr-none' 
                                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                            }`}>
                                {msg.content}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Input */}
            <div className="p-4 border-t border-gray-100 bg-white">
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all shadow-sm">
                    <button className="text-gray-400 hover:text-gray-600">
                        <Paperclip className="w-5 h-5" />
                    </button>
                    <input 
                        type="text" 
                        placeholder="Type message to coordinate..." 
                        className="flex-1 bg-transparent border-none focus:outline-none text-sm py-1"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                    />
                    <button className="text-blue-600 hover:text-blue-700 bg-blue-50 p-2 rounded-full">
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