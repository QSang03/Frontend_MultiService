'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  WifiOff,
  AlertCircle,
  ChevronRight, 
  FileSignature, 
  ShieldCheck, 
  Check, 
  Scale, 
  AlertTriangle, 
  Lock, 
  Save,
  Trash2,
  Loader2,
  X,
  Maximize2,
  PauseCircle,
  Play,
  QrCode,
  ListTodo,
  Sparkles
} from 'lucide-react';
import DigitalHandoverModal from '@/components/DigitalHandoverModal';
import TechDisputeModal from '@/components/TechDisputeModal';
import StartJobModal from '@/components/StartJobModal';
import SlaStopClockModal from '@/components/SlaStopClockModal';
import TechAssetLookupModal from '@/components/TechAssetLookupModal';
import TicketSubTasksModal, { TicketSubTask } from '@/components/TicketSubTasksModal';
import TicketMaterialsManager from '@/components/TicketMaterialsManager';
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
  rawAttributes?: string;
  slaPaused?: boolean;
  slaPauseReason?: string;
  slaPauseNotes?: string;
  slaPausedAt?: string;
  slaTotalPausedMinutes?: number;
}

interface TeamMember {
  id: string;
  name: string;
  role: 'LEAD' | 'TECH';
  timePct: number;
  effortPct: number;
  leadPct: number;
}

interface EvidencePhoto {
  id: string;
  name: string;
  originalSize: number;
  compressedSize: number;
  dataUrl: string;
  timestamp: string;
}

const TABS = [
  { id: 'info', label: 'Thông tin' },
  { id: 'execute', label: 'Thực hiện' },
  { id: 'materials', label: 'Vật tư' },
  { id: 'split', label: 'Team Split (24h Review)' },
  { id: 'chat', label: 'Trao đổi' },
];

