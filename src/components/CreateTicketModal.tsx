import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface OrgCreditBalance {
  orgId?: string;
  creditLimit?: string;
  availableCredit?: string;
  outstandingBalance?: string;
}

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (ticket: { subject: string; client: string; priority: string }) => void | Promise<void>;
  clientData?: { id?: string; orgId?: string; name?: string };
}

export default function CreateTicketModal({ isOpen, onClose, onCreate, clientData }: CreateTicketModalProps) {
  const [subject, setSubject] = useState('');
  const [client, setClient] = useState('');
  const [priority, setPriority] = useState('Medium (24h)');
  const [orgCreditBalance, setOrgCreditBalance] = useState<OrgCreditBalance | null>(null);
  const [showCreditWarning, setShowCreditWarning] = useState(false);
  const [, setPendingTicketSubmit] = useState(false);
  const [loadingCredit, setLoadingCredit] = useState(false);

  if (!isOpen) return null;

  const formatCurrency = (value?: string): string => {
    if (!value) return '0 ₫';
    const num = parseFloat(String(value).replace(/[^\d.-]/g, ''));
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const handleSubmit = async () => {
    // Check credit balance if clientData with orgId is available
    if (clientData?.orgId) {
      setLoadingCredit(true);
      try {
        const creditRes = await fetch(`/api/sale/commissions/org-credit/${encodeURIComponent(clientData.orgId)}`);
        const creditData = await creditRes.json();
        if (creditRes.ok && creditData?.data) {
          setOrgCreditBalance(creditData.data);
          const outstanding = parseFloat(String(creditData.data?.outstandingBalance ?? '0').replace(/[^\d.-]/g, ''));
          if (outstanding > 0) {
            setPendingTicketSubmit(true);
            setShowCreditWarning(true);
            setLoadingCredit(false);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to fetch credit balance:', err);
        // Continue with submission even if credit check fails
      }
      setLoadingCredit(false);
    }
    
    // Proceed with submission
    await performTicketSubmit();
  };

  const performTicketSubmit = async () => {
    await onCreate({
      subject,
      client,
      priority
    });
    // Reset form
    setSubject('');
    setClient('');
    setPriority('Medium (24h)');
    setPendingTicketSubmit(false);
    setShowCreditWarning(false);
  };

  const handleConfirmCreditWarning = () => {
    setShowCreditWarning(false);
    performTicketSubmit();
  };

  const handleCancelCreditWarning = () => {
    setShowCreditWarning(false);
    setPendingTicketSubmit(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl border border-gray-100 max-w-md w-full mx-4" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Create New Ticket</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Printer not connecting"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Client</label>
            <input
              type="text"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Search client..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">SLA Priority</label>
            <div className="relative">
                <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm appearance-none"
                >
                <option value="Critical (1h)">Critical (1h)</option>
                <option value="High (4h)">High (4h)</option>
                <option value="Medium (24h)">Medium (24h)</option>
                <option value="Low (48h)">Low (48h)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loadingCredit}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {loadingCredit && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Ticket
          </button>
        </div>

        {/* Credit Balance Warning Modal */}
        {showCreditWarning && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => handleCancelCreditWarning()}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-7 h-7 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Thông Báo Công Nợ</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Khách hàng này hiện có số dư âm trong tài khoản tín dụng tổ chức.
                </p>
                {orgCreditBalance && (
                  <div className="bg-red-50 rounded-lg p-3 mb-4 space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Hạn mức:</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(orgCreditBalance.creditLimit)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Khả dụng:</span>
                      <span className="font-semibold text-emerald-700">{formatCurrency(orgCreditBalance.availableCredit)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-red-200 pt-2">
                      <span className="text-red-700 font-semibold">Số dư âm:</span>
                      <span className="font-bold text-red-700">{formatCurrency(orgCreditBalance.outstandingBalance)}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <button onClick={() => handleCancelCreditWarning()} className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                  Quay lại
                </button>
                <button onClick={() => handleConfirmCreditWarning()} className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                  Tiếp tục tạo ticket
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
