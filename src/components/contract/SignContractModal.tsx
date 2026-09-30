'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, CheckCircle2, RotateCcw, Loader2, FileSignature, ShieldCheck } from 'lucide-react';
import Button from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';

interface SignContractModalProps {
  open: boolean;
  contract: {
    id: string;
    title: string;
    value?: string;
    startDate?: string;
    endDate?: string;
    customerName?: string;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SignContractModal({
  open,
  contract,
  onClose,
  onSuccess,
}: SignContractModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (open) {
      setHasSignature(false);
      setAgreed(false);
      setErrorMsg(null);
      setSignerName(contract?.customerName || '');

      // Initialize canvas
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }, 50);
    }
  }, [open, contract]);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    setHasSignature(true);
    lastPos.current = getPos(e, canvas);
  }, []);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas || !lastPos.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  }, [isDrawing]);

  const endDraw = useCallback(() => {
    setIsDrawing(false);
    lastPos.current = null;
  }, []);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  }, []);

  const handleSign = async () => {
    if (!contract) return;
    if (!signerName.trim()) {
      setErrorMsg('Vui lòng nhập họ tên người đại diện ký hợp đồng');
      return;
    }
    if (!hasSignature) {
      setErrorMsg('Vui lòng ký vào khung chữ ký số bên dưới');
      return;
    }
    if (!agreed) {
      setErrorMsg('Vui lòng xác nhận đồng ý với các điều khoản hợp đồng');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const canvas = canvasRef.current;
    const signatureDataUrl = canvas?.toDataURL('image/png') ?? '';

    try {
      const res = await fetch(`/api/contracts/${contract.id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 2, // SIGNATURE_METHOD: DRAW
          signatureData: signatureDataUrl,
          signerName: signerName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ký hợp đồng không thành công');
      }

      toast.success('Hợp đồng đã được ký số thành công!');
      onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Ký hợp đồng thất bại');
      toast.error(err instanceof Error ? err.message : 'Ký hợp đồng thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !contract) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Ký Số Điện Tử Hợp Đồng</h2>
              <p className="text-xs text-gray-500 font-mono">Mã: #{contract.id.slice(-8)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Contract summary */}
          <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 text-xs space-y-1.5">
            <div className="flex justify-between items-start">
              <span className="text-gray-500 font-medium">Hợp đồng:</span>
              <span className="font-semibold text-gray-900 text-right">{contract.title}</span>
            </div>
            {contract.value && (
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Giá trị:</span>
                <span className="font-bold text-blue-600">{contract.value}</span>
              </div>
            )}
            {contract.startDate && contract.endDate && (
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Thời hạn:</span>
                <span className="text-gray-700">{contract.startDate} — {contract.endDate}</span>
              </div>
            )}
          </div>

          {/* Signer input */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Họ tên Người đại diện ký kết <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Nguyễn Văn A (Giám đốc)"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Signature Canvas */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-700">
                Chữ ký số trực tiếp <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={clearSignature}
                disabled={!hasSignature || submitting}
                className="text-xs text-gray-500 hover:text-red-600 inline-flex items-center gap-1 transition-colors disabled:opacity-40"
              >
                <RotateCcw className="w-3 h-3" /> Ký lại
              </button>
            </div>
            <div className="relative border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white hover:border-blue-400 transition-colors">
              <canvas
                ref={canvasRef}
                width={460}
                height={160}
                className="w-full h-40 touch-none cursor-crosshair block"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />
              {!hasSignature && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-300 text-xs font-medium">
                  Vẽ chữ ký của bạn tại đây
                </div>
              )}
            </div>
          </div>

          {/* Agreement Checkbox */}
          <label className="flex items-start gap-2.5 p-3 rounded-lg border border-blue-100 bg-blue-50/50 cursor-pointer text-xs text-gray-700">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span>
              Tôi xác nhận đại diện cho doanh nghiệp, đã đọc kỹ, hiểu rõ và đồng ý với tất cả điều khoản hợp đồng cùng các phụ lục dịch vụ đính kèm.
            </span>
          </label>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            Hủy bỏ
          </Button>
          <Button
            size="sm"
            onClick={handleSign}
            isLoading={submitting}
            disabled={!hasSignature || !agreed || submitting}
            leftIcon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          >
            Xác nhận ký điện tử
          </Button>
        </div>
      </div>
    </div>
  );
}