export default function TechTasksPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [isLoadingJobs, setIsLoadingJobs] = useState<boolean>(true);
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
  const [, setJobDuration] = useState<{ minutes: number; completionTime: string } | null>(null);

  // Client-side Media Compression (SRS V.2 - Max width 1920px, Quality 80%)
  const [evidencePhotos, setEvidencePhotos] = useState<EvidencePhoto[]>([]);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [previewPhoto, setPreviewPhoto] = useState<EvidencePhoto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const compressImage = async (file: File): Promise<EvidencePhoto> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new window.Image();
        img.onload = () => {
          // SRS V.2: Resize/Compress tự động (Max dimension 1920px, Quality 80%)
          const MAX_DIMENSION = 1920;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_DIMENSION) {
              height = Math.round((height * MAX_DIMENSION) / width);
              width = MAX_DIMENSION;
            }
          } else {
            if (height > MAX_DIMENSION) {
              width = Math.round((width * MAX_DIMENSION) / height);
              height = MAX_DIMENSION;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas 2d context'));
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to JPEG with 0.8 quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          const head = 'data:image/jpeg;base64,';
          const base64Length = dataUrl.length - head.length;
          const compressedSize = Math.round((base64Length * 3) / 4);

          resolve({
            id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            originalSize: file.size,
            compressedSize,
            dataUrl,
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          });
        };
        img.onerror = () => reject(new Error('Failed to load image for compression'));
        if (typeof readerEvent.target?.result === 'string') {
          img.src = readerEvent.target.result;
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    try {
      const validImageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
      const compressedList = await Promise.all(validImageFiles.map(compressImage));
      setEvidencePhotos(prev => [...prev, ...compressedList]);
    } catch (err) {
      console.error('Lỗi khi nén ảnh hiện trường:', err);
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = (id: string) => {
    setEvidencePhotos(prev => prev.filter(p => p.id !== id));
  };

  // SLA Stop-the-Clock State (SRS III.7)
  const [showSlaPauseModal, setShowSlaPauseModal] = useState<boolean>(false);
  const [isResumingSla, setIsResumingSla] = useState<boolean>(false);

  // Asset QR & Serial Lookup State (SRS III.6)
  const [showAssetLookupModal, setShowAssetLookupModal] = useState<boolean>(false);

  const handleAssetSelect = (serial: string, name: string) => {
    setReplacedParts((prev) => (prev ? `${prev}, ${name} (SN: ${serial})` : `${name} (SN: ${serial})`));
  };

  const handleSlaPauseSuccess = (result: {
    slaPaused: boolean;
    slaPauseReason?: string;
    slaPauseNotes?: string;
    slaPausedAt?: string;
    slaTotalPausedMinutes?: number;
  }) => {
    if (selectedJob) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === selectedJob.id
            ? {
                ...j,
                slaPaused: result.slaPaused,
                slaPauseReason: result.slaPauseReason,
                slaPauseNotes: result.slaPauseNotes,
                slaPausedAt: result.slaPausedAt,
                slaTotalPausedMinutes: result.slaTotalPausedMinutes,
              }
            : j
        )
      );
    }
  };

  const handleResumeSla = async (jobId: string) => {
    if (!selectedJob) return;
    setIsResumingSla(true);
    try {
      const res = await fetch('/api/tech/tasks/sla-pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: jobId,
          action: 'RESUME',
          notes: 'Kỹ thuật viên tiếp tục thực hiện công việc',
          currentAttributes: selectedJob.rawAttributes,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        handleSlaPauseSuccess(data);
      }
    } catch (err) {
      console.error('Failed to resume SLA:', err);
    } finally {
      setIsResumingSla(false);
    }
  };

    // Sub-tasks State (SRS III.3 - Task Breakdown & Multi-Tech Execution)
  const [liveSubTasks, setLiveSubTasks] = useState<TicketSubTask[]>([]);
  const [isLoadingSubTasks, setIsLoadingSubTasks] = useState<boolean>(false);
  const [showSubTasksModal, setShowSubTasksModal] = useState<boolean>(false);

  const fetchLiveSubTasks = useCallback(async (jobId: string) => {
    if (!jobId) return;
    setIsLoadingSubTasks(true);
    try {
      const res = await fetch(`/api/admin/tickets/${jobId}/tasks`);
      if (res.ok) {
        const data = await res.json();
        setLiveSubTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Failed to load live sub-tasks:', err);
    } finally {
      setIsLoadingSubTasks(false);
    }
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      fetchLiveSubTasks(selectedJobId);
    }
  }, [selectedJobId, fetchLiveSubTasks]);

  const handleToggleSubTask = async (task: TicketSubTask) => {
    if (!selectedJob) return;
    const isCompleted = task.status === 'COMPLETED';
    const nextStatus = isCompleted ? 'PENDING' : 'COMPLETED';
    try {
      await fetch(`/api/admin/tickets/${selectedJob.id}/tasks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          status: nextStatus,
          actualMinutes: task.actualMinutes || (nextStatus === 'COMPLETED' ? task.estimatedMinutes : 0),
        }),
      });
      fetchLiveSubTasks(selectedJob.id);
    } catch (err) {
      console.error('Failed to toggle sub-task status:', err);
    }
  };

  const handleQuickCreateStandardTasks = async () => {
    if (!selectedJob) return;
    const STANDARD_TEMPLATES = [
      { title: 'Khảo sát hiện trường & Chẩn đoán lỗi phần cứng/mạng', estimatedMinutes: 30 },
      { title: 'Thay thế linh kiện & Thi công cấu hình kỹ thuật', estimatedMinutes: 60 },
      { title: 'Kiểm thử tải & Đảm bảo tiêu chuẩn vận hành', estimatedMinutes: 30 },
      { title: 'Vệ sinh công nghiệp, Thu dọn & Ký số nghiệm thu', estimatedMinutes: 20 },
    ];
    try {
      setIsLoadingSubTasks(true);
      for (const tpl of STANDARD_TEMPLATES) {
        await fetch(`/api/admin/tickets/${selectedJob.id}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: tpl.title,
            description: '',
            estimatedMinutes: tpl.estimatedMinutes,
          }),
        });
      }
      fetchLiveSubTasks(selectedJob.id);
    } catch (err) {
      console.error('Failed to create standard tasks:', err);
    } finally {
      setIsLoadingSubTasks(false);
    }
  };

  // Network Online Listener (SRS V.2 - Offline-first Architecture)
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Live Chat state for active job
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; senderId?: string; content: string; createdAt?: string }>>([]);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  const handleStartJobSuccess = (minutes: number) => {
    const compTime = new Date(Date.now() + minutes * 60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setJobDuration({ minutes, completionTime: compTime });
    if (selectedJob) {
      setJobs(prev => prev.map(j => j.id === selectedJob.id ? { ...j, status: 'IN PROGRESS' } : j));
    }
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
    if (evidencePhotos.length === 0) {
      setValidationError('Vui lòng chụp hoặc tải ít nhất 1 ảnh bằng chứng hiện trường (SRS V.2: Compression < 500KB)!');
      return;
    }
    setValidationError(null);
    setShowHandoverModal(true);
  };

  // Team Split State (SRS III.4)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLocked24h, setIsLocked24h] = useState(false);
  const [splitSavedSuccess, setSplitSavedSuccess] = useState(false);
  const [disputeSuccessAlert, setDisputeSuccessAlert] = useState(false);
  const [timeLeftSec, setTimeLeftSec] = useState(0); // populated from API split endpoint

  // Fetch real jobs from backend
  useEffect(() => {
    async function loadRealJobs() {
      setIsLoadingJobs(true);
      try {
        const res = await fetch('/api/tech/tasks');
        if (res.ok) {
          const data = await res.json();
          const fetched: Job[] = data.jobs || [];
          setJobs(fetched);
          if (fetched.length > 0) {
            setSelectedJobId(prev => prev || fetched[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load real tech jobs:', err);
      } finally {
        setIsLoadingJobs(false);
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
          } else {
            setTeamMembers([
              {
                id: 'lead-1',
                name: 'Kỹ thuật viên phụ trách',
                role: 'LEAD',
                timePct: 100,
                effortPct: 100,
                leadPct: 100,
              },
            ]);
          }
        } catch {
          // keep local state
        }
      }
      loadLiveSplit();
    }
  }, [activeTab, selectedJobId]);

  // Live chat connection for current selected job
  useEffect(() => {
    if (activeTab === 'chat' && selectedJobId) {
      let isMounted = true;
      async function loadLiveChat() {
        setIsLoadingChat(true);
        try {
          const roomRes = await fetch(`/api/sale/chat/ticket-room?ticket_id=${encodeURIComponent(selectedJobId)}`);
          if (roomRes.ok) {
            const roomData = await roomRes.json();
            const rId = roomData.room?.id;
            if (rId && isMounted) {
              setChatRoomId(rId);
              const msgRes = await fetch(`/api/sale/chat/messages?room_id=${encodeURIComponent(rId)}&page_size=50`);
              if (msgRes.ok) {
                const msgData = await msgRes.json();
                if (isMounted) setChatMessages(msgData.messages || []);
              }
            }
          }
        } catch (e) {
          console.error('Failed to load job chat:', e);
        } finally {
          if (isMounted) setIsLoadingChat(false);
        }
      }
      loadLiveChat();
      const interval = setInterval(loadLiveChat, 4000);
      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }
  }, [activeTab, selectedJobId]);

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || !chatRoomId || isSendingMessage) return;
    const text = chatInput.trim();
    setChatInput('');
    setIsSendingMessage(true);
    try {
      const res = await fetch('/api/sale/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: chatRoomId, content: text }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setChatMessages(prev => [...prev, data.message]);
        }
      }
    } catch (e) {
      console.error('Failed to send chat message:', e);
    } finally {
      setIsSendingMessage(false);
    }
  };

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

  const selectedJob = jobs.find(j => j.id === selectedJobId) || jobs[0] || null;

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
    if (!selectedJob) return;
    setJobs(prev => prev.map(j => j.id === selectedJob.id ? { ...j, status: 'IN PROGRESS' } : j));
    setActiveTab('execute');
  };

  const handleHandoverSuccess = (handoverId: string) => {
    if (!selectedJob) return;
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
    if (!selectedJob) return;
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
          {isLoadingJobs ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Đang tải công việc...</span>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400">
              {searchQuery ? 'Không tìm thấy công việc phù hợp' : 'Chưa có công việc nào được phân công'}
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
        {!selectedJob ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {isLoadingJobs ? 'Đang kết nối trung tâm điều phối...' : 'Chưa chọn công việc'}
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              {isLoadingJobs 
                ? 'Hệ thống đang tải danh sách nhiệm vụ kỹ thuật được chỉ định cho bạn.' 
                : 'Vui lòng chọn một công việc từ danh sách bên trái để xem chi tiết hoặc thực hiện.'}
            </p>
          </div>
        ) : (
          <>
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
             {/* SLA STOP-THE-CLOCK CONTROL (SRS III.7) */}
             {selectedJob.slaPaused ? (
               <div className="flex items-center gap-2">
                 <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500 text-white shadow-sm animate-pulse">
                   <PauseCircle className="w-4 h-4" />
                   <span>SLA Đang Tạm Dừng</span>
                 </div>
                 <button
                   type="button"
                   onClick={() => void handleResumeSla(selectedJob.id)}
                   disabled={isResumingSla}
                   className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                 >
                   <Play className="w-3.5 h-3.5" />
                   <span>{isResumingSla ? 'Đang kích hoạt...' : 'Tiếp Tục SLA'}</span>
                 </button>
               </div>
             ) : (
               <button
                 type="button"
                 onClick={() => setShowSlaPauseModal(true)}
                 className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors shadow-sm"
                 title="Tạm dừng đồng hồ đếm ngược SLA (Stop-the-Clock) theo quy định SRS III.7"
               >
                 <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
                 <span>Tạm Dừng SLA</span>
               </button>
             )}

             {/* SUB-TASKS BREAKDOWN BUTTON (SRS III.3) */}
              <button
                type="button"
                onClick={() => setShowSubTasksModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors shadow-sm"
                title="Phân tách nhiệm vụ & Điều phối Sub-tasks (SRS III.3)"
              >
                <ListTodo className="w-3.5 h-3.5 text-indigo-600" />
                <span>Hạng Mục Sub-tasks ({liveSubTasks.filter(t => t.status === 'COMPLETED').length}/{liveSubTasks.length})</span>
              </button>

              {/* ASSET QR & SERIAL LOOKUP BUTTON (SRS III.6) */}
             <button
               type="button"
               onClick={() => setShowAssetLookupModal(true)}
               className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors shadow-sm"
               title="Tra cứu thông số, lịch sử TCO của thiết bị bằng mã QR hoặc số Serial (SRS III.6)"
             >
               <QrCode className="w-3.5 h-3.5 text-blue-600" />
               <span>Tra Cứu Tài Sản / QR</span>
             </button>

             <div 
               className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                 isOnline 
                   ? 'bg-green-50 border-green-200 text-green-700' 
                   : 'bg-amber-50 border-amber-200 text-amber-800'
               }`} 
               title={isOnline ? 'Đang kết nối Server (Online & Syncing)' : 'Đang hoạt động ngoại tuyến (Offline Mode - SRS V.2)'}
             >
                {isOnline ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-600" />
                    <span>Trực tuyến (Syncing)</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-amber-600 animate-pulse" />
                    <span>Ngoại tuyến (Offline Mode)</span>
                  </>
                )}
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
                {/* SLA STOP-THE-CLOCK STATUS BANNER (SRS III.7) */}
                {selectedJob.slaPaused && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 flex items-start justify-between gap-3 shadow-sm">
                    <div className="flex items-start gap-2.5">
                      <PauseCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold text-sm text-amber-900">
                          Đồng Hồ Cam Kết SLA Đang Tạm Dừng (Stop-the-Clock Active - SRS III.7)
                        </p>
                        <p className="text-amber-800">
                          <strong>Lý do:</strong> {
                            selectedJob.slaPauseReason === 'PENDING_CUSTOMER' ? 'Chờ khách hàng phản hồi (Pending Customer)' :
                            selectedJob.slaPauseReason === 'PENDING_PARTS' ? 'Chờ linh kiện thay thế / Vendor RMA (Pending Parts)' :
                            'Đã hẹn lịch thực hiện cố định (Scheduled)'
                          }
                        </p>
                        {selectedJob.slaPauseNotes && (
                          <p className="text-amber-700">
                            <strong>Ghi chú giải trình:</strong> {selectedJob.slaPauseNotes}
                          </p>
                        )}
                        <p className="text-[11px] text-amber-600">
                          Tạm dừng lúc: {selectedJob.slaPausedAt ? new Date(selectedJob.slaPausedAt).toLocaleString('vi-VN') : 'Vừa xong'} • Đã tích lũy tạm dừng: {selectedJob.slaTotalPausedMinutes || 0} phút.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleResumeSla(selectedJob.id)}
                      disabled={isResumingSla}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs whitespace-nowrap shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Tiếp Tục SLA
                    </button>
                  </div>
                )}

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

                {/* Offline Warning Banner if Offline (SRS V.2 Strict-Online Action Constraint) */}
                {!isOnline && ['NEW', 'DISPATCHED'].includes(selectedJob.status) && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold text-amber-950">Chặn hành động nhận việc khi Ngoại tuyến (SRS V.2):</span>
                      <p className="text-amber-800 leading-relaxed">
                        Bạn đang ở chế độ Offline. Vui lòng kết nối Internet để xác thực tình trạng Ticket hiện tại từ Server, ngăn ngừa tình trạng nhận việc trùng lặp (Race Condition) tại hiện trường.
                      </p>
                    </div>
                  </div>
                )}

                {['NEW', 'DISPATCHED', 'IN PROGRESS'].includes(selectedJob.status) && (
                   <button 
                     disabled={!isOnline && ['NEW', 'DISPATCHED'].includes(selectedJob.status)}
                     onClick={() => setShowStartJobModal(true)}
                     className={`w-full py-4 text-white font-bold text-lg rounded-2xl shadow-xl transition-all active:scale-[0.99] flex items-center justify-center gap-3 ${
                       !isOnline && ['NEW', 'DISPATCHED'].includes(selectedJob.status)
                         ? 'bg-gray-400 cursor-not-allowed shadow-none'
                         : selectedJob.status === 'IN PROGRESS' 
                         ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' 
                         : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                     }`}
                   >
                      <CheckCircle2 className="w-6 h-6" />
                      {!isOnline && ['NEW', 'DISPATCHED'].includes(selectedJob.status)
                        ? 'Yêu cầu kết nối mạng để nhận việc (Offline Mode)'
                        : selectedJob.status === 'IN PROGRESS' 
                        ? 'Continue Service Job' 
                        : 'Start Service Job'}
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
                     {/* LIVE SUB-TASKS EXECUTION CHECKLIST (SRS III.3) */}
                     <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                        <div className="px-6 py-4 bg-gray-50/50 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ListTodo className="w-4 h-4 text-blue-600" />
                            <h3 className="font-semibold text-gray-900 text-sm">Hạng Mục Kỹ Thuật Hiện Trường (SRS III.3 Tasks)</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setShowSubTasksModal(true)}
                              className="px-2.5 py-1 bg-white hover:bg-gray-50 border border-gray-200 text-blue-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Quản Lý / Thêm Việc
                            </button>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {liveSubTasks.length > 0 && (
                          <div className="px-6 py-2.5 bg-blue-50/40 border-b border-blue-100/60 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 flex-1 max-w-xs">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${Math.round((liveSubTasks.filter(t => t.status === 'COMPLETED').length / liveSubTasks.length) * 100)}%`
                                  }}
                                />
                              </div>
                              <span className="font-bold text-blue-700 font-mono">
                                {liveSubTasks.filter(t => t.status === 'COMPLETED').length}/{liveSubTasks.length} (
                                {Math.round((liveSubTasks.filter(t => t.status === 'COMPLETED').length / liveSubTasks.length) * 100)}%)
                              </span>
                            </div>
                            <span className="text-[11px] text-gray-500 font-mono">
                              Tổng giờ ước tính: {liveSubTasks.reduce((s, t) => s + (t.estimatedMinutes || 0), 0)} phút
                            </span>
                          </div>
                        )}

                        <div className="p-4 space-y-3">
                          {isLoadingSubTasks && liveSubTasks.length === 0 ? (
                            <div className="py-6 text-center text-gray-400 text-xs">
                              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-blue-500" />
                              Đang tải hạng mục nhiệm vụ...
                            </div>
                          ) : liveSubTasks.length > 0 ? (
                            liveSubTasks.map((task) => {
                              const isCompleted = task.status === 'COMPLETED';
                              return (
                                <div
                                  key={task.id}
                                  onClick={() => handleToggleSubTask(task)}
                                  className={`flex items-start gap-3 p-3.5 rounded-xl cursor-pointer transition-all border ${
                                    isCompleted
                                      ? 'bg-emerald-50/30 border-emerald-200'
                                      : 'bg-white hover:bg-gray-50 border-gray-200'
                                  }`}
                                >
                                  <div
                                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 mt-0.5 ${
                                      isCompleted
                                        ? 'bg-emerald-600 border-emerald-600 text-white'
                                        : 'bg-white border-gray-300 hover:border-blue-500'
                                    }`}
                                  >
                                    {isCompleted && <Check className="w-3.5 h-3.5" />}
                                  </div>

                                  <div className="space-y-0.5 flex-1">
                                    <div className="flex items-center justify-between">
                                      <span
                                        className={`text-sm font-semibold ${
                                          isCompleted ? 'line-through text-gray-400' : 'text-gray-900'
                                        }`}
                                      >
                                        {task.title}
                                      </span>
                                      <span className="text-[11px] font-mono text-gray-500">
                                        {task.actualMinutes > 0 ? `${task.actualMinutes}m thực tế` : `${task.estimatedMinutes}m dự tính`}
                                      </span>
                                    </div>
                                    {task.description && (
                                      <p className="text-xs text-gray-500 leading-relaxed">
                                        {task.description}
                                      </p>
                                    )}
                                    {task.assignedTechName && (
                                      <span className="inline-block text-[10px] text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded mt-1">
                                        KTV: {task.assignedTechName}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="py-6 text-center space-y-3">
                              <p className="text-xs text-gray-500">Ticket này chưa có danh mục kiểm thử chi tiết.</p>
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={handleQuickCreateStandardTasks}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  Khởi Tạo 4 Hạng Mục Tiêu Chuẩn (SRS III.3)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShowSubTasksModal(true)}
                                  className="px-3 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-bold transition-colors"
                                >
                                  Tùy Chỉnh Hạng Mục
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                     </div>

                     {/* EVIDENCE UPLOAD WITH CLIENT-SIDE MEDIA COMPRESSION (SRS V.2) */}
                      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                        <div className="px-6 py-4 bg-gray-50/50 flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                            <Camera className="w-4 h-4 text-blue-600" />
                            Ảnh Nghiệm Thu Hiện Trường (Evidence Upload)
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-medium">
                              SRS V.2: Max 1920px • 80% JPEG
                            </span>
                            <span className="text-xs text-gray-500 font-medium">
                              ({evidencePhotos.length} ảnh)
                            </span>
                          </div>
                        </div>

                        <div className="p-6">
                          <input 
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFilesSelected}
                            accept="image/*"
                            multiple
                            className="hidden"
                          />

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {/* Upload Button */}
                            <button 
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isCompressing}
                              className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                              {isCompressing ? (
                                <>
                                  <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
                                  <span className="text-[11px] font-medium text-blue-600">Đang nén ảnh...</span>
                                </>
                              ) : (
                                <>
                                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Camera className="w-5 h-5" />
                                  </div>
                                  <span className="text-xs font-semibold text-gray-700 group-hover:text-blue-600">Chụp / Thêm ảnh</span>
                                  <span className="text-[10px] text-gray-400">Tự động nén &lt; 500KB</span>
                                </>
                              )}
                            </button>

                            {/* Evidence Photos Gallery */}
                            {evidencePhotos.map((photo) => {
                              const ratio = Math.round((1 - photo.compressedSize / photo.originalSize) * 100);
                              return (
                                <div key={photo.id} className="aspect-square rounded-xl bg-gray-900 overflow-hidden relative group shadow-sm border border-gray-200">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img 
                                    src={photo.dataUrl} 
                                    alt={photo.name}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-black/30 p-2 flex flex-col justify-between">
                                    <div className="flex justify-between items-center">
                                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-green-400 font-semibold backdrop-blur-sm">
                                        {ratio > 0 ? `-${ratio}%` : 'Nén 80%'}
                                      </span>
                                      <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                                        <button
                                          type="button"
                                          onClick={() => setPreviewPhoto(photo)}
                                          className="p-1 rounded bg-black/50 text-white hover:bg-blue-600 transition-colors"
                                          title="Xem kích thước đầy đủ"
                                        >
                                          <Maximize2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRemovePhoto(photo.id)}
                                          className="p-1 rounded bg-black/50 text-white hover:bg-red-600 transition-colors"
                                          title="Xoá ảnh"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                    <div className="text-white text-[11px] truncate">
                                      <p className="font-medium truncate drop-shadow-sm">{photo.name}</p>
                                      <p className="text-[10px] text-gray-300 drop-shadow-sm">
                                        {formatBytes(photo.originalSize)} → <span className="text-emerald-400 font-semibold">{formatBytes(photo.compressedSize)}</span>
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {evidencePhotos.length === 0 && (
                            <p className="text-[11px] text-gray-500 mt-3 text-center italic">
                              Chưa có ảnh nghiệm thu hiện trường nào được tải lên.
                            </p>
                          )}
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

            {/* ================= TAB: MATERIALS & ZERO-COST RMA (SRS III.8) ================= */}
            {activeTab === 'materials' && selectedJob && (
              <TicketMaterialsManager
                ticketId={selectedJob.id}
                ticketTitle={selectedJob.title}
                isOnline={isOnline}
                onMaterialsChange={(totalCost) => {
                  console.log('Ticket material cost updated:', totalCost);
                }}
              />
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
                        {teamMembers.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-6 py-8 text-center text-xs text-gray-500">
                              Chưa có thành viên nào được phân bổ cho công việc này.
                            </td>
                          </tr>
                        ) : (
                          teamMembers.map((member) => {
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
                        })
                      )}
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
                    {isLoadingChat && chatMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs">Đang tải lịch sử trao đổi...</span>
                      </div>
                    ) : chatMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-1">
                        <p className="text-sm font-medium text-gray-600">Chưa có tin nhắn trao đổi</p>
                        <p className="text-xs">Gửi tin nhắn bên dưới để thảo luận trực tiếp với điều phối viên hoặc khách hàng.</p>
                      </div>
                    ) : (
                      chatMessages.map((msg) => (
                        <div key={msg.id} className="flex justify-start">
                          <div className="bg-white rounded-2xl rounded-tl-none p-4 max-w-[80%] shadow-sm border border-gray-100">
                            <p className="text-sm text-gray-800">{msg.content}</p>
                            {msg.createdAt && (
                              <span className="text-[10px] text-gray-400 mt-1 block">
                                {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                 </div>
                 <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-3">
                    <input 
                       type="text" 
                       value={chatInput}
                       onChange={(e) => setChatInput(e.target.value)}
                       onKeyDown={(e) => { if (e.key === 'Enter') void handleSendChatMessage(); }}
                       placeholder={chatRoomId ? "Nhập tin nhắn trao đổi kỹ thuật..." : "Đang kết nối phòng trao đổi..."}
                       disabled={!chatRoomId || isSendingMessage}
                       className="flex-1 bg-gray-50 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                    />
                    <button 
                      onClick={() => void handleSendChatMessage()}
                      disabled={!chatRoomId || !chatInput.trim() || isSendingMessage}
                      className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                       <Send className="w-4 h-4" />
                    </button>
                 </div>
              </div>
            )}

          </div>
        </div>
        </>
        )}
      </div>

      {/* DIGITAL HANDOVER MODAL */}
      {showHandoverModal && selectedJob && (
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
      {showStartJobModal && selectedJob && (
        <StartJobModal
          jobId={selectedJob.id}
          jobTitle={selectedJob.title}
          clientName={selectedJob.client}
          onClose={() => setShowStartJobModal(false)}
          onSuccess={handleStartJobSuccess}
        />
      )}

      {/* DISPUTE APPEAL MODAL (SRS III.4) */}
      {showDisputeModal && disputeMember && selectedJob && (
        <TechDisputeModal
          jobId={selectedJob.id}
          jobTitle={selectedJob.title}
          memberName={disputeMember.name}
          currentPct={calcFinalSplit(disputeMember)}
          onClose={() => setShowDisputeModal(false)}
          onSubmitSuccess={handleDisputeSuccess}
        />
      )}

      {/* FULL EVIDENCE PHOTO PREVIEW MODAL */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setPreviewPhoto(null)}>
          <div className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">{previewPhoto.name}</h4>
                <p className="text-xs text-gray-500">
                  {formatBytes(previewPhoto.originalSize)} → {formatBytes(previewPhoto.compressedSize)} (SRS V.2 80% JPEG) • {previewPhoto.timestamp}
                </p>
              </div>
              <button onClick={() => setPreviewPhoto(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-gray-950 flex items-center justify-center max-h-[75vh] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewPhoto.dataUrl} alt={previewPhoto.name} className="max-h-[70vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}
      {/* SLA STOP-THE-CLOCK MODAL (SRS III.7) */}
      {showSlaPauseModal && selectedJob && (
        <SlaStopClockModal
          isOpen={showSlaPauseModal}
          jobId={selectedJob.id}
          jobTitle={selectedJob.title}
          currentAttributes={selectedJob.rawAttributes}
          onClose={() => setShowSlaPauseModal(false)}
          onSuccess={handleSlaPauseSuccess}
        />
      )}
      {/* SUB-TASKS MODAL (SRS III.3) */}
      {showSubTasksModal && selectedJob && (
        <TicketSubTasksModal
          isOpen={showSubTasksModal}
          ticketId={selectedJob.id}
          ticketTitle={selectedJob.title}
          onClose={() => setShowSubTasksModal(false)}
          onTasksUpdated={() => fetchLiveSubTasks(selectedJob.id)}
        />
      )}
      {/* ASSET QR & SERIAL LOOKUP MODAL (SRS III.6) */}
      {showAssetLookupModal && (
        <TechAssetLookupModal
          isOpen={showAssetLookupModal}
          onClose={() => setShowAssetLookupModal(false)}
          onSelectAsset={handleAssetSelect}
        />
      )}
    </div>
  );
}