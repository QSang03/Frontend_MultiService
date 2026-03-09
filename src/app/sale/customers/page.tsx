'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Plus,
  Mail,
  Building,
  Filter,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import AddLeadModal from '@/components/AddLeadModal';
import type { Lead } from '@/types/lead';

type Tab = 'pipeline' | 'directory';
type IdentityCase = 'A' | 'B' | 'C';

interface SalesLead extends Lead {
  identityType: 'customer' | 'guest' | 'new';
  verificationState: 'unverified' | 'otp_sent' | 'verified' | 'converted';
}

interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  type: 'B2C' | 'B2B';
  status: 'active' | 'inactive' | 'pending';
  totalSpent: string;
  lastOrder: string;
  address: string;
}

type Uc2Category = {
  id: string;
  name: string;
  attributesSchema?: string;
};

type Uc2Service = {
  id: string;
  name: string;
  categoryId?: string;
};

type Uc2Schema = {
  properties?: Record<
    string,
    {
      type?: string;
      title?: string;
      description?: string;
      enum?: Array<string | number | boolean>;
    }
  >;
  required?: string[];
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+()\-\s]{8,20}$/;

export default function SaleCustomersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('pipeline');
  const [leads, setLeads] = useState<SalesLead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [uc1AutoSearchBy, setUc1AutoSearchBy] = useState<'phone' | 'email' | null>(null);
  const [searchLeads, setSearchLeads] = useState('');
  const [searchClients, setSearchClients] = useState('');
  const [selectedLead, setSelectedLead] = useState<SalesLead | null>(null);

  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [addLeadStatus, setAddLeadStatus] = useState('new');

  const [identityQuery, setIdentityQuery] = useState('');
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestPhone, setNewGuestPhone] = useState('');
  const [newGuestEmail, setNewGuestEmail] = useState('');
  const [newGuestPhoneTouched, setNewGuestPhoneTouched] = useState(false);
  const [newGuestEmailTouched, setNewGuestEmailTouched] = useState(false);
  const [caseCCreateAttempted, setCaseCCreateAttempted] = useState(false);
  const [identityResult, setIdentityResult] = useState<{ caseType: IdentityCase; lead?: SalesLead } | null>(null);
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [identityMessage, setIdentityMessage] = useState('');
  const [identityLoading, setIdentityLoading] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [originalEditName, setOriginalEditName] = useState('');
  const [originalEditEmail, setOriginalEditEmail] = useState('');
  const [originalEditPhone, setOriginalEditPhone] = useState('');
  const [showClientEditWarning, setShowClientEditWarning] = useState(false);
  const [showEditSaveConfirm, setShowEditSaveConfirm] = useState(false);
  const [savingEditInfo, setSavingEditInfo] = useState(false);
  const [isUc2ModalOpen, setIsUc2ModalOpen] = useState(false);
  const [loadingUc2Discovery, setLoadingUc2Discovery] = useState(false);
  const [submittingUc2Ticket, setSubmittingUc2Ticket] = useState(false);
  const [uc2Categories, setUc2Categories] = useState<Uc2Category[]>([]);
  const [uc2Services, setUc2Services] = useState<Uc2Service[]>([]);
  const [uc2CategoryId, setUc2CategoryId] = useState('');
  const [uc2ServiceId, setUc2ServiceId] = useState('');
  const [uc2Subject, setUc2Subject] = useState('');
  const [uc2Priority, setUc2Priority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [uc2Attributes, setUc2Attributes] = useState<Record<string, string>>({});
  const [uc2Error, setUc2Error] = useState('');
  const [leadNextPageToken, setLeadNextPageToken] = useState('');
  const [customerNextPageToken, setCustomerNextPageToken] = useState('');
  const [loadingMoreLeads, setLoadingMoreLeads] = useState(false);
  const [loadingMoreCustomers, setLoadingMoreCustomers] = useState(false);

  const mergeLeadsById = (current: SalesLead[], incoming: SalesLead[]) => {
    const map = new Map<string, SalesLead>();
    current.forEach((item) => map.set(item.id, item));
    incoming.forEach((item) => map.set(item.id, item));
    return Array.from(map.values());
  };

  const mergeClientsById = (current: Client[], incoming: Client[]) => {
    const map = new Map<string, Client>();
    current.forEach((item) => map.set(item.id, item));
    incoming.forEach((item) => map.set(item.id, item));
    return Array.from(map.values());
  };

  const mapSalesLeadsToClients = (items: SalesLead[]): Client[] => {
    return items.map((customer) => {
      const customerType: Client['type'] = customer.company && customer.company !== 'Individual' ? 'B2B' : 'B2C';
      return {
        id: customer.id,
        name: customer.name,
        company: customer.company || 'N/A',
        email: customer.email,
        phone: customer.phone,
        type: customerType,
        status: 'active',
        totalSpent: '$0',
        lastOrder: 'N/A',
        address: 'N/A',
      };
    });
  };

  const getUc2SelectedCategory = () => uc2Categories.find((category) => category.id === uc2CategoryId);

  const parseUc2Schema = (): Uc2Schema => {
    const selectedCategory = getUc2SelectedCategory();
    if (!selectedCategory?.attributesSchema) return {};
    try {
      const parsed = JSON.parse(selectedCategory.attributesSchema) as Uc2Schema;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  };

  const convertUc2AttributeValue = (
    fieldKey: string,
    rawValue: string,
    fieldSchema?: { type?: string; enum?: Array<string | number | boolean> }
  ): { ok: true; value: string | number | boolean } | { ok: false; error: string } => {
    const trimmed = rawValue.trim();
    const enumValues = Array.isArray(fieldSchema?.enum) ? fieldSchema.enum : [];

    if (enumValues.length > 0) {
      const matched = enumValues.find((item) => String(item) === trimmed);
      if (matched === undefined) {
        return { ok: false, error: `${fieldKey} không hợp lệ. Chỉ chấp nhận: ${enumValues.join(', ')}` };
      }
      return { ok: true, value: matched };
    }

    const fieldType = String(fieldSchema?.type ?? 'string').toLowerCase();
    if (fieldType === 'number') {
      const num = Number(trimmed);
      if (Number.isNaN(num)) {
        return { ok: false, error: `${fieldKey} phải là số.` };
      }
      return { ok: true, value: num };
    }

    if (fieldType === 'integer') {
      const num = Number(trimmed);
      if (!Number.isInteger(num)) {
        return { ok: false, error: `${fieldKey} phải là số nguyên.` };
      }
      return { ok: true, value: num };
    }

    if (fieldType === 'boolean') {
      if (trimmed === 'true') return { ok: true, value: true };
      if (trimmed === 'false') return { ok: true, value: false };
      return { ok: false, error: `${fieldKey} phải là true hoặc false.` };
    }

    return { ok: true, value: trimmed };
  };

  const fetchLeadPage = async (pageToken = '', append = false, searchTerm = '') => {
    const params = new URLSearchParams({
      page_size: '20',
      page_token: pageToken,
    });
    if (searchTerm.trim()) params.set('search_term', searchTerm.trim());

    const response = await fetch(`/api/sale/crm/list-customer-leads?${params.toString()}`);
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(json?.error || 'ListCustomerLeads failed');

    const incoming = Array.isArray(json?.leads) ? (json.leads as SalesLead[]) : [];
    setLeadNextPageToken(String(json?.next_page_token ?? ''));
    setLeads((prev) => (append ? mergeLeadsById(prev, incoming) : incoming));
    if (!append) {
      setSelectedLead(incoming[0] ?? null);
    }
  };

  const fetchCustomerPage = async (pageToken = '', append = false, searchTerm = '') => {
    const params = new URLSearchParams({
      page_size: '20',
      page_token: pageToken,
    });
    if (searchTerm.trim()) params.set('search_term', searchTerm.trim());

    const response = await fetch(`/api/sale/crm/list-customers?${params.toString()}`);
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(json?.error || 'ListCustomers failed');

    const incomingRaw = Array.isArray(json?.customers) ? (json.customers as SalesLead[]) : [];
    const incoming = mapSalesLeadsToClients(incomingRaw);
    setCustomerNextPageToken(String(json?.next_page_token ?? ''));
    setClients((prev) => (append ? mergeClientsById(prev, incoming) : incoming));
    if (!append) {
      setSelectedClient(incoming[0] ?? null);
    }
  };

  const handleAddLead = (newLead: Lead) => {
    const normalizedLead: SalesLead = {
      ...newLead,
      identityType: 'new',
      verificationState: 'unverified',
    };
    setLeads((prev) => [normalizedLead, ...prev]);
  };

  const openAddLeadModal = (status: string = 'new') => {
    setAddLeadStatus(status);
    setIsAddLeadModalOpen(true);
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    let mounted = true;

    const loadCrmLists = async () => {
      try {
        if (!mounted) return;

        await Promise.all([fetchLeadPage('', false), fetchCustomerPage('', false)]);
      } catch {
        if (mounted) {
          setLeads([]);
          setClients([]);
          setSelectedLead(null);
          setIdentityMessage('Lỗi kết nối khi tải danh sách CRM từ BE.');
        }
      }
    };

    void loadCrmLists();

    return () => {
      mounted = false;
    };
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    if (identityResult?.caseType !== 'C') {
      setCaseCCreateAttempted(false);
    }
  }, [identityResult?.caseType]);

  const handleLoadMoreLeads = async () => {
    if (!leadNextPageToken || loadingMoreLeads) return;
    setLoadingMoreLeads(true);
    try {
      await fetchLeadPage(leadNextPageToken, true, searchLeads);
    } catch {
      setIdentityMessage('Không tải thêm được danh sách leads.');
    } finally {
      setLoadingMoreLeads(false);
    }
  };

  const handleLoadMoreCustomers = async () => {
    if (!customerNextPageToken || loadingMoreCustomers) return;
    setLoadingMoreCustomers(true);
    try {
      await fetchCustomerPage(customerNextPageToken, true, searchClients);
    } catch {
      setIdentityMessage('Không tải thêm được danh sách customers.');
    } finally {
      setLoadingMoreCustomers(false);
    }
  };

  const executeSearchCustomerLead = async (rawQuery: string) => {
    const keyword = rawQuery.trim().toLowerCase();
    if (!keyword) {
      setIdentityMessage('Vui lòng nhập SĐT hoặc Email để kiểm tra danh tính.');
      return;
    }

    setIdentityLoading(true);
    setIdentityMessage('Đang gọi SearchCustomerLead...');
    try {
      const response = await fetch('/api/sale/crm/search-customer-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: keyword }),
      });

      const json = await response.json();
      if (!response.ok) {
        setIdentityMessage(json?.error || 'SearchCustomerLead thất bại.');
        return;
      }

      const resultLead = json?.lead as SalesLead | undefined;
      const caseType = json?.caseType as IdentityCase;
      setIdentityResult({ caseType, lead: resultLead });
      if (resultLead) {
        upsertLead(resultLead);
        setSelectedLead(resultLead);
      }
      setVerifiedToken(null);
      setIdentityMessage(`SearchCustomerLead thành công - Trường hợp ${caseType}.`);
    } catch {
      setIdentityMessage('Lỗi kết nối SearchCustomerLead.');
    } finally {
      setIdentityLoading(false);
    }
  };

  const openUc1FromClient = async (client: Client, by: 'phone' | 'email') => {
    setUc1AutoSearchBy(by);
    const query = (by === 'phone' ? client.phone : client.email).trim();
    if (!query) {
      setIdentityMessage(`Khách chưa có ${by === 'phone' ? 'SĐT' : 'Email'} để chạy UC-1.`);
      setUc1AutoSearchBy(null);
      return;
    }

    if (by === 'phone' && !PHONE_REGEX.test(query)) {
      setIdentityMessage('SĐT khách không đúng định dạng, chưa thể tự động SearchCustomerLead.');
      setUc1AutoSearchBy(null);
      return;
    }

    if (by === 'email' && !EMAIL_REGEX.test(query)) {
      setIdentityMessage('Email khách không đúng định dạng, chưa thể tự động SearchCustomerLead.');
      setUc1AutoSearchBy(null);
      return;
    }

    setIdentityQuery(query);
    try {
      await executeSearchCustomerLead(query);
      setActiveTab('pipeline');
    } finally {
      setUc1AutoSearchBy(null);
    }
  };

  const openUc2FromClient = (client: Client) => {
    setSelectedClient(client);
    setUc2Error('');
    setUc2Subject(client.company && client.company !== 'N/A' ? `Tư vấn dịch vụ cho ${client.company}` : `Tư vấn dịch vụ cho ${client.name}`);
    setUc2Priority('medium');
    setUc2Attributes({});
    setUc2CategoryId('');
    setUc2ServiceId('');
    setIsUc2ModalOpen(true);

    const loadDiscovery = async () => {
      setLoadingUc2Discovery(true);
      try {
        const [categoriesRes, servicesRes] = await Promise.all([
          fetch('/api/admin/catalog/categories?page_size=50&has_services=true&show_approved=true'),
          fetch('/api/admin/catalog/services?page_size=100&show_inactive=false'),
        ]);

        const categoryJson = await categoriesRes.json().catch(() => ({}));
        const serviceJson = await servicesRes.json().catch(() => ({}));

        if (!categoriesRes.ok || !servicesRes.ok) {
          setUc2Error(categoryJson?.error || serviceJson?.error || 'Không tải được catalog UC-2.');
          return;
        }

        const categories = (categoryJson.categories ?? []).map((item: Record<string, unknown>) => ({
          id: String(item.id ?? ''),
          name: String(item.name ?? ''),
          attributesSchema: item.attributesSchema == null ? undefined : String(item.attributesSchema),
        })) as Uc2Category[];

        const services = (serviceJson.services ?? []).map((item: Record<string, unknown>) => ({
          id: String(item.id ?? ''),
          name: String(item.name ?? ''),
          categoryId: item.categoryId == null ? undefined : String(item.categoryId),
        })) as Uc2Service[];

        setUc2Categories(categories);
        setUc2Services(services);

        if (categories.length > 0) {
          const firstCategoryId = categories[0].id;
          setUc2CategoryId(firstCategoryId);
          const firstService = services.find((service) => !service.categoryId || service.categoryId === firstCategoryId);
          setUc2ServiceId(firstService?.id ?? '');
        }
      } catch {
        setUc2Error('Lỗi kết nối khi tải danh mục UC-2.');
      } finally {
        setLoadingUc2Discovery(false);
      }
    };

    void loadDiscovery();
  };

  const handleUc2CategoryChange = (categoryId: string) => {
    setUc2CategoryId(categoryId);
    const firstService = uc2Services.find((service) => !service.categoryId || service.categoryId === categoryId);
    setUc2ServiceId(firstService?.id ?? '');
    setUc2Attributes({});
  };

  const handleUc2CreateTicket = async () => {
    if (!selectedClient) return;
    if (!uc2CategoryId || !uc2Subject.trim()) {
      setUc2Error('Vui lòng chọn category và nhập tiêu đề yêu cầu.');
      return;
    }

    const schema = parseUc2Schema();
    const schemaProperties = schema.properties ?? {};
    const required = Array.isArray(schema.required) ? schema.required : [];
    for (const field of required) {
      if (!String(uc2Attributes[field] ?? '').trim()) {
        setUc2Error(`Thiếu thông tin bắt buộc: ${field}`);
        return;
      }
    }

    setUc2Error('');
    setSubmittingUc2Ticket(true);
    try {
      const schemaAttributesOnly = Object.entries(schemaProperties).reduce<Record<string, string | number | boolean>>(
        (acc, [key, fieldSchema]) => {
          const normalized = String(uc2Attributes[key] ?? '').trim();
          if (!normalized) {
            return acc;
          }

          const converted = convertUc2AttributeValue(key, normalized, fieldSchema);
          if (!converted.ok) {
            throw new Error(converted.error);
          }
          acc[key] = converted.value;
          return acc;
        },
        {}
      );

      for (const field of required) {
        if (!(field in schemaAttributesOnly)) {
          setUc2Error(`Thiếu thông tin bắt buộc: ${field}`);
          setSubmittingUc2Ticket(false);
          return;
        }
      }

      const response = await fetch('/api/sale/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedClient.id,
          category_id: uc2CategoryId,
          service_id: uc2ServiceId || undefined,
          title: uc2Subject.trim(),
          description: `UC-2 Consultation for ${selectedClient.name}`,
          priority: uc2Priority,
          attributes: JSON.stringify(schemaAttributesOnly),
        }),
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        setUc2Error(json?.error || 'CreateTicket thất bại.');
        return;
      }

      const createdTicketId = String((json as { ticket?: { id?: string } })?.ticket?.id ?? '').trim();

      setIsUc2ModalOpen(false);

      const params = new URLSearchParams({
        owner_id: selectedClient.id,
        client_name: selectedClient.name,
        client_email: selectedClient.email,
        client_phone: selectedClient.phone,
      });
      if (createdTicketId) {
        params.set('ticket_id', createdTicketId);
      }
      router.push(`/sale/support?${params.toString()}`);
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : 'Lỗi kết nối CreateTicket UC-2.';
      setUc2Error(message);
    } finally {
      setSubmittingUc2Ticket(false);
    }
  };

  const upsertLead = (lead: SalesLead) => {
    setLeads((prev) => {
      const index = prev.findIndex((item) => item.id === lead.id);
      if (index === -1) return [lead, ...prev];
      const next = [...prev];
      next[index] = lead;
      return next;
    });
  };

  const upsertClient = (client: Client) => {
    setClients((prev) => {
      const index = prev.findIndex((item) => item.id === client.id);
      if (index === -1) return [client, ...prev];
      const next = [...prev];
      next[index] = client;
      return next;
    });
  };

  const applyUpdatedLead = (lead: SalesLead) => {
    upsertLead(lead);
    setSelectedLead((prev) => (prev?.id === lead.id ? lead : prev));
    setIdentityResult((prev) => {
      if (!prev?.lead || prev.lead.id !== lead.id) return prev;
      return { ...prev, lead };
    });

    const mappedClient = mapSalesLeadsToClients([lead])[0];
    if (mappedClient) {
      upsertClient(mappedClient);
      setSelectedClient((prev) => (prev?.id === mappedClient.id ? mappedClient : prev));
    }
  };

  const openEditInfo = (lead: SalesLead) => {
    setShowClientEditWarning(false);
    setShowEditSaveConfirm(false);
    setEditingLeadId(lead.id);
    const initialName = lead.name || '';
    const initialEmail = lead.email || '';
    const initialPhone = lead.phone || '';
    setOriginalEditName(initialName);
    setOriginalEditEmail(initialEmail);
    setOriginalEditPhone(initialPhone);
    setEditName(initialName);
    setEditEmail(initialEmail);
    setEditPhone(initialPhone);
  };

  const openEditInfoFromClient = (client: Client) => {
    setShowClientEditWarning(true);
    setShowEditSaveConfirm(false);
    setEditingLeadId(client.id);
    const initialName = client.name || '';
    const initialEmail = client.email || '';
    const initialPhone = client.phone || '';
    setOriginalEditName(initialName);
    setOriginalEditEmail(initialEmail);
    setOriginalEditPhone(initialPhone);
    setEditName(initialName);
    setEditEmail(initialEmail);
    setEditPhone(initialPhone);
  };

  const requestSaveEditInfo = () => {
    const normalizedName = editName.trim();
    const normalizedEmail = editEmail.trim();
    const normalizedPhone = editPhone.trim();
    const normalizedOriginalName = originalEditName.trim();
    const normalizedOriginalEmail = originalEditEmail.trim();
    const normalizedOriginalPhone = originalEditPhone.trim();

    const hasChanges =
      normalizedName !== normalizedOriginalName ||
      normalizedEmail !== normalizedOriginalEmail ||
      normalizedPhone !== normalizedOriginalPhone;

    if (!hasChanges) {
      setIdentityMessage('Không có thay đổi nào để cập nhật.');
      setShowEditSaveConfirm(false);
      return;
    }

    setShowEditSaveConfirm(true);
  };

  const handleSaveEditInfo = async () => {
    if (!editingLeadId) return;

    const normalizedName = editName.trim();
    const normalizedEmail = editEmail.trim();
    const normalizedPhone = editPhone.trim();

    if (!normalizedName && !normalizedEmail && !normalizedPhone) {
      setIdentityMessage('Vui lòng nhập ít nhất một trường để cập nhật.');
      return;
    }

    if (normalizedEmail && !EMAIL_REGEX.test(normalizedEmail)) {
      setIdentityMessage('Email không đúng định dạng.');
      return;
    }

    if (normalizedPhone && !PHONE_REGEX.test(normalizedPhone)) {
      setIdentityMessage('Số điện thoại không đúng định dạng.');
      return;
    }

    setSavingEditInfo(true);
    try {
      const response = await fetch('/api/sale/crm/update-customer-lead', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: editingLeadId,
          full_name: normalizedName || undefined,
          email: normalizedEmail || undefined,
          phone: normalizedPhone || undefined,
        }),
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        setIdentityMessage(json?.error || 'UpdateCustomerLead thất bại.');
        return;
      }

      const updatedLead = json?.lead as SalesLead | undefined;
      if (updatedLead) {
        applyUpdatedLead(updatedLead);
      }
      setEditingLeadId(null);
      setShowClientEditWarning(false);
      setShowEditSaveConfirm(false);
      setIdentityMessage('UpdateCustomerLead thành công.');
    } catch {
      setIdentityMessage('Lỗi kết nối UpdateCustomerLead.');
    } finally {
      setSavingEditInfo(false);
    }
  };

  const handleSearchCustomerLead = async () => {
    await executeSearchCustomerLead(identityQuery);
  };

  const handleSendAccountOtp = async (leadId: string) => {
    setIdentityMessage('Đang gọi SendAccountOtp...');
    try {
      const selected = leads.find((lead) => lead.id === leadId);
      const channel = selected?.email ? 'EMAIL' : 'SMS';
      const response = await fetch('/api/sale/crm/send-account-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest_id: leadId, channel }),
      });
      const json = await response.json();
      if (!response.ok) {
        setIdentityMessage(json?.error || 'SendAccountOtp thất bại.');
        return;
      }

      setLeads((prev) => prev.map((lead) => (lead.id === leadId ? { ...lead, verificationState: 'otp_sent' } : lead)));
      setSelectedLead((prev) => (prev?.id === leadId ? { ...prev, verificationState: 'otp_sent' } : prev));
      setIdentityResult((prev) => {
        if (!prev?.lead || prev.lead.id !== leadId) return prev;
        return { ...prev, lead: { ...prev.lead, verificationState: 'otp_sent' } };
      });

      setIdentityMessage(json?.message || 'SendAccountOtp thành công. Vui lòng nhập OTP để xác thực.');
    } catch {
      setIdentityMessage('Lỗi kết nối SendAccountOtp.');
    }
  };

  const handleVerifyAccountOtp = async (leadId: string) => {
    setIdentityMessage('Đang gọi VerifyAccountOtp...');
    try {
      const response = await fetch('/api/sale/crm/verify-account-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest_id: leadId, otp_code: otpCode }),
      });
      const json = await response.json();
      if (!response.ok) {
        setIdentityMessage(json?.error || 'VerifyAccountOtp thất bại.');
        return;
      }

      const token = String(json?.verified_token ?? '');
      setVerifiedToken(token || null);
      setLeads((prev) => prev.map((lead) => (lead.id === leadId ? { ...lead, verificationState: 'verified' } : lead)));
      setSelectedLead((prev) => (prev?.id === leadId ? { ...prev, verificationState: 'verified' } : prev));
      setIdentityResult((prev) => {
        if (!prev?.lead || prev.lead.id !== leadId) return prev;
        return { ...prev, lead: { ...prev.lead, verificationState: 'verified' } };
      });

      setOtpCode('');
      setIdentityMessage('VerifyAccountOtp thành công.');
    } catch {
      setIdentityMessage('Lỗi kết nối VerifyAccountOtp.');
    }
  };

  const handleConvertGuestToCustomer = async (leadId: string) => {
    if (!verifiedToken) return;

    setIdentityMessage('Đang gọi ConvertGuestToCustomer...');
    try {
      const response = await fetch('/api/sale/crm/convert-guest-to-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest_id: leadId, verified_token: verifiedToken }),
      });

      const json = await response.json();
      if (!response.ok) {
        setIdentityMessage(json?.error || 'ConvertGuestToCustomer thất bại.');
        return;
      }

      const customer = json?.customer as SalesLead;
      if (customer) {
        upsertLead(customer);
        setSelectedLead(customer);
        setIdentityResult({ caseType: 'A', lead: customer });
      }
      setIdentityMessage('ConvertGuestToCustomer thành công. Backend đã bàn giao account + SMS welcome.');
    } catch {
      setIdentityMessage('Lỗi kết nối ConvertGuestToCustomer.');
    }
  };

  const handleCreateGuest = async () => {
    setCaseCCreateAttempted(true);
    setNewGuestEmailTouched(true);
    setNewGuestPhoneTouched(true);
    if (!newGuestName.trim() || !newGuestPhone.trim() || !newGuestEmail.trim()) {
      setIdentityMessage('Vui lòng nhập Tên, SĐT và Email cho khách mới.');
      return;
    }

    const normalizedPhone = newGuestPhone.trim();
    const normalizedEmail = newGuestEmail.trim();
    if (!PHONE_REGEX.test(normalizedPhone)) {
      setIdentityMessage('Số điện thoại không đúng định dạng. Vui lòng kiểm tra lại.');
      return;
    }
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setIdentityMessage('Email không đúng định dạng. Vui lòng kiểm tra lại.');
      return;
    }

    setIdentityMessage('Đang gọi CreateGuest...');
    try {
      const response = await fetch('/api/sale/crm/create-guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGuestName.trim(),
          email: normalizedEmail,
          phone: normalizedPhone,
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        setIdentityMessage(json?.error || 'CreateGuest thất bại.');
        return;
      }

      const guestLead = json?.guest as SalesLead;
      if (guestLead) {
        upsertLead(guestLead);
        setSelectedLead(guestLead);
        setIdentityResult({ caseType: 'B', lead: guestLead });
      }
      setNewGuestName('');
      setNewGuestPhone('');
      setNewGuestEmail('');
      setNewGuestPhoneTouched(false);
      setNewGuestEmailTouched(false);
      setCaseCCreateAttempted(false);
      setIdentityMessage('CreateGuest thành công. Tiếp tục SendAccountOtp.');
    } catch {
      setIdentityMessage('Lỗi kết nối CreateGuest.');
    }
  };

  const isCaseCPhoneInvalid = newGuestPhoneTouched && !!newGuestPhone.trim() && !PHONE_REGEX.test(newGuestPhone.trim());
  const isCaseCEmailInvalid = newGuestEmailTouched && !!newGuestEmail.trim() && !EMAIL_REGEX.test(newGuestEmail.trim());
  const hasEditChanges =
    editName.trim() !== originalEditName.trim() ||
    editEmail.trim() !== originalEditEmail.trim() ||
    editPhone.trim() !== originalEditPhone.trim();
  const isCaseCFormIncomplete = !newGuestName.trim() || !newGuestPhone.trim() || !newGuestEmail.trim();
  const isCaseCFormInvalid =
    isCaseCFormIncomplete || !PHONE_REGEX.test(newGuestPhone.trim()) || !EMAIL_REGEX.test(newGuestEmail.trim());
  const caseCDisabledReason = isCaseCFormInvalid ? 'Vui lòng nhập đúng Tên, SĐT và Email trước khi tạo Guest.' : undefined;

  const filteredLeads = useMemo(
    () =>
      leads.filter(
        (lead) =>
          lead.name.toLowerCase().includes(searchLeads.toLowerCase()) ||
          lead.company.toLowerCase().includes(searchLeads.toLowerCase())
      ),
    [leads, searchLeads]
  );

  const filteredClients = useMemo(
    () => clients.filter((c) => c.name.toLowerCase().includes(searchClients.toLowerCase())),
    [clients, searchClients]
  );

  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.16))] flex-col overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM & Leads</h1>
          <p className="text-gray-500 mt-1">Manage your sales pipeline and customer relationships.</p>
        </div>
        <div className="bg-gray-50 p-1 rounded-lg border border-gray-200 flex items-center">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              activeTab === 'pipeline' ? 'bg-white text-blue-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Leads Pipeline
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              activeTab === 'directory' ? 'bg-white text-blue-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Client Directory
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={identityQuery}
              onChange={(e) => setIdentityQuery(e.target.value)}
              placeholder="Nhập SĐT hoặc Email để SearchCustomerLead"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSearchCustomerLead}
            disabled={identityLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            {identityLoading ? 'Đang kiểm tra...' : 'Kiểm tra danh tính'}
          </button>
        </div>

        {identityMessage && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
            {identityMessage}
          </div>
        )}

        {identityResult?.caseType === 'A' && identityResult.lead && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-blue-800">Trường hợp A: Đã có Customer</p>
              <p className="text-blue-700">{identityResult.lead.name} - chuyển thẳng sang UC-2 (không tạo mới).</p>
            </div>
            <button
              onClick={() => {
                const client = mapSalesLeadsToClients([identityResult.lead!])[0];
                openUc2FromClient(client);
              }}
              className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
            >
              Tiếp tục UC-2
            </button>
          </div>
        )}

        {identityResult?.caseType === 'B' && identityResult.lead && (
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm space-y-2">
            <p className="font-semibold text-amber-800">Trường hợp B: Tìm thấy Guest</p>
            <p className="text-amber-700">Flow: SendAccountOtp → VerifyAccountOtp → ConvertGuestToCustomer.</p>
            <input
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="Nhập OTP khách đọc"
              className="w-full md:w-64 px-3 py-2 border border-amber-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSendAccountOtp(identityResult.lead!.id)}
                className="px-3 py-1.5 rounded-md bg-amber-500 text-white text-xs font-medium hover:bg-amber-600"
              >
                SendAccountOtp
              </button>
              <button
                onClick={() => handleVerifyAccountOtp(identityResult.lead!.id)}
                disabled={identityResult.lead.verificationState !== 'otp_sent' || !otpCode.trim()}
                className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                VerifyAccountOtp
              </button>
              <button
                onClick={() => handleConvertGuestToCustomer(identityResult.lead!.id)}
                disabled={identityResult.lead.verificationState !== 'verified' || !verifiedToken}
                className="px-3 py-1.5 rounded-md bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ConvertGuestToCustomer
              </button>
            </div>
          </div>
        )}

        {identityResult?.caseType === 'C' && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm space-y-2">
            <p className="font-semibold text-gray-800">Trường hợp C: Khách mới hoàn toàn</p>
            <p className="text-gray-600">CreateGuest (lưu tạm) rồi mới OTP + Convert.</p>
            <div className="flex flex-col md:flex-row gap-2">
              <input
                type="text"
                value={newGuestName}
                onChange={(e) => setNewGuestName(e.target.value)}
                placeholder="Tên khách hàng"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex-1">
                <input
                  type="tel"
                  value={newGuestPhone}
                  onChange={(e) => setNewGuestPhone(e.target.value)}
                  onBlur={() => setNewGuestPhoneTouched(true)}
                  placeholder="Số điện thoại"
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                    isCaseCPhoneInvalid
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {isCaseCPhoneInvalid && <p className="mt-1 text-xs text-red-600">Số điện thoại không đúng định dạng.</p>}
              </div>
              <div className="flex-1">
                <input
                  type="email"
                  value={newGuestEmail}
                  onChange={(e) => setNewGuestEmail(e.target.value)}
                  onBlur={() => setNewGuestEmailTouched(true)}
                  placeholder="Email"
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                    isCaseCEmailInvalid
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {isCaseCEmailInvalid && <p className="mt-1 text-xs text-red-600">Email không đúng định dạng.</p>}
              </div>
              <button
                onClick={handleCreateGuest}
                disabled={isCaseCFormInvalid}
                title={caseCDisabledReason}
                className="px-3 py-2 rounded-md bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                CreateGuest
              </button>
            </div>
            {caseCCreateAttempted && isCaseCFormInvalid && (
              <p className="text-xs text-red-600">Vui lòng nhập đúng Tên, SĐT và Email trước khi tạo Guest.</p>
            )}
          </div>
        )}
      </div>

      {activeTab === 'pipeline' ? (
        <div className="flex flex-1 gap-6 overflow-hidden">
          <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={searchLeads}
                  onChange={(e) => setSearchLeads(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => openAddLeadModal()}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium shrink-0"
              >
                <Plus className="w-4 h-4" />
                New Lead
              </button>
            </div>

            <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-12 px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-5">Lead Name</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Identity</div>
              <div className="col-span-2">Source</div>
              <div className="col-span-1 text-right">Action</div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className={`grid grid-cols-12 px-6 py-4 items-center border-b border-gray-100 cursor-pointer transition-colors ${
                    selectedLead?.id === lead.id ? 'bg-blue-50/50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-medium text-sm">
                      {lead.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{lead.name}</p>
                      <p className="text-xs text-gray-500">{lead.company !== 'Individual' ? lead.company : 'Individual'}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        lead.status === 'new'
                          ? 'bg-blue-100 text-blue-700'
                          : lead.status === 'contacted'
                            ? 'bg-amber-100 text-amber-800'
                            : lead.status === 'qualified'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                      } capitalize`}
                    >
                      {lead.status}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                      {lead.identityType}
                    </span>
                  </div>
                  <div className="col-span-2 text-sm text-gray-500">{lead.source}</div>
                  <div className="col-span-1 flex justify-end">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-gray-100 bg-white flex justify-center">
              <button
                onClick={handleLoadMoreLeads}
                disabled={!leadNextPageToken || loadingMoreLeads}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-gray-200 text-gray-700 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMoreLeads ? 'Loading...' : leadNextPageToken ? 'Load more leads' : 'No more leads'}
              </button>
            </div>
          </div>

          {selectedLead && (
            <div className="w-[400px] shrink-0 flex flex-col gap-6">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedLead.name}</h2>
                    <p className="text-gray-500 text-sm">{selectedLead.title}</p>
                  </div>
                  <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-medium border bg-gray-50 border-gray-200 text-gray-800 capitalize">
                    {selectedLead.identityType}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-6">
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase mb-1">Phone</p>
                    <p className="text-sm text-gray-900">{selectedLead.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase mb-1">Email</p>
                    <p className="text-sm text-gray-900 truncate" title={selectedLead.email}>
                      {selectedLead.email || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    disabled={selectedLead.identityType !== 'guest' || selectedLead.verificationState !== 'verified'}
                    onClick={() => handleConvertGuestToCustomer(selectedLead.id)}
                    className="flex-1 bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"
                  >
                    Convert to Client
                  </button>
                  <button
                    onClick={() => openEditInfo(selectedLead)}
                    className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                  >
                    Edit Info
                  </button>
                </div>

                {editingLeadId === selectedLead.id && (
                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-700">Cập nhật thông tin khách hàng</p>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        hasEditChanges ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {hasEditChanges ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                      {hasEditChanges ? 'Đã chỉnh sửa' : 'Chưa thay đổi'}
                    </span>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Họ và tên"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="Email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="Số điện thoại"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={requestSaveEditInfo}
                        disabled={savingEditInfo}
                        className="flex-1 px-3 py-2 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Lưu thay đổi
                      </button>
                      <button
                        onClick={() => {
                          setEditingLeadId(null);
                          setShowEditSaveConfirm(false);
                        }}
                        disabled={savingEditInfo}
                        className="flex-1 px-3 py-2 rounded-md bg-white border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Hủy
                      </button>
                    </div>
                    {showEditSaveConfirm && (
                      <div className="rounded-md border border-red-200 bg-red-50 p-2">
                        <p className="text-xs text-red-700 mb-2">Xác nhận: thao tác này sẽ cập nhật thông tin khách hàng trực tiếp lên CRM.</p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEditInfo}
                            disabled={savingEditInfo || !hasEditChanges}
                            className="flex-1 px-2 py-1.5 rounded-md bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {savingEditInfo ? 'Đang lưu...' : 'Xác nhận cập nhật'}
                          </button>
                          <button
                            onClick={() => {
                              setShowEditSaveConfirm(false);
                              setIdentityMessage('Đã hủy cập nhật thông tin khách hàng.');
                            }}
                            disabled={savingEditInfo}
                            className="flex-1 px-2 py-1.5 rounded-md bg-white border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Quay lại
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex-1">
                {selectedLead.identityType !== 'customer' && (
                  <div className="mb-6 rounded-lg border border-amber-100 bg-amber-50 p-3">
                    <h3 className="font-semibold text-amber-800 mb-2">UC-1 Actions</h3>
                    <p className="text-xs text-amber-700 mb-2">Dành cho Guest/Lead: Send OTP → Verify OTP → Convert.</p>
                    <input
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="Nhập OTP khách đọc"
                      className="w-full px-3 py-2 border border-amber-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 mb-2"
                    />
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={() => handleSendAccountOtp(selectedLead.id)}
                        className="px-3 py-2 rounded-md bg-amber-500 text-white text-xs font-medium hover:bg-amber-600"
                      >
                        SendAccountOtp
                      </button>
                      <button
                        onClick={() => handleVerifyAccountOtp(selectedLead.id)}
                        disabled={selectedLead.verificationState !== 'otp_sent' || !otpCode.trim()}
                        className="px-3 py-2 rounded-md bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        VerifyAccountOtp
                      </button>
                      <button
                        onClick={() => handleConvertGuestToCustomer(selectedLead.id)}
                        disabled={selectedLead.verificationState !== 'verified' || !verifiedToken}
                        className="px-3 py-2 rounded-md bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ConvertGuestToCustomer
                      </button>
                    </div>
                  </div>
                )}

                <h3 className="font-semibold text-gray-900 mb-4">Activity History</h3>
                {selectedLead?.lastContact ? (
                  <div className="relative pl-4 space-y-6 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-blue-600 bg-white" />
                      <span className="text-xs text-gray-400 mb-1 block">{selectedLead.lastContact}</span>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-2 mb-1">
                          <Mail className="w-3 h-3 text-gray-500" />
                          <span className="text-xs font-bold text-gray-900 uppercase">Latest Update</span>
                        </div>
                        <p className="text-sm text-gray-600">No detailed CRM activity log from backend yet.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[180px] flex items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
                    Chưa có Activity History từ backend.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-1 gap-6 overflow-hidden">
          <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchClients}
                  onChange={(e) => setSearchClients(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>

            <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-12 px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-6">Client</div>
              <div className="col-span-3">Type</div>
              <div className="col-span-3">Status</div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={`grid grid-cols-12 px-6 py-4 items-center border-b border-gray-100 cursor-pointer transition-colors ${
                    selectedClient?.id === client.id ? 'bg-blue-50/50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="col-span-6 flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        client.type === 'B2B' ? 'bg-purple-100' : 'bg-green-100'
                      }`}
                    >
                      {client.type === 'B2B' ? (
                        <Building className="w-5 h-5 text-purple-700" />
                      ) : (
                        <Users className="w-5 h-5 text-green-700" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{client.name}</p>
                      <p className="text-xs text-gray-500">{client.phone}</p>
                    </div>
                  </div>
                  <div className="col-span-3">
                    <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                      {client.type}
                    </span>
                  </div>
                  <div className="col-span-3">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        client.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {client.status === 'active' ? 'Verified' : 'Guest'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-gray-100 bg-white flex justify-center">
              <button
                onClick={handleLoadMoreCustomers}
                disabled={!customerNextPageToken || loadingMoreCustomers}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-gray-200 text-gray-700 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMoreCustomers ? 'Loading...' : customerNextPageToken ? 'Load more customers' : 'No more customers'}
              </button>
            </div>
          </div>

          {selectedClient ? (
            <div className="w-[400px] shrink-0 flex flex-col gap-6">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedClient.name}</h2>
                    <p className="text-gray-500 text-sm">{selectedClient.company !== 'N/A' ? selectedClient.company : 'Individual'}</p>
                  </div>
                  <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-medium border bg-gray-50 border-gray-200 text-gray-800 capitalize">
                    {selectedClient.type}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase mb-1">Phone</p>
                    <p className="text-sm text-gray-900">{selectedClient.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase mb-1">Email</p>
                    <p className="text-sm text-gray-900 truncate" title={selectedClient.email}>
                      {selectedClient.email || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase mb-1">Status</p>
                    <p className="text-sm text-gray-900">{selectedClient.status === 'active' ? 'Verified' : 'Guest'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase mb-1">Last Order</p>
                    <p className="text-sm text-gray-900">{selectedClient.lastOrder || 'N/A'}</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => openEditInfoFromClient(selectedClient)}
                    className="w-full bg-white border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                  >
                    Edit Info
                  </button>
                </div>

                {editingLeadId === selectedClient.id && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
                    {showClientEditWarning && (
                      <p className="text-xs text-amber-800">
                        Cảnh báo: Bạn đang chỉnh sửa trực tiếp thông tin khách hàng trên CRM. Hãy kiểm tra kỹ trước khi lưu.
                      </p>
                    )}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        hasEditChanges ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {hasEditChanges ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                      {hasEditChanges ? 'Đã chỉnh sửa' : 'Chưa thay đổi'}
                    </span>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Họ và tên"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="Email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="Số điện thoại"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={requestSaveEditInfo}
                        disabled={savingEditInfo}
                        className="flex-1 px-3 py-2 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Lưu thay đổi
                      </button>
                      <button
                        onClick={() => {
                          setEditingLeadId(null);
                          setShowClientEditWarning(false);
                          setShowEditSaveConfirm(false);
                        }}
                        disabled={savingEditInfo}
                        className="flex-1 px-3 py-2 rounded-md bg-white border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Hủy
                      </button>
                    </div>
                    {showEditSaveConfirm && (
                      <div className="rounded-md border border-red-200 bg-red-50 p-2">
                        <p className="text-xs text-red-700 mb-2">Xác nhận: thao tác này sẽ cập nhật thông tin khách hàng trực tiếp lên CRM.</p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEditInfo}
                            disabled={savingEditInfo || !hasEditChanges}
                            className="flex-1 px-2 py-1.5 rounded-md bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {savingEditInfo ? 'Đang lưu...' : 'Xác nhận cập nhật'}
                          </button>
                          <button
                            onClick={() => {
                              setShowEditSaveConfirm(false);
                              setIdentityMessage('Đã hủy cập nhật thông tin khách hàng.');
                            }}
                            disabled={savingEditInfo}
                            className="flex-1 px-2 py-1.5 rounded-md bg-white border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Quay lại
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex-1">
                <h3 className="font-semibold text-gray-900 mb-4">UC-1 Actions</h3>
                <p className="text-sm text-gray-500 mb-4">Bấm nút để quay lại flow UC-1 với thông tin khách đã chọn.</p>
                <div
                  className={`flex flex-col gap-3 transition-opacity ${
                    uc1AutoSearchBy !== null || identityLoading ? 'opacity-70' : 'opacity-100'
                  }`}
                >
                  <button
                    onClick={() => openUc2FromClient(selectedClient)}
                    className="w-full bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 shadow-sm"
                  >
                    Tiếp tục UC-2 (prefill khách)
                  </button>
                  <button
                    onClick={() => void openUc1FromClient(selectedClient, 'phone')}
                    disabled={uc1AutoSearchBy !== null || identityLoading}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                  >
                    {uc1AutoSearchBy === 'phone' && <Loader2 className="w-4 h-4 animate-spin" />}
                    {uc1AutoSearchBy === 'phone' ? 'Đang kiểm tra theo SĐT...' : 'Dùng SĐT để Check danh tính'}
                  </button>
                  <button
                    onClick={() => void openUc1FromClient(selectedClient, 'email')}
                    disabled={uc1AutoSearchBy !== null || identityLoading}
                    className="w-full bg-white border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                  >
                    {uc1AutoSearchBy === 'email' && <Loader2 className="w-4 h-4 animate-spin" />}
                    {uc1AutoSearchBy === 'email' ? 'Đang kiểm tra theo Email...' : 'Dùng Email để Check danh tính'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-[400px] shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-400 text-sm max-w-[220px]">Chọn một khách hàng để xem thông tin chi tiết và thao tác UC-2.</p>
            </div>
          )}
        </div>
      )}

      {isUc2ModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Tiếp tục UC-2</h3>
                <p className="text-xs text-gray-500">Chọn category/service và điền thông tin theo attributes schema trước khi tạo ticket.</p>
              </div>
              <button
                onClick={() => setIsUc2ModalOpen(false)}
                disabled={submittingUc2Ticket}
                className="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Đóng
              </button>
            </div>

            <div className="space-y-4 px-6 py-5 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Khách hàng</label>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
                    {selectedClient.name} ({selectedClient.phone || selectedClient.email || selectedClient.id})
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Mức ưu tiên</label>
                  <select
                    value={uc2Priority}
                    onChange={(event) => setUc2Priority(event.target.value as 'low' | 'medium' | 'high' | 'critical')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Category</label>
                  <select
                    value={uc2CategoryId}
                    onChange={(event) => handleUc2CategoryChange(event.target.value)}
                    disabled={loadingUc2Discovery || uc2Categories.length === 0}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                  >
                    {uc2Categories.length === 0 ? (
                      <option value="">Không có category</option>
                    ) : (
                      uc2Categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Service</label>
                  <select
                    value={uc2ServiceId}
                    onChange={(event) => setUc2ServiceId(event.target.value)}
                    disabled={loadingUc2Discovery}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                  >
                    {uc2Services
                      .filter((service) => !service.categoryId || service.categoryId === uc2CategoryId)
                      .map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    <option value="">Không chọn service cụ thể</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Tiêu đề ticket</label>
                <input
                  type="text"
                  value={uc2Subject}
                  onChange={(event) => setUc2Subject(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập tiêu đề yêu cầu"
                />
              </div>

              {Object.entries(parseUc2Schema().properties ?? {}).length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h4 className="mb-3 text-sm font-semibold text-gray-800">Thông tin theo schema</h4>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {Object.entries(parseUc2Schema().properties ?? {}).map(([fieldKey, fieldSchema]) => {
                      const required = (parseUc2Schema().required ?? []).includes(fieldKey);
                      const label = fieldSchema.title?.trim() || fieldKey;
                      const fieldType = String(fieldSchema.type ?? 'string').toLowerCase();
                      const enumValues = Array.isArray(fieldSchema.enum) ? fieldSchema.enum : [];
                      return (
                        <div key={fieldKey} className="space-y-1">
                          <label className="block text-xs font-medium text-gray-600">
                            {label} {required ? <span className="text-red-500">*</span> : null}
                          </label>
                          {enumValues.length > 0 ? (
                            <select
                              value={String(uc2Attributes[fieldKey] ?? '')}
                              onChange={(event) =>
                                setUc2Attributes((prev) => ({
                                  ...prev,
                                  [fieldKey]: event.target.value,
                                }))
                              }
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Chọn {label}</option>
                              {enumValues.map((enumValue) => (
                                <option key={`${fieldKey}-${String(enumValue)}`} value={String(enumValue)}>
                                  {String(enumValue)}
                                </option>
                              ))}
                            </select>
                          ) : fieldType === 'boolean' ? (
                            <select
                              value={String(uc2Attributes[fieldKey] ?? '')}
                              onChange={(event) =>
                                setUc2Attributes((prev) => ({
                                  ...prev,
                                  [fieldKey]: event.target.value,
                                }))
                              }
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Chọn {label}</option>
                              <option value="true">true</option>
                              <option value="false">false</option>
                            </select>
                          ) : (
                            <input
                              type={fieldType === 'number' || fieldType === 'integer' ? 'number' : 'text'}
                              step={fieldType === 'integer' ? '1' : fieldType === 'number' ? 'any' : undefined}
                              value={String(uc2Attributes[fieldKey] ?? '')}
                              onChange={(event) =>
                                setUc2Attributes((prev) => ({
                                  ...prev,
                                  [fieldKey]: event.target.value,
                                }))
                              }
                              placeholder={fieldSchema.description || `Nhập ${label}`}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {loadingUc2Discovery && (
                <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải danh mục UC-2...
                </div>
              )}

              {uc2Error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{uc2Error}</div>}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setIsUc2ModalOpen(false)}
                disabled={submittingUc2Ticket}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={() => void handleUc2CreateTicket()}
                disabled={submittingUc2Ticket || loadingUc2Discovery || !uc2CategoryId || !uc2Subject.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submittingUc2Ticket && <Loader2 className="h-4 w-4 animate-spin" />}
                {submittingUc2Ticket ? 'Đang tạo ticket...' : 'CreateTicket (DRAFT)'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AddLeadModal
        isOpen={isAddLeadModalOpen}
        onClose={() => setIsAddLeadModalOpen(false)}
        onAdd={handleAddLead}
        initialStatus={addLeadStatus}
      />
    </div>
  );
}
