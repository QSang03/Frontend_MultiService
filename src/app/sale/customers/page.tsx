'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Building,
  Filter,
  ChevronRight,
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

export default function SaleCustomersPage() {
  const [activeTab, setActiveTab] = useState<Tab>('pipeline');
  const [leads, setLeads] = useState<SalesLead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchLeads, setSearchLeads] = useState('');
  const [searchClients, setSearchClients] = useState('');
  const [selectedLead, setSelectedLead] = useState<SalesLead | null>(null);

  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [addLeadStatus, setAddLeadStatus] = useState('new');

  const [identityQuery, setIdentityQuery] = useState('');
  const [newGuestName, setNewGuestName] = useState('');
  const [identityResult, setIdentityResult] = useState<{ caseType: IdentityCase; lead?: SalesLead } | null>(null);
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [identityMessage, setIdentityMessage] = useState('');
  const [identityLoading, setIdentityLoading] = useState(false);
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

  const upsertLead = (lead: SalesLead) => {
    setLeads((prev) => {
      const index = prev.findIndex((item) => item.id === lead.id);
      if (index === -1) return [lead, ...prev];
      const next = [...prev];
      next[index] = lead;
      return next;
    });
  };

  const handleSearchCustomerLead = async () => {
    const keyword = identityQuery.trim().toLowerCase();
    if (!keyword) return;

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
    const keyword = identityQuery.trim();
    if (!keyword || !newGuestName.trim()) return;

    const isEmail = keyword.includes('@');

    setIdentityMessage('Đang gọi CreateGuest...');
    try {
      const response = await fetch('/api/sale/crm/create-guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGuestName.trim(),
          email: isEmail ? keyword : undefined,
          phone: isEmail ? undefined : keyword,
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
      setIdentityMessage('CreateGuest thành công. Tiếp tục SendAccountOtp.');
    } catch {
      setIdentityMessage('Lỗi kết nối CreateGuest.');
    }
  };

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
    <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col p-6 space-y-6">
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
              onClick={() => setActiveTab('pipeline')}
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
              <button
                onClick={handleCreateGuest}
                className="px-3 py-2 rounded-md bg-gray-900 text-white text-xs font-medium hover:bg-gray-800"
              >
                CreateGuest
              </button>
            </div>
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
                  <button className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                    Edit Info
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex-1">
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
                  className="grid grid-cols-12 px-6 py-4 items-center border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
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

          <div className="w-[400px] shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-400 text-sm max-w-[200px]">Select a lead to view details and manage interactions.</p>
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
