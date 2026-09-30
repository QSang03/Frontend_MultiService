'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  CalendarDays, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  ArrowRight,
  Briefcase
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

const daysOfWeek = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

interface Job {
  id: string;
  title: string;
  client: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'NEW' | 'DISPATCHED' | 'IN PROGRESS' | 'COMPLETED' | 'CANCELLED';
  address: string;
  distance: string;
  time: string;
  dueDate: string;
  description: string;
  createdAt?: string;
  targetResolutionAt?: string;
}

export default function TechSchedulePage() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const currentYear = currentDate.getFullYear();
  const currentMonthIdx = currentDate.getMonth();

  useEffect(() => {
    let cancelled = false;
    async function loadTasks() {
      setLoading(true);
      try {
        const res = await fetch('/api/tech/tasks');
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.jobs) {
            setJobs(data.jobs);
          }
        }
      } catch (err) {
        console.error('Failed to load tech jobs:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadTasks();
    return () => { cancelled = true; };
  }, []);

  // Calendar math
  const firstDayOfMonth = new Date(currentYear, currentMonthIdx, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonthIdx + 1, 0);
  const totalDaysInMonth = lastDayOfMonth.getDate();

  // Day of week index (Monday = 0, Sunday = 6)
  const startingDayIndex = (firstDayOfMonth.getDay() + 6) % 7;

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonthIdx - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonthIdx + 1, 1));
  };

  const monthLabel = currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

  // Map jobs to YYYY-MM-DD
  const jobsByDate = useMemo(() => {
    const map: Record<string, Job[]> = {};
    jobs.forEach((job) => {
      const dateStr = job.targetResolutionAt || job.createdAt;
      let key = '';
      if (dateStr) {
        try {
          const d = new Date(dateStr);
          key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        } catch {}
      }
      if (!key) {
        const d = new Date();
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
      if (!map[key]) map[key] = [];
      map[key].push(job);
    });
    return map;
  }, [jobs]);

  const selectedKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const selectedDayJobs = jobsByDate[selectedKey] || [];

  const today = new Date();
  const isSelectedToday = selectedDate.toDateString() === today.toDateString();

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Lịch Trình Kỹ Thuật Viên</h1>
          <p className="text-xs text-gray-500 mt-0.5">Theo dõi lịch điều phối, tuyến đường và hạn cam kết SLA theo ngày</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-2xs">
          <button 
            type="button"
            onClick={prevMonth} 
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs sm:text-sm font-bold text-gray-800 capitalize min-w-[120px] text-center">
            {monthLabel}
          </span>
          <button 
            type="button"
            onClick={nextMonth} 
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {daysOfWeek.map((day) => (
            <div key={day} className="py-2.5 text-center text-xs font-bold text-gray-600 bg-gray-50/75">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
          {Array.from({ length: 42 }, (_, i) => {
            const dayNum = i - startingDayIndex + 1;
            const isCurrentMonth = dayNum > 0 && dayNum <= totalDaysInMonth;
            
            const cellDate = new Date(currentYear, currentMonthIdx, dayNum);
            const isToday = isCurrentMonth && cellDate.toDateString() === today.toDateString();
            const isSelected = isCurrentMonth && cellDate.toDateString() === selectedDate.toDateString();

            const dateKey = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const dayJobs = isCurrentMonth ? jobsByDate[dateKey] || [] : [];

            return (
              <button
                type="button"
                key={i}
                disabled={!isCurrentMonth}
                onClick={() => isCurrentMonth && setSelectedDate(cellDate)}
                className={`min-h-[85px] sm:min-h-[105px] p-2 text-left transition-all relative flex flex-col justify-between ${
                  !isCurrentMonth ? 'bg-gray-50/40 text-gray-300 cursor-default' : 'hover:bg-purple-50/40 cursor-pointer'
                } ${isSelected ? 'bg-purple-50 ring-2 ring-purple-500 ring-inset z-10' : ''}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-xs font-bold ${
                    isToday ? 'bg-purple-600 text-white w-5 h-5 rounded-full flex items-center justify-center shadow-xs' : isCurrentMonth ? 'text-gray-800' : 'text-gray-300'
                  }`}>
                    {isCurrentMonth ? dayNum : ''}
                  </span>

                  {dayJobs.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                      {dayJobs.length} việc
                    </span>
                  )}
                </div>

                {isCurrentMonth && dayJobs.length > 0 && (
                  <div className="mt-1 space-y-1 w-full overflow-hidden">
                    {dayJobs.slice(0, 2).map((j) => (
                      <div 
                        key={j.id} 
                        className={`text-[10px] truncate px-1.5 py-0.5 rounded font-medium ${
                          j.priority === 'Critical' ? 'bg-red-100 text-red-700 font-bold' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {j.title}
                      </div>
                    ))}
                    {dayJobs.length > 2 && (
                      <p className="text-[10px] text-gray-400 font-semibold pl-1">
                        +{dayJobs.length - 2} nhiệm vụ
                      </p>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Schedule */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-purple-600" />
              {isSelectedToday ? 'Lịch trình hôm nay' : `Lịch trình ngày ${selectedDate.toLocaleDateString('vi-VN')}`}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {selectedDayJobs.length} nhiệm vụ kỹ thuật được chỉ định
            </p>
          </div>
          <Link
            href="/tech/tasks"
            className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            Quản lý tasks <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-purple-600 animate-spin mb-2" />
            <p className="text-xs text-gray-500">Đang tải lịch trình kỹ thuật...</p>
          </div>
        ) : selectedDayJobs.length === 0 ? (
          <EmptyState
            title="Không có lịch điều phối"
            description={isSelectedToday ? "Hôm nay chưa có yêu cầu bảo trì hoặc sự cố khẩn cấp nào cần xử lý." : `Chưa có công việc nào được lên lịch vào ngày ${selectedDate.toLocaleDateString('vi-VN')}.`}
          />
        ) : (
          <div className="space-y-3">
            {selectedDayJobs.map((job) => (
              <div 
                key={job.id} 
                className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg mt-0.5 ${
                    job.priority === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'
                  }`}>
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-gray-900">{job.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        job.priority === 'Critical' ? 'bg-red-100 text-red-700' : job.priority === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {job.priority}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                        {job.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 font-medium mt-1">{job.client}</p>
                    <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {job.address}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" /> SLA: {job.dueDate}
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/tech/tasks?jobId=${job.id}`}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold whitespace-nowrap self-end sm:self-center transition-colors shadow-2xs"
                >
                  Chi tiết & Nghiệm thu
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
