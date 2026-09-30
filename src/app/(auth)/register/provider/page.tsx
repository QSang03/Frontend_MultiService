'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Wrench, 
  Building2, 
  Globe, 
  FileText, 
  CheckCircle2, 
  ArrowLeft, 
  ShieldCheck, 
  AlertCircle,
  ExternalLink,
  Layers
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import internalApiClient from '@/lib/api/internal-client';
import { toast } from '@/components/ui/Toast';

export default function ServiceProviderRegisterPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [companyName, setCompanyName] = useState('');
  const [requestedPlanId, setRequestedPlanId] = useState('STANDARD');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<{
    requestId: string;
    status: string;
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      toast.error('Vui lòng đồng ý với Điều khoản hợp tác dịch vụ đối tác.');
      return;
    }
    if (!companyName.trim()) {
      toast.error('Vui lòng nhập tên công ty / đơn vị cung ứng.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await internalApiClient.post('/api/auth/service-provider/register', {
        companyName: companyName.trim(),
        requestedPlanId,
        website: website.trim(),
        description: description.trim(),
      });

      if (res.data?.success) {
        setSubmittedResult({
          requestId: res.data.requestId || 'REQ-SP-' + Date.now(),
          status: res.data.status || 'PENDING',
          message: res.data.message || 'Hồ sơ đã được nộp thành công.',
        });
        toast.success('Nộp hồ sơ đối tác kỹ thuật thành công!');
      } else {
        toast.error(res.data?.error || 'Lỗi khi gửi hồ sơ.');
      }
    } catch (err) {
      toast.error('Gửi hồ sơ thất bại: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-gray-50 to-blue-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation Back */}
        <div className="flex items-center justify-between">
          <Link
            href="/register"
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại chọn loại tài khoản
          </Link>
          <span className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">
            SRS I.5 • Service Provider Onboarding
          </span>
        </div>

        {/* Header Hero */}
        <div className="bg-white rounded-2xl border border-indigo-100 p-8 shadow-sm text-center">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100">
            <Wrench className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">
            Đăng Ký Đối Tác Kỹ Thuật (Service Provider)
          </h1>
          <p className="text-sm text-gray-600 max-w-xl mx-auto mt-2">
            Gia nhập mạng lưới đơn vị cung ứng chuyên nghiệp. Tiếp nhận yêu cầu dịch vụ kỹ thuật từ hàng trăm doanh nghiệp B2B và khách hàng cá nhân trên nền tảng.
          </p>
        </div>

        {/* Authentication Notice if not logged in */}
        {!isAuthenticated && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-900 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold">Yêu cầu Tài khoản Nền tảng</h3>
                <p className="text-xs text-amber-800 mt-1">
                  Bạn cần có tài khoản cá nhân đã xác thực để liên kết hồ sơ đối tác pháp nhân.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/login?redirect=/register/provider"
                className="px-4 py-2 bg-amber-600 text-white font-bold text-xs rounded-xl hover:bg-amber-700 transition-colors"
              >
                Đăng nhập ngay
              </Link>
              <Link
                href="/register/personal"
                className="px-4 py-2 border border-amber-300 bg-white text-amber-900 font-semibold text-xs rounded-xl hover:bg-amber-100 transition-colors"
              >
                Đăng ký tài khoản mới
              </Link>
            </div>
          </div>
        )}

        {/* Success Confirmation State */}
        {submittedResult ? (
          <div className="bg-white rounded-2xl border border-green-200 p-8 shadow-sm text-center space-y-4">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Hồ Sơ Đã Được Tiếp Nhận!</h2>
            <p className="text-xs text-gray-600 max-w-md mx-auto">
              {submittedResult.message}
            </p>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 max-w-md mx-auto text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Mã hồ sơ:</span>
                <span className="font-mono font-bold text-gray-900">{submittedResult.requestId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Trạng thái:</span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 font-bold rounded">
                  ● CHỜ THẨM ĐỊNH (PENDING)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Thời gian phản hồi dự kiến:</span>
                <span className="font-semibold text-gray-800">Trong vòng 24 - 48 giờ làm việc</span>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800"
              >
                Về Trang chủ
              </button>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm space-y-6">
            {/* User Representative Info */}
            {isAuthenticated && user && (
              <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs flex items-center justify-between">
                <div>
                  <span className="text-gray-500">Người đại diện nộp hồ sơ:</span>
                  <div className="font-bold text-gray-900 text-sm mt-0.5">{user.name || user.email}</div>
                  <div className="text-gray-500 text-[11px]">{user.email}</div>
                </div>
                <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-[11px]">
                  Tài khoản đã xác thực
                </span>
              </div>
            )}

            <div className="space-y-4">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                Thông tin Pháp nhân Doanh nghiệp / Tổ chức
              </h2>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tên Công ty / Đơn vị cung ứng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!isAuthenticated || isSubmitting}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ví dụ: Công ty Cổ phần Dịch vụ Kỹ thuật Nam Á"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-gray-50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-gray-400" />
                    Gói dịch vụ đăng ký
                  </label>
                  <select
                    value={requestedPlanId}
                    disabled={!isAuthenticated || isSubmitting}
                    onChange={(e) => setRequestedPlanId(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-gray-50 font-semibold"
                  >
                    <option value="STANDARD">Standard (Cơ bản - KTV độc lập)</option>
                    <option value="PROFESSIONAL">Professional (Chuyên nghiệp - Đội ngũ &lt; 20 KTV)</option>
                    <option value="ENTERPRISE">Enterprise (Tổng thầu / Đơn vị ủy quyền bảo hành)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-gray-400" />
                    Website / Portfolio đối tác
                  </label>
                  <input
                    type="url"
                    disabled={!isAuthenticated || isSubmitting}
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://congtykythuat.vn"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                  Mô tả Năng lực Kỹ thuật, Lĩnh vực chuyên môn & Địa bàn hoạt động
                </label>
                <textarea
                  rows={4}
                  disabled={!isAuthenticated || isSubmitting}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả các dịch vụ chính cung cấp (Điện toán, mạng văn phòng, máy in, CCTV, thiết bị gia dụng...), số lượng KTV và khu vực hoạt động (Hà Nội, TP.HCM...)..."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-gray-50"
                />
              </div>
            </div>

            {/* Terms & Guarantees */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-3">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div className="text-gray-600 space-y-1">
                  <span className="font-bold text-gray-900">Cam kết chất lượng & Bảo mật dữ liệu</span>
                  <p>
                    Đối tác cam kết tuân thủ quy chuẩn dịch vụ SLA, cung cấp linh kiện minh bạch và bảo mật toàn bộ thông tin hệ thống khách hàng theo thỏa thuận hợp tác.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  disabled={!isAuthenticated || isSubmitting}
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300"
                />
                <label htmlFor="agreeTerms" className="text-xs text-gray-700 cursor-pointer font-medium">
                  Tôi đại diện doanh nghiệp đồng ý với <span className="text-indigo-600 font-semibold hover:underline">Quy chế hoạt động đối tác kỹ thuật</span> của nền tảng.
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                href="/register"
                className="px-5 py-2.5 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Hủy bỏ
              </Link>
              <button
                type="submit"
                disabled={!isAuthenticated || isSubmitting}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang gửi hồ sơ...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Gửi Hồ Sơ Thẩm Định
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
