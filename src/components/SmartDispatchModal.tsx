'use client';

import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, UserCheck, Shield, Award, Activity, AlertCircle, Loader2 } from 'lucide-react';

interface CandidateScore {
  technicianId: string;
  technicianName: string;
  skillMatched: boolean;
  isOnline: boolean;
  isAvailable: boolean;
  activeTicketsCount: number;
  compositeScore: number;
  matchRationale: string;
  avatarText: string;
}

interface SmartDispatchModalProps {
  isOpen: boolean;
  ticketId: string;
  ticketTitle: string;
  categoryName?: string;
  onClose: () => void;
  onAssignSuccess: (techId: string, techName: string) => void;
}

const MOCK_CANDIDATES: CandidateScore[] = [
  {
    technicianId: 'TECH-001',
    technicianName: 'Nguyễn Văn Kỹ Thuật (Senior Specialist)',
    skillMatched: true,
    isOnline: true,
    isAvailable: true,
    activeTicketsCount: 1,
    compositeScore: 115.0,
    matchRationale: 'Phù hợp 100% chứng chỉ Cisco/Server (+30đ), Đang Online (+20đ), Tải nhẹ: 1 việc đang chạy (-15đ)',
    avatarText: 'NV',
  },
  {
    technicianId: 'TECH-002',
    technicianName: 'Lê Văn Hải (Network Technician)',
    skillMatched: true,
    isOnline: true,
    isAvailable: true,
    activeTicketsCount: 3,
    compositeScore: 85.0,
    matchRationale: 'Đủ kỹ năng bảo trì (+30đ), Đang Online (+20đ), Đang xử lý 3 tasks (-45đ)',
    avatarText: 'LH',
  },
  {
    technicianId: 'TECH-003',
    technicianName: 'Trần Minh Trí (Junior Tech)',
    skillMatched: false,
    isOnline: true,
    isAvailable: true,
    activeTicketsCount: 0,
    compositeScore: 70.0,
    matchRationale: 'Đang rảnh hoàn toàn (0 task), Đang Online (+20đ), Chưa có chứng chỉ chuyên sâu (-10đ)',
    avatarText: 'TM',
  },
  {
    technicianId: 'TECH-004',
    technicianName: 'Phạm Quốc Hùng (CCTV Specialist)',
    skillMatched: false,
    isOnline: false,
    isAvailable: false,
    activeTicketsCount: 4,
    compositeScore: 30.0,
    matchRationale: 'Lệch chuyên môn (Camera), Đang bận On-Job Duration đến 17:30',
    avatarText: 'PQ',
  },
];

export default function SmartDispatchModal({
  isOpen,
  ticketId,
  ticketTitle,
  categoryName = 'Hạ tầng Mạng & Phần cứng Doanh nghiệp',
  onClose,
  onAssignSuccess,
}: SmartDispatchModalProps) {
  const [candidates, setCandidates] = useState<CandidateScore[]>(MOCK_CANDIDATES);
  const [selectedTechId, setSelectedTechId] = useState<string>(MOCK_CANDIDATES[0].technicianId);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignedDone, setAssignedDone] = useState(false);

  if (!isOpen) return null;

  const topCandidate = candidates[0];
  const currentSelected = candidates.find(c => c.technicianId === selectedTechId) || topCandidate;

  const handleConfirmAssign = () => {
    setIsAssigning(true);
    setTimeout(() => {
      setIsAssigning(false);
      setAssignedDone(true);
      setTimeout(() => {
        onAssignSuccess(currentSelected.technicianId, currentSelected.technicianName);
      }, 1000);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Điều Phối Thông Minh (Smart Dispatch)</h3>
              <p className="text-xs text-gray-500 font-mono">{ticketId} • {ticketTitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {assignedDone ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-gray-900 text-base">Đã phân công thành công!</h4>
            <p className="text-xs text-gray-600">
              Công việc đã được gán tự động cho <strong>{currentSelected.technicianName}</strong>. Kỹ thuật viên sẽ nhận được thông báo ngay lập tức.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Criteria explanation banner */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3.5 text-xs space-y-1">
              <span className="font-bold text-blue-950 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-blue-700" />
                Tiêu chuẩn Thuật toán Phân công Đa Tiêu chí (SRS III.1.A):
              </span>
              <p className="text-blue-900 leading-relaxed">
                Đánh giá tổng hợp <strong>Skillset phù hợp</strong> (chuyên môn kỹ thuật), <strong>Trạng thái Online / Lịch rảnh</strong>, và <strong>Cân bằng tải (Load Balancing)</strong> để tối ưu thời gian xử lý sự cố.
              </p>
            </div>

            {/* Candidate List */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                Xếp hạng Kỹ thuật viên phù hợp ({candidates.length})
              </span>

              {candidates.map((cand, idx) => {
                const isSelected = cand.technicianId === selectedTechId;
                return (
                  <div
                    key={cand.technicianId}
                    onClick={() => setSelectedTechId(cand.technicianId)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50/40 shadow-sm ring-1 ring-blue-500' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                        idx === 0 
                          ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {idx === 0 ? '★ 1' : `#${idx + 1}`}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-900">{cand.technicianName}</span>
                          {idx === 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                              Khuyến nghị nhất
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{cand.matchRationale}</p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-base font-mono font-bold text-blue-700">
                        {cand.compositeScore.toFixed(0)} đ
                      </span>
                      <span className="text-[10px] text-gray-400 block font-medium">Điểm tương thích</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                Đang chọn: <strong className="text-gray-800">{currentSelected.technicianName}</strong>
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Đóng
                </button>
                <button
                  onClick={handleConfirmAssign}
                  disabled={isAssigning}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 active:scale-[0.99] disabled:opacity-50"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  {isAssigning ? 'Đang điều phối...' : 'Phân Công Kỹ Thuật Viên'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}