'use client';

import React, { useState } from 'react';
import { X, Star, ThumbsUp, Send, CheckCircle2, MessageSquare, Award } from 'lucide-react';

interface TicketRatingModalProps {
  isOpen: boolean;
  ticketId: string;
  ticketTitle: string;
  technicianName?: string;
  onClose: () => void;
  onSubmitSuccess: (stars: number, feedback: string) => void;
}

const RATING_TAGS = [
  'Đúng giờ hẹn',
  'Kỹ thuật chuyên sâu',
  'Nhiệt tình & Lịch sự',
  'Giải thích rõ ràng',
  'Dọn dẹp sạch sẽ',
  'Xử lý dứt điểm',
];

export default function TicketRatingModal({
  isOpen,
  ticketId,
  ticketTitle,
  technicianName = 'Kỹ thuật viên phụ trách',
  onClose,
  onSubmitSuccess,
}: TicketRatingModalProps) {
  const [stars, setStars] = useState<number>(5);
  const [hoverStars, setHoverStars] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Đúng giờ hẹn', 'Nhiệt tình & Lịch sự']);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setTimeout(() => {
        onSubmitSuccess(stars, feedback);
      }, 1200);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Đánh Giá Dịch Vụ</h3>
              <p className="text-xs text-gray-500 font-mono">#{ticketId.slice(0, 8)} • {technicianName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-gray-900 text-base">Cảm ơn đánh giá của bạn!</h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Phản hồi của bạn đã được ghi nhận vào hồ sơ chất lượng dịch vụ của kỹ thuật viên.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center py-2">
              <span className="text-xs text-gray-500 block mb-2 font-medium">
                Mức độ hài lòng của bạn về kỹ thuật viên & chất lượng sửa chữa:
              </span>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => {
                  const active = (hoverStars ?? stars) >= s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onMouseEnter={() => setHoverStars(s)}
                      onMouseLeave={() => setHoverStars(null)}
                      onClick={() => setStars(s)}
                      className="p-1 transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          active
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-200 fill-gray-100 hover:text-amber-200'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-bold text-amber-600 mt-2 block">
                {stars === 5 ? '★ Xuất sắc - Rất hài lòng' :
                 stars === 4 ? '★ Tốt - Hài lòng' :
                 stars === 3 ? '★ Trung bình - Tạm ổn' :
                 stars === 2 ? '★ Chưa đạt - Cần cải thiện' : '★ Rất không hài lòng'}
              </span>
            </div>

            {/* Quick Tags */}
            <div>
              <span className="block text-xs font-semibold text-gray-700 mb-2">Điểm bạn ấn tượng nhất:</span>
              <div className="flex flex-wrap gap-1.5">
                {RATING_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detailed feedback */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nhận xét chi tiết (Tùy chọn)
              </label>
              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Chia sẻ thêm cảm nhận của bạn để dịch vụ ngày càng hoàn thiện hơn..."
                className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Để sau
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 transition-all flex items-center gap-2 active:scale-[0.99] disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}