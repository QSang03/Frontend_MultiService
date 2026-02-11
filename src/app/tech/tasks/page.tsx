'use client';

import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Camera, 
  Box,
  Plus,
  Send,
  Wifi,
  ChevronRight
} from 'lucide-react';

// Mock Data
type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
type Status = 'NEW' | 'DISPATCHED' | 'IN PROGRESS' | 'COMPLETED' | 'PENDING';

interface Job {
  id: string;
  title: string;
  client: string;
  priority: Priority;
  status: Status;
  address: string;
  distance: string;
  time: string;
  dueDate: string;
  description: string;
  coordinates?: { lat: number; lng: number }; 
}

const JOBS: Job[] = [
  {
    id: 'T-2025-001',
    title: 'Server Rack Maintenance & Cooling Check',
    client: 'TechCorp Enterprise',
    priority: 'High',
    status: 'IN PROGRESS',
    address: '123 Innovation Dr, Tech Park, Zone A',
    distance: '2.4 km',
    time: '10:55',
    dueDate: '10:55:02 11/2/2026',
    description: 'Perform monthly maintenance on Server Rack A01. Check cooling fans and replace filter.',
  },
  {
    id: 'T-2025-002',
    title: 'Printer Network Configuration',
    client: 'Lawson Logistics',
    priority: 'Medium',
    status: 'DISPATCHED',
    address: '456 Supply Chain Blvd',
    distance: '5.1 km',
    time: '12:51',
    dueDate: '14:00:00 11/2/2026',
    description: 'Configure network settings for new warehouse printers.',
  },
  {
    id: 'T-2025-003',
    title: 'Workstation OS Upgrade Failure',
    client: 'Design Studio X',
    priority: 'Critical',
    status: 'NEW',
    address: '789 Creative Ave',
    distance: '1.2 km',
    time: '09:53',
    dueDate: '10:00:00 11/2/2026',
    description: 'Multiple workstations failed OS upgrade. Urgent fix required.',
  },
  {
    id: 'T-2025-004',
    title: 'CCTV Camera Alignment',
    client: 'Retail Chain Z',
    priority: 'Low',
    status: 'COMPLETED',
    address: '101 Market St',
    distance: '8.0 km',
    time: '09:55',
    dueDate: '16:00:00 10/2/2026',
    description: 'Re-align entrance cameras.',
  },
];

const TABS = [
  { id: 'info', label: 'Info' },
  { id: 'execute', label: 'Execute' },
  { id: 'materials', label: 'Materials' },
  { id: 'chat', label: 'Chat' },
];

