'use client';

import { useState } from 'react';
import { 
    Users, Search, Plus, Phone, Mail, Building, Filter, 
    ChevronRight
} from 'lucide-react';
import AddLeadModal from '@/components/AddLeadModal';

type Tab = 'pipeline' | 'directory';

import type { Lead } from '@/types/lead';

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

const mockLeads: Lead[] = [
  {
    id: '1',
    name: 'David Nguyen',
    company: 'StartUp Z',
    title: 'CTO',
    status: 'new',
    value: '$5,000',
    email: 'david@startupz.com',
    phone: '0901234567',
    lastContact: '2 days ago',
    source: 'Web Form',
    priority: 'high'
  },
  {
    id: '2',
    name: 'Sarah Tran',
    company: 'Individual', // Changed to match "Individual Prospect" feel
    title: 'Individual Prospect', // Use title as the subtitle
    status: 'contacted',
    value: '$12,000',
    email: 'sarah.t@gmail.com',
    phone: '0912223334',
    lastContact: '2024-02-02 10:00 AM',
    source: 'Referral',
    priority: 'medium'
  },
  {
      id: '3',
      name: 'John Smith',
      company: 'Tech Corp',
      title: 'Manager',
      status: 'qualified',
      value: '$20,000',
      email: 'john@tech.com',
      phone: '0123456789',
      lastContact: '1 day ago',
      source: 'LinkedIn',
      priority: 'high'
  }
];

const mockClients: Client[] = [
  {
    id: '1',
    name: 'Nguyen Van A',
    company: 'N/A',
    email: 'nguyenvana@gmail.com',
    phone: '0901234567',
    type: 'B2C',
    status: 'active',
    totalSpent: '$1,200',
    lastOrder: '2023-10-15',
    address: 'District 1, HCMC'
  },
  {
    id: '2',
    name: 'Tran Thi B',
    company: 'N/A',
    email: 'tranthib@gmail.com',
    phone: '0909876543',
    type: 'B2C',
    status: 'pending',
    totalSpent: '$0',
    lastOrder: 'N/A',
    address: 'District 3, HCMC'
  },
  {
    id: '3',
    name: 'TechSolutions Ltd',
    company: 'TechSolutions Ltd',
    email: 'contact@techsolutions.com',
    phone: '0283456789',
    type: 'B2B',
    status: 'active',
    totalSpent: '$55,000',
    lastOrder: '2023-11-01',
    address: 'District 7, HCMC'
  },
];

export default function SaleCustomersPage() {
  const [activeTab, setActiveTab] = useState<Tab>('pipeline');
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [searchLeads, setSearchLeads] = useState('');
  const [searchClients, setSearchClients] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(mockLeads[1]); // Default to Sarah Tran (index 1)
  
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [addLeadStatus, setAddLeadStatus] = useState('new');

  const handleAddLead = (newLead: Lead) => {
    setLeads(prev => [newLead, ...prev]);
  };

  const openAddLeadModal = (status: string = 'new') => {
    setAddLeadStatus(status);
    setIsAddLeadModalOpen(true);
  };

  // Filter leads
  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(searchLeads.toLowerCase()) ||
    lead.company.toLowerCase().includes(searchLeads.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col p-6 space-y-6">
      {/* Header & Controls */}
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

      {activeTab === 'pipeline' ? (
        <div className="flex flex-1 gap-6 overflow-hidden">
            {/* LEFT PANE: List */}
            <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                {/* Search Toolbar */}
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

                {/* Table Header */}
                <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-12 px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="col-span-5">Lead Name</div>
                    <div className="col-span-3">Status</div>
                    <div className="col-span-3">Source</div>
                    <div className="col-span-1 text-right">Action</div>
                </div>

                {/* Table List */}
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
                            <div className="col-span-3">
                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                                    lead.status === 'new' ? 'bg-blue-100 text-blue-700' :
                                    lead.status === 'contacted' ? 'bg-amber-100 text-amber-800' :
                                    lead.status === 'qualified' ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'
                                } capitalize`}>
                                    {lead.status}
                                </span>
                            </div>
                            <div className="col-span-3 text-sm text-gray-500">
                                {lead.source}
                            </div>
                            <div className="col-span-1 flex justify-end">
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT PANE: Details */}
            {selectedLead && (
                <div className="w-[400px] shrink-0 flex flex-col gap-6">
                    {/* Detail Card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{selectedLead.name}</h2>
                                <p className="text-gray-500 text-sm">{selectedLead.title}</p>
                            </div>
                            <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium border ${
                                selectedLead.status === 'new' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                                selectedLead.status === 'contacted' ? 'bg-amber-50 border-amber-100 text-amber-800' :
                                'bg-gray-50 border-gray-200 text-gray-800'
                            } capitalize`}>
                                {selectedLead.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-6">
                            <div>
                                <p className="text-xs text-gray-400 font-medium uppercase mb-1">Phone</p>
                                <p className="text-sm text-gray-900">{selectedLead.phone}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-medium uppercase mb-1">Email</p>
                                <p className="text-sm text-gray-900 truncate" title={selectedLead.email}>{selectedLead.email}</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">
                                Convert to Client
                            </button>
                            <button className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                                Edit Info
                            </button>
                        </div>
                    </div>

                    {/* Activity History */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex-1">
                        <h3 className="font-semibold text-gray-900 mb-4">Activity History</h3>
                        <div className="relative pl-4 space-y-6 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                            {/* Activity Item 1 */}
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-blue-600 bg-white" />
                                <span className="text-xs text-gray-400 mb-1 block">2024-02-02 10:00 AM</span>
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Phone className="w-3 h-3 text-blue-600" />
                                        <span className="text-xs font-bold text-gray-900 uppercase">Call</span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        Called to verify requirement. Wants battery replacement.
                                    </p>
                                </div>
                            </div>
                             {/* Activity Item 2 (Placeholder) */}
                             <div className="relative">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-gray-300 bg-white" />
                                <span className="text-xs text-gray-400 mb-1 block">2024-02-01 2:30 PM</span>
                                <div className="bg-white p-3 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Mail className="w-3 h-3 text-gray-500" />
                                        <span className="text-xs font-bold text-gray-900 uppercase">Email</span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        Sent welcome email and brochure.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      ) : (
        /* Client Directory Tab - Split View */
        <div className="flex flex-1 gap-6 overflow-hidden">
            {/* LEFT PANE: Directory List */}
            <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                {/* Search Toolbar */}
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

                {/* Table Header */}
                <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-12 px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="col-span-6">Client</div>
                    <div className="col-span-3">Type</div>
                    <div className="col-span-3">Status</div>
                </div>

                {/* Table List */}
                <div className="flex-1 overflow-y-auto">
                    {mockClients.filter(c => c.name.toLowerCase().includes(searchClients.toLowerCase())).map((client) => (
                         <div 
                            key={client.id} 
                            className="grid grid-cols-12 px-6 py-4 items-center border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                            <div className="col-span-6 flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  client.type === 'B2B' ? 'bg-purple-100' : 'bg-green-100'
                                }`}>
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
                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                                    client.status === 'active'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {client.status === 'active' ? 'Verified' : 'Guest'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT PANE: Placeholder */}
             <div className="w-[400px] shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-gray-300" />
                </div>
                 <p className="text-gray-400 text-sm max-w-[200px]">
                    Select a lead to view details and manage interactions.
                 </p>
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
