'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

// Mock chat messages (will be replaced with real data later)
const mockMessages = [
  {
    id: 1,
    sender: 'Manager John',
    role: 'Customer',
    message: 'Temperature is rising fast, please hurry.',
    time: '10:15 AM',
    isCustomer: true,
  },
  {
    id: 2,
    sender: 'Nguyen Van A',
    role: 'Technical',
    message: 'I am stuck in traffic. Will be there in 20 mins.',
    time: '10:20 AM',
    isCustomer: false,
  },
  {
    id: 3,
    sender: 'Manager John',
    role: 'Customer',
    message: 'That is too late! Our SLA is 30 mins response.',
    time: '10:22 AM',
    isCustomer: true,
  },
  {
    id: 4,
    sender: 'Nguyen Van A',
    role: 'Technical',
    message: 'Relax, I know what I am doing.',
    time: '10:23 AM',
    isCustomer: false,
  },
];

export default function TicketMonitorPage() {
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

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
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
      // Auto-select first ticket if none selected
      if (data.tickets?.length > 0 && !selectedTicket) {
        setSelectedTicket(data.tickets[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, selectedTicket]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

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

  const handleUpdateStatus = async (ticketId: string, status: TicketStatus) => {
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
                      <div className="space-y-4 max-h-[400px] overflow-y-auto">
                        {mockMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={cn('flex', msg.isCustomer ? 'justify-start' : 'justify-end')}
                          >
                            <div className={cn('max-w-md', msg.isCustomer ? 'pr-12' : 'pl-12')}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-gray-900">{msg.sender}</span>
                                <span className={cn(
                                  'px-2 py-0.5 text-xs rounded',
                                  msg.isCustomer ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                                )}>
                                  {msg.role}
                                </span>
                              </div>
                              <div
                                className={cn(
                                  'p-3 rounded-lg text-sm',
                                  msg.isCustomer
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-blue-600 text-white'
                                )}
                              >
                                {msg.message}
                              </div>
                              <p className={cn(
                                'text-xs text-gray-400 mt-1',
                                msg.isCustomer ? 'text-left' : 'text-right'
                              )}>
                                {msg.time}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
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