export default function TechTasksPage() {
  const [selectedJobId, setSelectedJobId] = useState<string>(JOBS[0].id);
  const [activeTab, setActiveTab] = useState<string>('info');
  const [filter, setFilter] = useState<'All' | 'Active' | 'History'>('All');

  const selectedJob = JOBS.find(j => j.id === selectedJobId) || JOBS[0];

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case 'High': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'Medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Low': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (s: Status) => {
    switch (s) {
      case 'IN PROGRESS': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'DISPATCHED': return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'NEW': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'COMPLETED': return 'text-green-700 bg-green-100 border-green-200';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    // Main Container - h-full to fit within TechLayout
    <div className="flex h-full overflow-hidden bg-gray-50">
      {/* LEFT SIDEBAR - JOB LIST */}
      <div className="w-full md:w-[400px] flex flex-col bg-white h-full shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-10">
        <div className="p-4 space-y-4">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Jobs</h1>
          
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search ticket ID, title, client..." 
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
            />
          </div>

          <div className="flex gap-2">
            {(['All', 'Active', 'History'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  filter === f 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50/50">
          {JOBS.map((job) => (
            <div 
              key={job.id}
              onClick={() => setSelectedJobId(job.id)}
              className={`p-4 rounded-xl cursor-pointer transition-all duration-200 group ${
                selectedJobId === job.id 
                  ? 'bg-white shadow-md shadow-blue-500/10 scale-[1.02]' 
                  : 'bg-white hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium text-gray-500 group-hover:text-blue-600 transition-colors">{job.id}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${getPriorityColor(job.priority)}`}>
                  {job.priority}
                </span>
              </div>
              
              <h3 className="text-sm font-bold text-gray-900 line-clamp-1 mb-1 group-hover:text-blue-700 transition-colors">{job.title}</h3>
              <p className="text-xs text-gray-500 mb-3">{job.client}</p>

              <div className="flex items-center justify-between text-xs text-gray-400 pt-2 mt-2">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {job.distance}
                  </span>
                  <span className={`flex items-center gap-1.5 ${
                    job.priority === 'Critical' ? 'text-red-500 font-medium' : ''
                  }`}>
                    <Clock className="w-3.5 h-3.5" />
                    {job.time}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE - DETAILS */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
        {/* HEADER */}
        <div className="bg-white px-8 py-5 flex items-center justify-between shadow-sm z-0">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-bold text-xl text-gray-900 tracking-tight">{selectedJob.id}</span>
              <span className={`text-xs px-2.5 py-0.5 rounded font-medium border ${getPriorityColor(selectedJob.priority)}`}>
                {selectedJob.priority}
              </span>
            </div>
            <h2 className="text-sm text-gray-500">{selectedJob.title}</h2>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 cursor-pointer hover:bg-green-100 transition-colors">
                <Wifi className="w-5 h-5" />
             </div>
          </div>
        </div>

        {/* DETAILS TABS */}
        <div className="bg-white px-8 flex items-center gap-8 shadow-sm z-10">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 text-sm font-medium border-b-2 transition-all px-2 ${
                activeTab === tab.id 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            
            {activeTab === 'info' && (
              <>
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Customer Details</h3>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{selectedJob.client}</h4>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-gray-700">{selectedJob.address}</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                          <Clock className="w-4 h-4" />
                       </div>
                       <span className="font-medium text-blue-700 bg-blue-50/50 px-2 py-1 rounded-lg">Due: {selectedJob.dueDate}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Problem Description</h3>
                  <p className="text-base text-gray-700 leading-relaxed">
                    {selectedJob.description}
                  </p>
                </div>

                <div className="bg-gray-100 rounded-2xl h-72 flex items-center justify-center relative overflow-hidden group">
                   {/* Placeholder for map */}
                   <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/-122.4241,37.78,14.25,0,0/600x600?access_token=YOUR_TOKEN')] bg-cover opacity-50 grayscale transition-all group-hover:grayscale-0" />
                   <div className="relative z-10 bg-white shadow-lg px-5 py-3 rounded-xl flex items-center gap-3 scale-90 group-hover:scale-100 transition-transform duration-300">
                     <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-red-600" />
                     </div>
                     <span className="font-bold text-gray-800">Map Visualization</span>
                   </div>
                </div>

                {['NEW', 'DISPATCHED', 'IN PROGRESS'].includes(selectedJob.status) && (
                   <button className={`w-full py-4 text-white font-bold text-lg rounded-2xl shadow-xl transition-all active:scale-[0.99] flex items-center justify-center gap-3 ${
                     selectedJob.status === 'IN PROGRESS' 
                       ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' 
                       : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                   }`}>
                      <CheckCircle2 className="w-6 h-6" />
                      {selectedJob.status === 'IN PROGRESS' ? 'Continue Service Job' : 'Start Service Job'}
                   </button>
                )}
              </>
            )}

            {activeTab === 'execute' && (
              <>
                 <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50/50">
                      <h3 className="font-semibold text-gray-900">Service Job Checklist</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      {['Initial Diagnostic', 'Safety Check (ESD/Power)', 'Repair / Replace Component', 'Functional Testing', 'Clean Up Site'].map((item, idx) => (
                        <label key={idx} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors group">
                           <div className="w-5 h-5 rounded border border-gray-300 flex items-center justify-center group-hover:border-blue-500 transition-colors bg-white">
                              {/* Checkbox Placeholder */}
                           </div>
                           <span className="text-sm text-gray-700">{item}</span>
                        </label>
                      ))}
                    </div>
                 </div>

                 <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50/50">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Camera className="w-4 h-4 text-gray-500" />
                        Evidence Upload
                      </h3>
                    </div>
                    <div className="p-6 grid grid-cols-2 gap-4">
                       <button className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all">
                          <Camera className="w-8 h-8" />
                          <span className="text-xs font-medium">Add Photo</span>
                       </button>
                       <div className="aspect-square rounded-xl bg-gray-100 overflow-hidden relative group">
                          {/* Image Placeholder */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-gray-800/50 to-transparent text-white flex items-end p-2">
                             <span className="text-xs">IMG_20250211.jpg</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 <button className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/20 transition-all flex items-center justify-center gap-2 mt-4">
                    <CheckCircle2 className="w-5 h-5" />
                    Complete & Handover
                 </button>
              </>
            )}

            {activeTab === 'materials' && (
              <>
                 <div className="bg-white rounded-xl shadow-sm min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                       <Box className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No materials used yet</h3>
                    <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6">
                      Track consumables and parts used for this job to ensure accurate inventory and billing.
                    </p>
                    <button className="px-6 py-2.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition-colors flex items-center gap-2">
                       <Plus className="w-4 h-4" />
                       Add Material from Stock
                    </button>
                 </div>
                  
                 {['NEW', 'DISPATCHED', 'IN PROGRESS'].includes(selectedJob.status) && (
                   <button className={`w-full py-3 text-white font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 ${
                     selectedJob.status === 'IN PROGRESS' 
                       ? 'bg-yellow-500 hover:bg-yellow-600' 
                       : 'bg-blue-600 hover:bg-blue-700'
                   }`}>
                      <CheckCircle2 className="w-5 h-5" />
                      {selectedJob.status === 'IN PROGRESS' ? 'Continue Service Job' : 'Start Service Job'}
                   </button>
                )}
              </>
            )}

            {activeTab === 'chat' && (
              <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-sm overflow-hidden">
                 <div className="flex-1 p-6 bg-gray-50 space-y-4 overflow-y-auto">
                    <div className="flex justify-center">
                       <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                          Ticket assigned to you.
                       </span>
                    </div>
                    <div className="flex justify-start">
                       <div className="bg-white rounded-2xl rounded-tl-none p-4 max-w-[80%] shadow-sm">
                          <p className="text-sm text-gray-700">Please call when you arrive at the gate.</p>
                          <span className="text-[10px] text-gray-400 mt-1 block">08:59</span>
                       </div>
                    </div>
                 </div>
                 <div className="p-4 bg-white flex items-center gap-3">
                    <input 
                       type="text" 
                       placeholder="Type a message..."
                       className="flex-1 bg-gray-50 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <button className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm">
                       <Send className="w-4 h-4" />
                    </button>
                 </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
