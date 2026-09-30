'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Sparkles, CheckCircle2, UserCheck, Award, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

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

export default function SmartDispatchModal({
  isOpen,
  ticketId,
  ticketTitle,
  categoryName = 'Hạ tầng Mạng & Phần cứng Doanh nghiệp',
  onClose,
  onAssignSuccess,
}: SmartDispatchModalProps) {
  const [candidates, setCandidates] = useState<CandidateScore[]>([]);
  const [selectedTechId, setSelectedTechId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignedDone, setAssignedDone] = useState(false);

  const fetchCandidates = useCallback(async () => {
    if (!ticketId) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}/smart-dispatch`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể tải danh sách kỹ thuật viên');
      }
      const list: CandidateScore[] = data.candidateRanking || [];
      setCandidates(list);
      if (list.length > 0) {
        setSelectedTechId(list[0].technicianId);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Lỗi tải danh sách kỹ thuật viên');
    } finally {
      setIsLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    if (isOpen) {
      setAssignedDone(false);
      setAssignError(null);
      fetchCandidates();
    }
  }, [isOpen, fetchCandidates]);

  if (!isOpen) return null;

  const topCandidate = candidates[0];
  const currentSelected = candidates.find(c => c.technicianId === selectedTechId) || topCandidate;

  const handleConfirmAssign = async () => {
    if (!currentSelected) return;
    setIsAssigning(true);
    setAssignError(null);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}/smart-dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicianId: currentSelected.technicianId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Phân công kỹ thuật viên thất bại');
      }
      setAssignedDone(true);
      setTimeout(() => {
        onAssignSuccess(currentSelected.technicianId, currentSelected.technicianName);
      }, 1000);
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'Lỗi hệ thống');
    } finally {
      setIsAssigning(false);
    }
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
              Công việc đã được gán tự động cho <strong>{currentSelected?.technicianName}</strong>. Kỹ thuật viên sẽ nhận được thông báo ngay lập tức.
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

            {assignError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{assignError}</span>
              </div>
            )}

            {/* Candidate List */}
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-500">
                <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
                <span className="text-xs font-medium">Đang tính toán xếp hạng thuật toán phân công...</span>
              </div>
            ) : loadError ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <p className="text-xs text-red-600">{loadError}</p>
                <button
                  onClick={fetchCandidates}
                  className="px-3 py-1.5 rounded-lg border text-xs text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Thử lại
                </button>
              </div>
            ) : candidates.length === 0 ? (
              <div className="py-8 text-center space-y-2 text-gray-500">
                <p className="text-xs">Hiện chưa có kỹ thuật viên khả dụng trong hệ thống.</p>
                <button
                  onClick={fetchCandidates}
                  className="px-3 py-1.5 rounded-lg border text-xs text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Tải lại
                </button>
              </div>
            ) : (
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
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                {currentSelected ? (
                  <>Đang chọn: <strong className="text-gray-800">{currentSelected.technicianName}</strong></>
                ) : (
                  'Chưa chọn kỹ thuật viên'
                )}
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
                  disabled={isAssigning || !currentSelected || candidates.length === 0}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 active:scale-[0.99] disabled:opacity-50"
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Đang điều phối...
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      Phân Công Kỹ Thuật Viên
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}