'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Monitor,
  Printer,
  Wifi,
  Shield,
  Clock,
  CheckCircle2,
  ArrowRight,
  Send,
  Smartphone,
  Mail,
  Wrench,
  Zap,
  Users,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import { STORAGE_KEYS, getDashboardByRole } from '@/constants';

function getUserRole(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    if (stored) {
      const user = JSON.parse(stored);
      return user.role as string | undefined;
    }
  } catch {
    // ignore
  }
  return undefined;
}

type GuestStep = 'form' | 'otp' | 'done';
type Category = { id: string; name: string; attributesSchema?: string };
type SchemaField = {
  key: string;
  title: string;
  type: string;
  enum?: Array<string | number | boolean>;
  description?: string;
  required: boolean;
};

export default function LandingPage() {
  const router = useRouter();
  const isGuest = !getUserRole();
  const [ready] = useState(isGuest);

  // Guest checkout state
  const [guestStep, setGuestStep] = useState<GuestStep>('form');
  const [contactType, setContactType] = useState<'phone' | 'email'>('phone');
  const [contactValue, setContactValue] = useState('');
  const [guestName, setGuestName] = useState('');
  const [issueDesc, setIssueDesc] = useState('');
  const [issueCategory, setIssueCategory] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [guestId, setGuestId] = useState('');
  const [, setVerifiedToken] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [schemaFields, setSchemaFields] = useState<SchemaField[]>([]);
  const [attributes, setAttributes] = useState<Record<string, string>>({});

  useEffect(() => {
    const role = getUserRole();
    if (role) {
      router.replace(getDashboardByRole(role));
    } else {
      // Fetch categories from API
      fetch('/api/admin/catalog/categories?show_approved=true&page_size=50&public=true')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.categories?.length) {
            setCategories(data.categories.map((c: Record<string, unknown>) => ({
              id: String(c.id ?? ''),
              name: String(c.name ?? ''),
              attributesSchema: c.attributesSchema ? String(c.attributesSchema) : undefined,
            })));
          }
        })
        .catch(() => { /* fallback: empty categories, user can still submit */ });
    }
  }, [router]);

  // Get category name from fetched categories
  const getCategoryName = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    return cat?.name || catId;
  };

  // Parse attributesSchema and update dynamic fields when category changes
  const handleCategoryChange = (catId: string) => {
    setIssueCategory(catId);
    setAttributes({});
    if (!catId) {
      setSchemaFields([]);
      return;
    }
    const cat = categories.find(c => c.id === catId);
    if (!cat?.attributesSchema) {
      setSchemaFields([]);
      return;
    }
    try {
      const parsed = JSON.parse(cat.attributesSchema) as Record<string, unknown>;
      const props = (parsed.properties as Record<string, Record<string, unknown>> | undefined) || {};
      const required = (parsed.required as string[] | undefined) || [];
      const fields: SchemaField[] = Object.entries(props).map(([key, val]) => ({
        key,
        title: String(val?.title ?? key),
        type: String(val?.type ?? 'string').toLowerCase(),
        enum: Array.isArray(val?.enum) ? (val.enum as Array<string | number | boolean>) : undefined,
        description: val?.description ? String(val.description) : undefined,
        required: required.includes(key),
      }));
      setSchemaFields(fields);
    } catch {
      setSchemaFields([]);
    }
  };

  const handleGuestSubmit = async () => {
    setGuestError('');
    if (!contactValue.trim()) {
      setGuestError(contactType === 'phone' ? 'Vui lòng nhập số điện thoại' : 'Vui lòng nhập email');
      return;
    }
    if (!issueDesc.trim()) {
      setGuestError('Vui lòng mô tả sự cố');
      return;
    }
    setGuestLoading(true);
    try {
      // Step 1: CreateGuest
      const guestPayload: Record<string, string> = {
        name: guestName.trim() || (contactType === 'phone' ? contactValue : contactValue.split('@')[0]),
      };
      if (contactType === 'email') {
        guestPayload.email = contactValue.trim();
      } else {
        guestPayload.phone = contactValue.trim();
      }
      const guestRes = await fetch('/api/sale/crm/create-guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guestPayload),
      });
      const guestData = await guestRes.json();

      if (!guestRes.ok) {
        setGuestError(guestData.error || 'Không thể tạo yêu cầu. Vui lòng thử lại.');
        setGuestLoading(false);
        return;
      }
      const newGuestId = guestData.guest_id;
      setGuestId(newGuestId);

      // Step 2: SendAccountOtp
      const otpRes = await fetch('/api/sale/crm/send-account-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_id: newGuestId,
          channel: contactType === 'email' ? 'EMAIL' : 'SMS',
        }),
      });
      const otpData = await otpRes.json();
      if (!otpRes.ok) {
        setGuestError(otpData.error || 'Không thể gửi mã OTP. Vui lòng thử lại.');
        setGuestLoading(false);
        return;
      }

      setGuestLoading(false);
      setGuestStep('otp');
    } catch {
      setGuestError('Lỗi kết nối. Vui lòng thử lại.');
      setGuestLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    setGuestError('');
    if (otpCode.length < 4) {
      setGuestError('Vui lòng nhập mã OTP');
      return;
    }
    setGuestLoading(true);
    try {
      // Step 3: VerifyAccountOtp
      const verifyRes = await fetch('/api/sale/crm/verify-account-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_id: guestId,
          otp_code: otpCode,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        setGuestError(verifyData.error || 'Mã OTP không đúng. Vui lòng thử lại.');
        setGuestLoading(false);
        return;
      }
      const guestToken = verifyData.verified_token || verifyData.token || '';
      setVerifiedToken(guestToken);

      // Step 4: Song song — CreateTicket + ConvertGuestToCustomer (ngầm)
      const ticketTitle = getCategoryName(issueCategory) || issueDesc.slice(0, 50);

      // Việc 1: CreateTicket bằng Guest Token (khách thấy kết quả)
      const ticketPromise = fetch('/api/sale/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(guestToken ? { 'X-Guest-Token': guestToken } : {}),
        },
        body: JSON.stringify({
          category_id: issueCategory || 'other',
          title: ticketTitle,
          description: issueDesc,
          priority: 'medium',
          attributes: JSON.stringify(attributes),
        }),
      });

      // Việc 2: ConvertGuestToCustomer (chạy ngầm - Silent Profile Creation)
      const convertPromise = fetch('/api/sale/crm/convert-guest-to-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_id: guestId,
          verified_token: guestToken,
        }),
      }).catch(() => { /* silent — không ảnh hưởng UX */ });

      // Chờ cả 2, nhưng chỉ quan tâm kết quả ticket
      const [ticketRes] = await Promise.all([ticketPromise, convertPromise]);

      const ticketData = await ticketRes.json();
      if (!ticketRes.ok) {
        setGuestError(ticketData.error || 'Không thể tạo ticket. Vui lòng thử lại.');
        setGuestLoading(false);
        return;
      }
      const newTicketId = ticketData.ticket?.id || ticketData.ticket?.ticket_id || ticketData.ticket_id || 'N/A';
      setTicketId(newTicketId);
      setGuestLoading(false);
      setGuestStep('done');
    } catch {
      setGuestError('Lỗi kết nối. Vui lòng thử lại.');
      setGuestLoading(false);
    }
  };

  const resetGuest = () => {
    setGuestStep('form');
    setContactValue('');
    setGuestName('');
    setIssueDesc('');
    setIssueCategory('');
    setOtpCode('');
    setGuestError('');
    setTicketId('');
    setGuestId('');
    setVerifiedToken('');
    setSchemaFields([]);
    setAttributes({});
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center font-bold text-2xl text-white shadow-lg mx-auto mb-4 animate-pulse">
            M
          </div>
          <p className="text-gray-500">Đang chuyển hướng...</p>
        </div>
      </div>
    );
  }

  const services = [
    { icon: Printer, label: 'Sửa máy in', color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: Monitor, label: 'Sửa máy tính', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: Wifi, label: 'Mạng & Internet', color: 'text-violet-600', bg: 'bg-violet-50' },
    { icon: Shield, label: 'Bảo mật CNTT', color: 'text-red-600', bg: 'bg-red-50' },
    { icon: Wrench, label: 'Bảo trì thiết bị', color: 'text-amber-600', bg: 'bg-amber-50' },
    { icon: Zap, label: 'Hỗ trợ phần mềm', color: 'text-cyan-600', bg: 'bg-cyan-50' },
  ];

  const stats = [
    { value: '10,000+', label: 'Ticket đã xử lý' },
    { value: '99.5%', label: 'Khách hàng hài lòng' },
    { value: '<2h', label: 'Thời gian phản hồi' },
    { value: '500+', label: 'Doanh nghiệp tin dùng' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-md">
              M
            </div>
            <span className="text-xl font-bold text-gray-900">MultiService</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#services" className="hover:text-blue-600 transition-colors">Dịch vụ</a>
            <a href="#guest" className="hover:text-blue-600 transition-colors">Gửi yêu cầu nhanh</a>
            <a href="#features" className="hover:text-blue-600 transition-colors">Tính năng</a>
            <a href="#enterprise" className="hover:text-blue-600 transition-colors">Doanh nghiệp</a>
          </nav>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
          >
            Đăng nhập
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                Nền tảng IT Multi-Service #1 Việt Nam
              </div>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
                Dịch vụ IT
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> nhanh chóng</span>
                <br />không rào cản
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-lg">
                Sửa máy in, máy tính, mạng và hơn thế nữa. Gửi yêu cầu chỉ với SĐT hoặc Email — không cần đăng ký, không cần mật khẩu.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#guest"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 text-base"
                >
                  Gửi yêu cầu ngay
                  <Send className="w-5 h-5" />
                </a>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:border-blue-300 hover:text-blue-600 transition-colors text-base"
                >
                  Đăng nhập tài khoản
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="hidden lg:flex justify-center">
              <div className="relative w-[400px] h-[400px]">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl rotate-6" />
                <div className="absolute inset-0 bg-white rounded-3xl shadow-2xl p-8 flex flex-col justify-center gap-5">
                  {[
                    { icon: CheckCircle2, text: 'Nhập SĐT hoặc Email', color: 'text-emerald-500' },
                    { icon: Send, text: 'Mô tả sự cố', color: 'text-blue-500' },
                    { icon: Clock, text: 'Xác thực OTP', color: 'text-amber-500' },
                    { icon: CheckCircle2, text: 'Ticket được tạo ngay!', color: 'text-emerald-500' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center ${s.color}`}>
                        <s.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium">Bước {i + 1}</p>
                        <p className="text-sm font-semibold text-gray-800">{s.text}</p>
                      </div>
                      {i < 3 && <div className="ml-auto w-px h-8 bg-gray-100" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-extrabold text-gray-900">{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="services" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Dịch vụ của chúng tôi</h2>
          <p className="text-gray-500 max-w-lg mx-auto">Đa dạng dịch vụ IT, từ sửa chữa phần cứng đến hỗ trợ phần mềm và bảo mật hệ thống</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <div key={i} className="group p-6 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all cursor-pointer">
              <div className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <s.icon className={`w-6 h-6 ${s.color}`} />
              </div>
              <h3 className="font-semibold text-gray-900">{s.label}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Guest Checkout Section */}
      <section id="guest" className="bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl font-bold mb-4">Gửi yêu cầu nhanh — Không cần tài khoản</h2>
              <p className="text-blue-100 text-lg mb-6">
                Chỉ cần SĐT hoặc Email, mô tả sự cố và xác thực OTP. Hệ thống sẽ tạo ticket ngay lập tức, không cần đăng ký hay mật khẩu.
              </p>
              <div className="space-y-4 text-blue-100">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 text-emerald-300 shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Guest Checkout</p>
                    <p className="text-sm">Nhập SĐT/Email + mô tả lỗi → OTP → Ticket được tạo ngay</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 text-emerald-300 shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Tự động lưu lịch sử</p>
                    <p className="text-sm">Hệ thống tạo hồ sơ ẩn, tra cứu lại bằng SĐT/Email bất cứ lúc nào</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 text-emerald-300 shrink-0" />
                  <div>
                    <p className="font-semibold text-white">Gộp tài khoản thông minh</p>
                    <p className="text-sm">Khi đăng ký chính thức, lịch sử cũ tự động gộp vào tài khoản mới</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Guest Form */}
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 text-gray-900">
              {guestStep === 'form' && (
                <>
                  <h3 className="text-xl font-bold mb-6">Mô tả sự cố của bạn</h3>

                  {/* Contact type toggle */}
                  <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
                    <button
                      onClick={() => { setContactType('phone'); setContactValue(''); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        contactType === 'phone' ? 'bg-white shadow text-blue-600' : 'text-gray-500'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" /> Số điện thoại
                    </button>
                    <button
                      onClick={() => { setContactType('email'); setContactValue(''); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        contactType === 'email' ? 'bg-white shadow text-blue-600' : 'text-gray-500'
                      }`}
                    >
                      <Mail className="w-4 h-4" /> Email
                    </button>
                  </div>

                  {/* Contact input */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {contactType === 'phone' ? 'Số điện thoại' : 'Email'}
                    </label>
                    <input
                      type={contactType === 'phone' ? 'tel' : 'email'}
                      value={contactValue}
                      onChange={(e) => setContactValue(e.target.value)}
                      placeholder={contactType === 'phone' ? '0901 234 567' : 'email@example.com'}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    />
                  </div>

                  {/* Name (optional) */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Họ tên <span className="text-gray-400">(không bắt buộc)</span>
                    </label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    />
                  </div>

                  {/* Category */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Loại dịch vụ</label>
                    <select
                      value={issueCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white"
                    >
                      <option value="">-- Chọn loại dịch vụ --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Dynamic schema fields */}
                  {schemaFields.length > 0 && (
                    <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                      <p className="text-xs font-medium text-gray-500 mb-3">Thông tin bổ sung</p>
                      <div className="grid grid-cols-1 gap-3">
                        {schemaFields.map((field) => (
                          <div key={field.key}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {field.title} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            {field.enum && field.enum.length > 0 ? (
                              <select
                                value={attributes[field.key] ?? ''}
                                onChange={(e) => setAttributes(prev => ({ ...prev, [field.key]: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white"
                              >
                                <option value="">Chọn {field.title}</option>
                                {field.enum.map((v) => (
                                  <option key={`${field.key}-${String(v)}`} value={String(v)}>{String(v)}</option>
                                ))}
                              </select>
                            ) : field.type === 'boolean' ? (
                              <select
                                value={attributes[field.key] ?? ''}
                                onChange={(e) => setAttributes(prev => ({ ...prev, [field.key]: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white"
                              >
                                <option value="">Chọn {field.title}</option>
                                <option value="true">Có</option>
                                <option value="false">Không</option>
                              </select>
                            ) : (
                              <input
                                type={field.type === 'number' || field.type === 'integer' ? 'number' : 'text'}
                                step={field.type === 'integer' ? '1' : field.type === 'number' ? 'any' : undefined}
                                value={attributes[field.key] ?? ''}
                                onChange={(e) => setAttributes(prev => ({ ...prev, [field.key]: e.target.value }))}
                                placeholder={field.description || `Nhập ${field.title}`}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Issue description */}
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả sự cố *</label>
                    <textarea
                      value={issueDesc}
                      onChange={(e) => setIssueDesc(e.target.value)}
                      rows={3}
                      placeholder="VD: Máy in Canon không in được, đèn nhấp nháy đỏ..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none"
                    />
                  </div>

                  {guestError && (
                    <p className="text-red-500 text-sm mb-4">{guestError}</p>
                  )}

                  <button
                    onClick={handleGuestSubmit}
                    disabled={guestLoading}
                    className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {guestLoading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Gửi & nhận mã OTP
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </>
              )}

              {guestStep === 'otp' && (
                <>
                  <h3 className="text-xl font-bold mb-2">Xác thực OTP</h3>
                  <p className="text-gray-500 text-sm mb-6">
                    Mã xác thực đã được gửi tới{' '}
                    <span className="font-semibold text-gray-700">{contactValue}</span>
                  </p>

                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nhập mã OTP</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center text-2xl tracking-[0.5em] font-mono"
                    />
                  </div>

                  {guestError && (
                    <p className="text-red-500 text-sm mb-4">{guestError}</p>
                  )}

                  <button
                    onClick={handleOtpVerify}
                    disabled={guestLoading}
                    className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {guestLoading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Xác nhận & Tạo Ticket
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setGuestStep('form')}
                    className="w-full mt-3 py-2.5 text-gray-500 text-sm hover:text-gray-700 transition-colors"
                  >
                    ← Quay lại
                  </button>
                </>
              )}

              {guestStep === 'done' && (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Ticket đã được tạo!</h3>
                  <p className="text-gray-500 mb-1">Mã ticket của bạn:</p>
                  <p className="text-2xl font-mono font-bold text-blue-600 mb-4">{ticketId}</p>
                  <p className="text-sm text-gray-400 mb-6">
                    Bạn có thể tra cứu trạng thái bằng {contactType === 'phone' ? 'SĐT' : 'Email'}: <span className="font-medium text-gray-600">{contactValue}</span>
                  </p>
                  <div className="space-y-3">
                    <Link
                      href="/login"
                      className="block w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-center"
                    >
                      Đăng nhập để theo dõi chi tiết
                    </Link>
                    <button
                      onClick={resetGuest}
                      className="w-full py-2.5 text-gray-500 text-sm hover:text-gray-700 transition-colors"
                    >
                      Gửi yêu cầu khác
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Tại sao chọn MultiService?</h2>
          <p className="text-gray-500">Nền tảng quản lý dịch vụ IT toàn diện cho cá nhân và doanh nghiệp</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Zap,
              title: 'Không rào cản',
              desc: 'Gửi yêu cầu chỉ với SĐT/Email, xác thực OTP. Không cần đăng ký tài khoản phức tạp.',
              color: 'text-blue-600',
              bg: 'bg-blue-50',
            },
            {
              icon: Clock,
              title: 'Phản hồi nhanh chóng',
              desc: 'Hệ thống tự động gán kỹ thuật viên phù hợp. Theo dõi trạng thái ticket real-time.',
              color: 'text-emerald-600',
              bg: 'bg-emerald-50',
            },
            {
              icon: Shield,
              title: 'Bảo mật & Minh bạch',
              desc: 'Báo giá rõ ràng, thanh toán an toàn. Lịch sử dịch vụ được lưu trữ đầy đủ.',
              color: 'text-violet-600',
              bg: 'bg-violet-50',
            },
          ].map((f, i) => (
            <div key={i} className="p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
              <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                <f.icon className={`w-6 h-6 ${f.color}`} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Enterprise CTA */}
      <section id="enterprise" className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-4">
                <Users className="w-4 h-4" /> Dành cho doanh nghiệp
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Giải pháp B2B cho doanh nghiệp</h2>
              <p className="text-gray-600 mb-6">
                Quản lý ticket theo phòng ban, quy trình phê duyệt, cost center, SLA tracking, quản lý tài sản IT và hợp đồng — tất cả trong một nền tảng duy nhất.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { icon: Users, label: 'Quản lý thành viên' },
                  { icon: BarChart3, label: 'Báo cáo & Analytics' },
                  { icon: Shield, label: 'Phê duyệt đa cấp' },
                  { icon: Monitor, label: 'Quản lý tài sản IT' },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <f.icon className="w-4 h-4 text-emerald-600 shrink-0" />
                    {f.label}
                  </div>
                ))}
              </div>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
              >
                Đăng nhập B2B Portal
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="hidden lg:block">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="space-y-4">
                  {[
                    { label: 'IT Department', budget: '85%', color: 'bg-blue-500', amount: '85M / 100M' },
                    { label: 'HR Department', budget: '62%', color: 'bg-emerald-500', amount: '31M / 50M' },
                    { label: 'Marketing', budget: '40%', color: 'bg-violet-500', amount: '12M / 30M' },
                  ].map((d, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{d.label}</span>
                        <span className="text-gray-400">{d.amount}</span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${d.color} rounded-full`} style={{ width: d.budget }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                  <span className="text-gray-500">SLA Compliance</span>
                  <span className="font-bold text-emerald-600">92.3%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center font-bold text-sm text-white">
                M
              </div>
              <span className="font-semibold text-white">MultiService</span>
            </div>
            <p className="text-sm">© 2026 MultiService. Nền tảng quản lý dịch vụ IT đa năng.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
