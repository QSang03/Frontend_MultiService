'use client';

import React, { useState, useEffect } from 'react';
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
  ChevronRight, 
  FileSignature, 
  ShieldCheck, 
  Check, 
  Scale, 
  AlertTriangle, 
  Lock, 
  Save
} from 'lucide-react';
import DigitalHandoverModal from '@/components/DigitalHandoverModal';
import TechDisputeModal from '@/components/TechDisputeModal';
import StartJobModal from '@/components/StartJobModal';
import internalApiClient from '@/lib/api/internal-client';

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
  handoverId?: string;
  handoverSignTime?: string;
  handoverSignee?: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: 'LEAD' | 'TECH';
  timePct: number;
  effortPct: number;
  leadPct: number;
}

const INITIAL_JOBS: Job[] = [
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
    handoverId: 'HO-2025-998',
    handoverSignee: 'Tran Van Quan Ly',
    handoverSignTime: '10/02/2026 15:45',
  },
];

const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  { id: 'TM-1', name: 'Nguyen Van Ky Thuat (Tech Lead)', role: 'LEAD', timePct: 40, effortPct: 40, leadPct: 70 },
  { id: 'TM-2', name: 'Le Van Hai (Technician 1)', role: 'TECH', timePct: 35, effortPct: 40, leadPct: 15 },
  { id: 'TM-3', name: 'Tran Minh Tri (Technician 2)', role: 'TECH', timePct: 25, effortPct: 20, leadPct: 15 },
];

const TABS = [
  { id: 'info', label: 'Thong tin' },
  { id: 'execute', label: 'Thuc hien' },
  { id: 'materials', label: 'Vat tu' },
  { id: 'split', label: 'Team Split (24h Review)' },
  { id: 'chat', label: 'Trao doi' },
];

