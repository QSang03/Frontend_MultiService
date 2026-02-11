'use client';

import { useState } from 'react';
import { 
  Search, Plus, MoreVertical, Paperclip, Send, 
  Clock, CheckCircle2 
} from 'lucide-react';
import CreateTicketModal from '@/components/CreateTicketModal';

interface Ticket {
  id: string;
  code: string;
  title: string;
  client: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'High' | 'Medium' | 'Low' | 'Critical';
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
    status: 'In Progress',
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
    status: 'Open',
    priority: 'Medium',
    date: '2026-02-09',
    dueTime: '15:35',
  },
  {
    id: '3',
    code: 'TICK-771',
    title: 'Office WiFi Setup',
    client: 'StartUp Alpha',
    status: 'Resolved',
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
  const [selectedTicket, setSelectedTicket] = useState<Ticket>(mockTickets[0]);
  const [search, setSearch] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filter tickets
  const filteredTickets = tickets.filter(t => 
    t.code.toLowerCase().includes(search.toLowerCase()) || 
    t.client.toLowerCase().includes(search.toLowerCase()) ||
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateTicket = (data: { subject: string; client: string; priority: string }) => {
    const newId = (tickets.length + 1).toString();
    const newTicket: Ticket = {
      id: newId,
      code: `TICK-${Math.floor(10000 + Math.random() * 90000)}`, // Random 5-digit code for variety
      title: data.subject,
      client: data.client,
      status: 'Open',
    priority: data.priority.split(' ')[0] as Ticket['priority'], // Extract 'Critical' from 'Critical (1h)'
      date: new Date().toISOString().split('T')[0],
      // Approximate due time logic based on priority, simplified
      dueTime: '12:00', 
    };

    const newTicketList = [newTicket, ...tickets];
    setTickets(newTicketList);
    setSelectedTicket(newTicket);
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
                             ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                             ticket.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                             'bg-gray-100 text-gray-700 border border-gray-200'
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
                    <select className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>In Progress</option>
                        <option>Open</option>
                        <option>Resolved</option>
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