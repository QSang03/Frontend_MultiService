'use client';

import React, { useState } from 'react';
import { X, Clock, Play, AlertCircle, CheckCircle2, Timer } from 'lucide-react';

interface StartJobModalProps {
  jobId: string;
  jobTitle: string;
  clientName: string;
  onClose: () => void;
  onSuccess: (estimatedMinutes: number, notes: string) => void;
}

const PRESET_DURATIONS = [
  { minutes: 30, label: '30 phút', desc: 'Xử lý nhanh / Cấu hình mạng cơ bản' },
  { minutes: 60, label: '1 giờ', desc: 'Tiêu chuẩn: Bảo trì, kiểm tra định kỳ' },
  { minutes: 120, label: '2 giờ', desc: 'Phức tạp: Thay thế linh kiện, cài đặt lại OS' },
  { minutes: 240, label: '4 giờ', desc: 'Dự án lớn: Tủ Rack, Server, Kéo cáp hệ thống' },
];

export default function StartJobModal({
  jobId,
  jobTitle,
  clientName,
  onClose,
  onSuccess,
}: StartJobModalProps) {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(60);
  const [isCustom, setIsCustom] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(90);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const durationToUse = isCustom ? customMinutes : selectedMinutes;

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/tech/tasks/start-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: jobId,
          estimatedDurationMinutes: durationToUse,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Bắt đầu nhiệm vụ thất bại');
      }

      onSuccess(durationToUse, notes);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi kết nối khi bắt đầu nhiệm vụ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Bắt Đầu Nhiệm Vụ (Start Job)</h3>
              <p className="text-xs text-gray-500 font-mono">{jobId} • {clientName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleStart} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
              {errorMsg}
            </div>
          )}
          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 space-y-1">
            <span className="font-bold flex items-center gap-1 text-blue-950">
              <Clock className="w-3.5 h-3.5 text-blue-700" />
              Ước tính thời gian thực hiện (On-Job Duration):
            </span>
            <p>
              Hệ thống sẽ cập nhật trạng thái của bạn thành <strong>BUSY</strong> và hiển thị thời gian kết thúc dự kiến cho Điều Phối Viên để không gán trùng lịch.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Chọn thời lượng ước tính
            </label>
            <div className="space-y-2">
              {PRESET_DURATIONS.map((preset) => (
                <label
                  key={preset.minutes}
                  onClick={() => { setSelectedMinutes(preset.minutes); setIsCustom(false); }}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    !isCustom && selectedMinutes === preset.minutes
                      ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="duration"
                      checked={!isCustom && selectedMinutes === preset.minutes}
                      onChange={() => { setSelectedMinutes(preset.minutes); setIsCustom(false); }}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-bold text-sm text-gray-900">{preset.label}</span>
                      <p className="text-xs text-gray-500">{preset.desc}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-600">
                    {preset.minutes}m
                  </span>
                </label>
              ))}

              <label
                onClick={() => setIsCustom(true)}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  isCustom
                    ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="duration"
                    checked={isCustom}
                    onChange={() => setIsCustom(true)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-bold text-sm text-gray-900">Tùy chỉnh số phút</span>
                </div>
                {isCustom && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="15"
                      max="480"
                      step="15"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(Number(e.target.value))}
                      className="w-20 px-2 py-1 text-xs border border-gray-300 rounded-lg text-center font-bold font-mono focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-500">phút</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Ghi chú hiện trường (Tùy chọn)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Đã có mặt tại phòng máy chủ tầng 3, chuẩn bị đồ nghề..."
              className="w-full p-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 active:scale-[0.99] disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {submitting ? 'Đang kích hoạt...' : `Bắt đầu (${durationToUse} phút)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}