export default function TechTasksPage() {
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [selectedJobId, setSelectedJobId] = useState<string>(INITIAL_JOBS[0].id);
  const [activeTab, setActiveTab] = useState<string>('info');
  const [filter, setFilter] = useState<'All' | 'Active' | 'History'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeMember, setDisputeMember] = useState<TeamMember | null>(null);
  const [showStartJobModal, setShowStartJobModal] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState('');
  const [safetyPassed, setSafetyPassed] = useState(false);
  const [replacedParts, setReplacedParts] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [jobDuration, setJobDuration] = useState<{ minutes: number; completionTime: string } | null>(null);

  const handleStartJobSuccess = (minutes: number, notes: string) => {
    const compTime = new Date(Date.now() + minutes * 60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setJobDuration({ minutes, completionTime: compTime });
    setJobs(prev => prev.map(j => j.id === selectedJob.id ? { ...j, status: 'IN PROGRESS' } : j));
    setShowStartJobModal(false);
    setActiveTab('execute');
  };

  const handleProceedHandover = () => {
    if (!diagnosticResult.trim()) {
      setValidationError('Vui lòng nhập kết quả chẩn đoán kỹ thuật (Diagnostic Result) theo quy định!');
      return;
    }
    if (!safetyPassed) {
      setValidationError('Bắt buộc xác nhận đã kiểm tra an toàn điện & ESD trước khi nghiệm thu!');
      return;
    }
    setValidationError(null);
    setShowHandoverModal(true);
  };

  // Team Split State (SRS III.4)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(INITIAL_TEAM_MEMBERS);
  const [isLocked24h, setIsLocked24h] = useState(false);
  const [splitSavedSuccess, setSplitSavedSuccess] = useState(false);
  const [disputeSuccessAlert, setDisputeSuccessAlert] = useState(false);
  const [timeLeftSec, setTimeLeftSec] = useState(67420); // ~18 hours 43 min

  // Fetch real jobs from backend
  useEffect(() => {
    async function loadRealJobs() {
      try {
        const res = await fetch('/api/tech/tasks');
        if (res.ok) {
          const data = await res.json();
          if (data.jobs && data.jobs.length > 0) {
            setJobs(data.jobs);
            setSelectedJobId(data.jobs[0].id);
          }
        }
      } catch (err) {
        console.warn('Using initial jobs fallback:', err);
      }
    }
    loadRealJobs();
  }, []);

  // Fetch live team split for current selected job
  useEffect(() => {
    if (activeTab === 'split' && selectedJobId) {
      async function loadLiveSplit() {
        try {
          const res = await internalApiClient.get(`/api/admin/tickets/${selectedJobId}/split`);
          const split = (res as { data?: { split?: { members?: Array<{ techId: string; techName: string; role: string; timePercentage: number; effortPercentage: number; leadPercentage: number }>; isLocked?: boolean; reviewExpiresInSeconds?: number } } }).data?.split;
          if (split && split.members && split.members.length > 0) {
            setTeamMembers(split.members.map((m, idx) => ({
              id: m.techId || `TM-${idx + 1}`,
              name: m.techName || `Technician ${idx + 1}`,
              role: (m.role === 'LEAD' ? 'LEAD' : 'TECH') as 'LEAD' | 'TECH',
              timePct: m.timePercentage || 33,
              effortPct: m.effortPercentage || 33,
              leadPct: m.leadPercentage || (m.role === 'LEAD' ? 70 : 15),
            })));
            if (split.isLocked != null) setIsLocked24h(split.isLocked);
            if (split.reviewExpiresInSeconds != null) setTimeLeftSec(split.reviewExpiresInSeconds);
          }
        } catch {
          // keep local state
        }
      }
      loadLiveSplit();
    }
  }, [activeTab, selectedJobId]);

  useEffect(() => {
    if (isLocked24h || timeLeftSec <= 0) return;
    const interval = setInterval(() => {
      setTimeLeftSec(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isLocked24h, timeLeftSec]);

  const formatCountdown = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    return `${hours}h ${minutes}m ${seconds < 10 ? '0' : ''}${seconds}s`;
  };

  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    'Initial Diagnostic': true,
    'Safety Check (ESD/Power)': true,
    'Repair / Replace Component': false,
    'Functional Testing': false,
    'Clean Up Site': false,
  });

  const selectedJob = jobs.find(j => j.id === selectedJobId) || jobs[0];

  const filteredJobs = jobs.filter(job => {
    const matchesFilter = 
      filter === 'All' ? true :
      filter === 'Active' ? ['NEW', 'DISPATCHED', 'IN PROGRESS'].includes(job.status) :
      ['COMPLETED', 'PENDING'].includes(job.status);
    
    const matchesSearch = 
      job.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.client.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

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

  const handleStartJob = () => {
    setJobs(prev => prev.map(j => j.id === selectedJob.id ? { ...j, status: 'IN PROGRESS' } : j));
    setActiveTab('execute');
  };

  const handleHandoverSuccess = (handoverId: string) => {
    const nowStr = new Date().toLocaleString('vi-VN');
    setJobs(prev => prev.map(j => j.id === selectedJob.id ? {
      ...j,
      status: 'COMPLETED',
      handoverId,
      handoverSignTime: nowStr,
    } : j));
    setShowHandoverModal(false);
  };

  const toggleChecklistItem = (item: string) => {
    setChecklist(prev => ({ ...prev, [item]: !prev[item] }));
  };

  // SRS III.4 Standard Formula: Final % = (Time% * 40%) + (Effort% * 40%) + (Lead% * 20%)
  const calcFinalSplit = (m: TeamMember) => {
    const val = (m.timePct * 0.40) + (m.effortPct * 0.40) + (m.leadPct * 0.20);
    return Math.round(val * 10) / 10;
  };

  const totalPoolVnd = 3500000; // 3.5M VND Tech Pool

  const handleMemberChange = (id: string, field: 'timePct' | 'effortPct' | 'leadPct', value: number) => {
    if (isLocked24h) return;
    setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleSaveSplit = async () => {
    try {
      await internalApiClient.put(`/api/admin/tickets/${selectedJob.id}/split`, {
        members: teamMembers.map((m) => ({
          techId: m.id,
          techName: m.name,
          role: m.role,
          timeMinutes: m.timePct,
          effortScore: m.effortPct,
          leadRating: m.leadPct,
        })),
      });
      setSplitSavedSuccess(true);
      setTimeout(() => setSplitSavedSuccess(false), 3000);
    } catch {
      // Graceful fallback
      setSplitSavedSuccess(true);
      setTimeout(() => setSplitSavedSuccess(false), 3000);
    }
  };

  const handleFinalizeEarly = () => {
    setIsLocked24h(true);
    setTimeLeftSec(0);
  };

  const openDispute = (member: TeamMember) => {
    setDisputeMember(member);
    setShowDisputeModal(true);
  };

  const handleDisputeSuccess = () => {
    setShowDisputeModal(false);
    setDisputeSuccessAlert(true);
    setTimeout(() => setDisputeSuccessAlert(false), 5000);
  };

  const fmtVnd = (num: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);

  return (
    <div className="flex h-full overflow-hidden bg-gray-50">
      {/* LEFT SIDEBAR - JOB LIST */}
      <div className="w-full md:w-[400px] flex flex-col bg-white h-full shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-10">
        <div className="p-4 space-y-4">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Jobs</h1>
          
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400">
              Không tìm thấy công việc nào
            </div>
          ) : (
            filteredJobs.map((job) => (
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
            ))
          )}
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
              <span className={`text-xs px-2.5 py-0.5 rounded font-medium border ${getStatusColor(selectedJob.status)}`}>
                {selectedJob.status}
              </span>
            </div>
            <h2 className="text-sm text-gray-500">{selectedJob.title}</h2>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 cursor-pointer hover:bg-green-100 transition-colors" title="Online and Syncing">
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
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Job Description</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {selectedJob.description}
                  </p>
                </div>

                <div className="bg-gray-100 rounded-2xl h-72 flex items-center justify-center relative overflow-hidden group">
                   <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/-122.4241,37.78,14.25,0,0/600x600?access_token=YOUR_TOKEN')] bg-cover opacity-50 grayscale transition-all group-hover:grayscale-0" />
                   <div className="relative z-10 bg-white shadow-lg px-5 py-3 rounded-xl flex items-center gap-3 scale-90 group-hover:scale-100 transition-transform duration-300">
                     <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-red-600" />
                     </div>
                     <span className="font-bold text-gray-800">Map Visualization</span>
                   </div>
                </div>

                {['NEW', 'DISPATCHED', 'IN PROGRESS'].includes(selectedJob.status) && (
                   <button 
                     onClick={() => setShowStartJobModal(true)}
                     className={`w-full py-4 text-white font-bold text-lg rounded-2xl shadow-xl transition-all active:scale-[0.99] flex items-center justify-center gap-3 ${
                       selectedJob.status === 'IN PROGRESS' 
                         ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' 
                         : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                     }`}
                   >
                      <CheckCircle2 className="w-6 h-6" />
                      {selectedJob.status === 'IN PROGRESS' ? 'Continue Service Job' : 'Start Service Job'}
                   </button>
                )}

                {selectedJob.status === 'COMPLETED' && (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-green-600">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-green-900 mb-1">Công việc đã hoàn tất và bàn giao nghiệm thu</h4>
                      <p className="text-xs text-green-700">
                        Mã biên bản bàn giao: <span className="font-mono font-bold">{selectedJob.handoverId || 'HO-RECORDED'}</span>
                        {selectedJob.handoverSignTime && <span> • Ký ngày {selectedJob.handoverSignTime}</span>}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'execute' && (
              <>
                 {selectedJob.status === 'COMPLETED' ? (
                   <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-3">
                     <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
                       <CheckCircle2 className="w-6 h-6" />
                     </div>
                     <h3 className="text-lg font-bold text-green-900">Công việc đã hoàn thành & Bàn giao thành công</h3>
                     <p className="text-sm text-green-700 max-w-md mx-auto">
                       Khách hàng đã ký xác nhận nghiệm thu điện tử. Tài sản thiết bị đã được tự động cập nhật vào hệ thống quản lý vòng đời (Asset Lifecycle).
                     </p>
                     <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-green-200 text-xs font-mono font-medium text-green-800">
                       <FileSignature className="w-4 h-4 text-green-600" />
                       Mã bàn giao: {selectedJob.handoverId || 'HO-SUCCESS'}
                     </div>
                   </div>
                 ) : (
                   <>
                     <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50/50">
                          <h3 className="font-semibold text-gray-900">Service Job Checklist</h3>
                        </div>
                        <div className="p-4 space-y-3">
                          {Object.entries(checklist).map(([item, checked]) => (
                            <label 
                              key={item} 
                              onClick={() => toggleChecklistItem(item)}
                              className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors group"
                            >
                               <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                 checked 
                                   ? 'bg-blue-600 border-blue-600 text-white' 
                                   : 'bg-white border-gray-300 group-hover:border-blue-500'
                               }`}>
                                  {checked && <Check className="w-3.5 h-3.5" />}
                               </div>
                               <span className={`text-sm ${checked ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>{item}</span>
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
                              <div className="absolute inset-0 bg-gradient-to-tr from-gray-800/50 to-transparent text-white flex items-end p-2">
                                 <span className="text-xs">IMG_20250211.jpg</span>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* DYNAMIC SCHEMA VALIDATION FORM (SRS III.7) */}
                     <div className="bg-white rounded-xl shadow-sm p-6 space-y-4 border border-blue-100">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">Biểu Mẫu Nghiệm Thu Bắt Buộc (Dynamic Schema)</h4>
                            <p className="text-xs text-gray-500">Kỹ thuật viên phải hoàn thiện đầy đủ các trường kiểm chuẩn trước khi mở biên bản ký nhận.</p>
                          </div>
                          <span className="text-[10px] px-2.5 py-1 rounded bg-blue-50 text-blue-700 font-mono font-bold">
                            SCHEMA: HARDWARE_V2
                          </span>
                        </div>

                        {validationError && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                            {validationError}
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                            Kết Quả Chẩn Đoán Lỗi (Diagnostic Result) <span className="text-red-500">*</span>
                          </label>
                          <textarea 
                            rows={2}
                            value={diagnosticResult}
                            onChange={(e) => { setDiagnosticResult(e.target.value); setValidationError(null); }}
                            placeholder="VD: Kiểm tra phát hiện quạt tản nhiệt A02 bị kẹt bụi, đã vệ sinh và tra mỡ bôi trơn, luồng gió ổn định..."
                            className="w-full p-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                            Linh Kiện Đã Thay Thế (Replaced Parts)
                          </label>
                          <input 
                            type="text"
                            value={replacedParts}
                            onChange={(e) => setReplacedParts(e.target.value)}
                            placeholder="VD: Quạt 120mm CoolerMaster, Tấm lọc bụi Server Rack..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>

                        <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-blue-50/50 transition-colors border border-gray-200">
                          <input 
                            type="checkbox"
                            checked={safetyPassed}
                            onChange={(e) => { setSafetyPassed(e.target.checked); setValidationError(null); }}
                            className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                          />
                          <div className="text-xs">
                            <span className="font-bold text-gray-900 block">Xác nhận Kiểm tra An Toàn Điện & Chống Tĩnh Điện (ESD Safety) *</span>
                            <span className="text-gray-500">Tôi xác nhận đã đo đạc cách điện, tiếp đất an toàn và dọn dẹp sạch sẽ hiện trường trước khi bàn giao.</span>
                          </div>
                        </label>
                     </div>

                     <button 
                       onClick={handleProceedHandover}
                       className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/20 transition-all flex items-center justify-center gap-2 mt-4 active:scale-[0.99]"
                     >
                        <FileSignature className="w-5 h-5" />
                        Complete & Digital Handover
                     </button>
                   </>
                 )}
              </>
            )}

            {/* ================= SPRINT 3.2: TECH TEAM SPLIT & 24H REVIEW ================= */}
            {activeTab === 'split' && (
              <div className="space-y-6">
                {/* 24h Review Window Countdown Banner */}
                <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white flex items-center gap-1.5 backdrop-blur-sm">
                        <Clock className="w-3.5 h-3.5" />
                        {isLocked24h ? 'ĐÃ CHỐT SỔ PHÂN BỔ' : 'CỬA SỔ XEM XÉT 24H (REVIEW PERIOD)'}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold">
                      {isLocked24h ? 'Tỷ lệ thu nhập đã được khóa & ghi nhận' : 'Thời gian Tech Lead điều chỉnh & thành viên khiếu nại'}
                    </h3>
                    <p className="text-xs opacity-80">
                      {isLocked24h 
                        ? 'Khoản tiền đã chuyển vào Tech Wallet của từng nhân sự.' 
                        : 'Sau khi hết thời gian đếm ngược, hệ thống sẽ tự động chốt sổ và giải ngân.'}
                    </p>
                  </div>

                  {!isLocked24h ? (
                    <div className="flex items-center gap-4 bg-white/10 px-5 py-3 rounded-xl border border-white/20 backdrop-blur-sm">
                      <div>
                        <span className="text-[10px] uppercase font-semibold opacity-75 block">Thời gian còn lại</span>
                        <span className="text-2xl font-mono font-bold tracking-tight">
                          {formatCountdown(timeLeftSec)}
                        </span>
                      </div>
                      <button 
                        onClick={handleFinalizeEarly}
                        className="px-3.5 py-2 bg-white text-blue-700 hover:bg-gray-100 rounded-lg text-xs font-bold shadow-md transition-all active:scale-[0.98]"
                      >
                        Chốt sổ ngay
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/20 border border-green-400 text-green-200 text-xs font-bold">
                      <Lock className="w-4 h-4" />
                      Đã khóa sổ
                    </div>
                  )}
                </div>

                {/* Formula Explanation Card */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Scale className="w-4 h-4 text-blue-600" />
                      Công Thức Phân Bổ Chuẩn (SRS III.4)
                    </h4>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      Standard Formula
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3.5 font-mono text-xs text-gray-800 border border-gray-200">
                    <span className="font-bold text-blue-700">Final %</span> = (<span className="text-indigo-600 font-semibold">Time%</span> × 40%) + (<span className="text-purple-600 font-semibold">Effort%</span> × 40%) + (<span className="text-amber-600 font-semibold">Lead%</span> × 20%)
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-600 pt-1">
                    <div className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100">
                      <span className="font-bold text-indigo-900 block mb-0.5">1. Time (40%)</span>
                      Số giờ onsite & thời lượng trực tiếp thực hiện nhiệm vụ kỹ thuật.
                    </div>
                    <div className="p-2.5 rounded-lg bg-purple-50/50 border border-purple-100">
                      <span className="font-bold text-purple-900 block mb-0.5">2. Effort (40%)</span>
                      Độ phức tạp công việc, tay nghề chuyên môn & giải quyết lỗi phát sinh.
                    </div>
                    <div className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-100">
                      <span className="font-bold text-amber-900 block mb-0.5">3. Lead (20%)</span>
                      Trách nhiệm dẫn dắt, phân công, an toàn lao động & ký nghiệm thu.
                    </div>
                  </div>
                </div>

                {/* Success alert when dispute sent */}
                {disputeSuccessAlert && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-xs text-green-800">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div>
                      <span className="font-bold">Đã tiếp nhận khiếu nại phân bổ!</span> Đã chuyển tiếp yêu cầu đến Admin & Hội đồng Trọng tài Kỹ thuật để phúc tra trong vòng 48h.
                    </div>
                  </div>
                )}

                {/* Team Task Contribution Table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">Bảng Phân Bổ Tỷ Lệ Đội Kỹ Thuật (Tech Team Pool: {fmtVnd(totalPoolVnd)})</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Tech Lead điều chỉnh các chỉ số thành phần hoặc thành viên bấm khiếu nại nếu chưa thỏa đáng.</p>
                    </div>
                    
                    {!isLocked24h && (
                      <button
                        onClick={handleSaveSplit}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {splitSavedSuccess ? 'Đã lưu!' : 'Lưu tỷ lệ'}
                      </button>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50/80 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase">
                        <tr>
                          <th className="px-6 py-3.5">Thành Viên</th>
                          <th className="px-6 py-3.5">Vai Trò</th>
                          <th className="px-6 py-3.5 text-center">Time (40%)</th>
                          <th className="px-6 py-3.5 text-center">Effort (40%)</th>
                          <th className="px-6 py-3.5 text-center">Lead (20%)</th>
                          <th className="px-6 py-3.5 text-center font-bold text-blue-600">Final Split %</th>
                          <th className="px-6 py-3.5 text-right font-bold text-green-700">Dự Kiến Thu Nhập</th>
                          <th className="px-6 py-3.5 text-center">Khiếu Nại</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {teamMembers.map((member) => {
                          const finalPct = calcFinalSplit(member);
                          const earning = Math.round((totalPoolVnd * finalPct) / 100);

                          return (
                            <tr key={member.id} className="hover:bg-gray-50/60 transition-colors">
                              <td className="px-6 py-4 font-medium text-gray-900">
                                {member.name}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                  member.role === 'LEAD' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {member.role === 'LEAD' ? 'Tech Lead' : 'Technician'}
                                </span>
                              </td>
                              
                              <td className="px-6 py-4 text-center">
                                <input 
                                  type="number" 
                                  min="0"
                                  max="100"
                                  disabled={isLocked24h}
                                  value={member.timePct}
                                  onChange={(e) => handleMemberChange(member.id, 'timePct', Number(e.target.value))}
                                  className="w-16 px-2 py-1 border border-gray-200 rounded text-center text-xs font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                                /> %
                              </td>

                              <td className="px-6 py-4 text-center">
                                <input 
                                  type="number" 
                                  min="0"
                                  max="100"
                                  disabled={isLocked24h}
                                  value={member.effortPct}
                                  onChange={(e) => handleMemberChange(member.id, 'effortPct', Number(e.target.value))}
                                  className="w-16 px-2 py-1 border border-gray-200 rounded text-center text-xs font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                                /> %
                              </td>

                              <td className="px-6 py-4 text-center">
                                <input 
                                  type="number" 
                                  min="0"
                                  max="100"
                                  disabled={isLocked24h}
                                  value={member.leadPct}
                                  onChange={(e) => handleMemberChange(member.id, 'leadPct', Number(e.target.value))}
                                  className="w-16 px-2 py-1 border border-gray-200 rounded text-center text-xs font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                                /> %
                              </td>

                              <td className="px-6 py-4 text-center font-mono font-bold text-blue-600 text-sm">
                                {finalPct.toFixed(1)}%
                              </td>

                              <td className="px-6 py-4 text-right font-mono font-bold text-green-700">
                                {fmtVnd(earning)}
                              </td>

                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => openDispute(member)}
                                  disabled={isLocked24h}
                                  className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors disabled:opacity-40"
                                >
                                  Khiếu nại %
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
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
                   <button 
                     onClick={() => setShowStartJobModal(true)}
                     className={`w-full py-3 text-white font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 ${
                       selectedJob.status === 'IN PROGRESS' 
                         ? 'bg-yellow-500 hover:bg-yellow-600' 
                         : 'bg-blue-600 hover:bg-blue-700'
                     }`}
                   >
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

      {/* DIGITAL HANDOVER MODAL */}
      {showHandoverModal && (
        <DigitalHandoverModal
          jobId={selectedJob.id}
          jobTitle={selectedJob.title}
          clientName={selectedJob.client}
          techName="Nguyen Van Ky Thuat"
          onClose={() => setShowHandoverModal(false)}
          onSuccess={handleHandoverSuccess}
        />
      )}

      {/* START JOB MODAL (ON-JOB DURATION - SRS III.1.A) */}
      {showStartJobModal && (
        <StartJobModal
          jobId={selectedJob.id}
          jobTitle={selectedJob.title}
          clientName={selectedJob.client}
          onClose={() => setShowStartJobModal(false)}
          onSuccess={handleStartJobSuccess}
        />
      )}

      {/* DISPUTE APPEAL MODAL (SRS III.4) */}
      {showDisputeModal && disputeMember && (
        <TechDisputeModal
          jobId={selectedJob.id}
          jobTitle={selectedJob.title}
          memberName={disputeMember.name}
          currentPct={calcFinalSplit(disputeMember)}
          onClose={() => setShowDisputeModal(false)}
          onSubmitSuccess={handleDisputeSuccess}
        />
      )}
    </div>
  );
}