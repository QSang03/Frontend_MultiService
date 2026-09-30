'use client';

import { useState } from 'react';
import { X, Loader2, Sparkles } from 'lucide-react';

interface QuickQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function QuickQuoteModal({ isOpen, onClose, onSuccess }: QuickQuoteModalProps) {
  const [prospectName, setProspectName] = useState('');
  const [service, setService] = useState('');
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prospectName.trim() || !service || !price) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const formattedPrice = new Intl.NumberFormat('vi-VN').format(Number(price));
      const res = await fetch('/api/sale/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `[Báo giá nhanh] ${service} - ${prospectName}`,
          description: `Yêu cầu báo giá nhanh: Dịch vụ ${service} với ngân sách dự kiến ${formattedPrice} ₫ cho khách hàng ${prospectName}.`,
          priority: 'medium',
          attributes: JSON.stringify({
            prospectName,
            service,
            estimatedPrice: Number(price),
            source: 'QUICK_QUOTE_BUILDER',
          }),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gửi yêu cầu báo giá thất bại');
      }

      setProspectName('');
      setService('');
      setPrice('');
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi hệ thống khi tạo báo giá');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Báo Giá Nhanh (Quick Quote)</h2>
              <p className="text-xs text-gray-500">Tạo cơ hội bán hàng & ước lượng chi phí ban đầu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
              {errorMsg}
            </div>
          )}

          {/* Prospect Name */}
          <div>
            <label htmlFor="prospectName" className="block text-xs font-semibold text-gray-700 mb-1.5">
              Tên Khách Hàng / Doanh Nghiệp <span className="text-red-500">*</span>
            </label>
            <input
              id="prospectName"
              type="text"
              placeholder="VD: Anh Minh - Công ty CP Alpha"
              value={prospectName}
              onChange={(e) => setProspectName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Service Interest */}
          <div>
            <label htmlFor="service" className="block text-xs font-semibold text-gray-700 mb-1.5">
              Hạng Mục Dịch Vụ Quan Tâm <span className="text-red-500">*</span>
            </label>
            <select
              id="service"
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              required
            >
              <option value="">Chọn dịch vụ...</option>
              <option value="Bảo trì máy chủ & Data Center">Bảo trì máy chủ & Data Center</option>
              <option value="Di chuyển hệ thống Cloud (AWS/Azure/GCP)">Di chuyển hệ thống Cloud</option>
              <option value="Thiết lập hạ tầng mạng văn phòng">Thiết lập hạ tầng mạng văn phòng</option>
              <option value="Hỗ trợ IT Helpdesk Onsite & Remote">Hỗ trợ IT Helpdesk</option>
              <option value="Nâng cấp phần cứng & Thiết bị lưu trữ">Nâng cấp phần cứng máy chủ</option>
            </select>
          </div>

          {/* Estimated Price */}
          <div>
            <label htmlFor="price" className="block text-xs font-semibold text-gray-700 mb-1.5">
              Giá Ước Tính (VNĐ) <span className="text-red-500">*</span>
            </label>
            <input
              id="price"
              type="number"
              min="0"
              step="100000"
              placeholder="VD: 5000000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                'Tạo Báo Giá Ngay'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
