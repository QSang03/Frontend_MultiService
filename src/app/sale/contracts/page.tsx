'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ensureAuthReady } from '@/lib/auth/ensure-auth-ready';
import {
  CheckCircle2,
  CircleAlert,
  CircleSlash,
  ArrowUpRight,
  BadgeDollarSign,
  Ban,
  Clock,
  DollarSign,
  Info,
  LoaderCircle,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Button, ConfirmModal, useToast } from '@/components/ui';
import { cn } from '@/utils';
import PayoutModal from './PayoutModal';
import CommissionDetailModal from './CommissionDetailModal';
import PayoutDetailModal from './PayoutDetailModal';

type SaleStats = {
  mtdProfit?: string;
  mtdCommission?: string;
  ytdProfit?: string;
  ytdCommission?: string;
  availableBalance?: string;
  debtBalance?: string;
  currentTier?: string;
};

type CommissionEntry = {
  id: string;
  targetId?: string;
  targetType?: string;
  baseProfit?: string;
  rateApplied?: string;
  amount?: string;
  status?: string;
  createdAt?: string;
};

type ClawbackEntry = {
  id: string;
  amount?: string;
  transactionType?: string;
  referenceId?: string;
  description?: string;
  createdAt?: string;
};

type PayoutEntry = {
  id: string;
  amount?: string;
  status?: number;
  note?: string;
  rejectionReason?: string;
  proofImageUrl?: string;
  saleName?: string;
  createdAt?: string;
  updatedAt?: string;
};

type CommissionDetail = {
  id: string;
  amount?: string;
  baseProfit?: string;
  rateApplied?: string;
  status?: string;
  targetType?: string;
  targetId?: string;
  detail?: {
    case?: 'ticket' | 'contract';
    value?: Record<string, unknown>;
  };
};

type StatusFilter = 'ALL' | 'PROVISIONAL' | 'AVAILABLE';
type PayoutFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
type CommissionStatusValue = Exclude<StatusFilter, 'ALL'>;
type PayoutStatusValue = Exclude<PayoutFilter, 'ALL'>;

const FILTER_STORAGE_KEY = 'sale-commissions-filters';

const TIER_TARGETS = [
  { key: 'TIER_1', label: 'Tier 1', rate: '10%', minProfit: 0, nextProfit: 50000000 },
  { key: 'TIER_2', label: 'Tier 2', rate: '15%', minProfit: 50000000, nextProfit: 150000000 },
  { key: 'TIER_3', label: 'Tier 3', rate: '20%', minProfit: 150000000, nextProfit: null },
];

const STATUS_FILTERS: Array<{ label: string; value: StatusFilter }> = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Chờ đối soát', value: 'PROVISIONAL' },
  { label: 'Có thể nhận', value: 'AVAILABLE' },
];

const PAYOUT_FILTERS: Array<{ label: string; value: PayoutFilter; status?: number }> = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Pending', value: 'PENDING', status: 1 },
  { label: 'Approved', value: 'APPROVED', status: 2 },
  { label: 'Rejected', value: 'REJECTED', status: 3 },
  { label: 'Cancelled', value: 'CANCELLED', status: 4 },
];

function parseMoney(value?: string): number {
  // vi-VN uses dots as thousand separators; strip currency symbol + spaces + dots, then parse
  const cleaned = String(value ?? '0').replace(/[₫\s]/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDate(value?: string): string {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function normalizeTierLabel(raw?: string): string {
  const value = String(raw ?? '').trim();
  if (!value) return 'Chưa xác định';

  const tier = TIER_TARGETS.find((item) => value.includes(item.key));
  if (tier) return `${tier.label} (${tier.rate})`;
  return value;
}

function resolveTierProgress(currentTier: string | undefined, ytdProfit: number) {
  const tier = TIER_TARGETS.find((item) => String(currentTier ?? '').includes(item.key)) || TIER_TARGETS[0];
  const nextProfit = tier.nextProfit;

  if (!nextProfit) {
    return {
      label: `${tier.label} đạt mức cao nhất`,
      progress: 100,
    };
  }

  const segment = nextProfit - tier.minProfit;
  const progressed = Math.max(0, ytdProfit - tier.minProfit);
  const remaining = Math.max(0, nextProfit - ytdProfit);
  const progress = Math.min(100, Math.round((progressed / segment) * 100));

  return {
    label: `Cần thêm ${formatCurrency(remaining)} profit để lên ${tier.label === 'Tier 1' ? 'Tier 2 (15%)' : 'Tier 3 (20%)'}`,
    progress,
  };
}

function getTargetHref(entry: CommissionEntry): string | null {
  const targetType = String(entry.targetType ?? '').toUpperCase();
  const targetId = entry.targetId;

  if (!targetId) return null;
  if (targetType.includes('TICKET')) return `/sale/support?ticketId=${encodeURIComponent(targetId)}`;
  if (targetType.includes('CONTRACT')) return `/sale/contracts?contractId=${encodeURIComponent(targetId)}`;

  return null;
}

function parseCommissionStatusValues(values: string[]): CommissionStatusValue[] {
  return values.filter((value): value is CommissionStatusValue => value === 'PROVISIONAL' || value === 'AVAILABLE');
}

function parsePayoutStatusValues(values: string[]): PayoutStatusValue[] {
  return values.filter((value): value is PayoutStatusValue => value === 'PENDING' || value === 'APPROVED' || value === 'REJECTED' || value === 'CANCELLED');
}

function toggleFilterValue<T extends string>(currentValues: T[], nextValue: T): T[] {
  return currentValues.includes(nextValue)
    ? currentValues.filter((value) => value !== nextValue)
    : [...currentValues, nextValue];
}

function matchesCommissionFilter(entry: CommissionEntry, activeStatuses: CommissionStatusValue[]) {
  if (activeStatuses.length === 0) return true;
  const normalized = String(entry.status ?? '').toUpperCase() as CommissionStatusValue;
  return activeStatuses.includes(normalized);
}

function matchesPayoutStatuses(entry: PayoutEntry, activeStatuses: PayoutStatusValue[]) {
  if (activeStatuses.length === 0) return true;
  const statusNumber = Number(entry.status);
  return activeStatuses.some((status) => {
    if (status === 'PENDING') return statusNumber === 1;
    if (status === 'APPROVED') return statusNumber === 2;
    if (status === 'REJECTED') return statusNumber === 3;
    if (status === 'CANCELLED') return statusNumber === 4;
    return true;
  });
}

function InfoHint({ label, description }: { label: string; description: string }) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [tooltipStyle, setTooltipStyle] = useState<{ top: number; left: number } | null>(null);

  const showTooltip = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setTooltipStyle({
      top: rect.bottom + 6,
      left: Math.min(rect.left, window.innerWidth - 232),
    });
  };

  const hideTooltip = () => setTooltipStyle(null);

  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
      <span>{label}</span>
      <span
        ref={triggerRef}
        tabIndex={0}
        role="note"
        aria-label={`${label}: ${description}`}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-flex h-4 w-4 cursor-default items-center justify-center rounded-full border border-gray-200 text-gray-400 outline-none transition-colors hover:border-blue-200 hover:text-blue-600 focus:border-blue-200 focus:text-blue-600"
      >
        <Info className="h-3 w-3" />
      </span>
      {tooltipStyle ? (
        <span
          role="tooltip"
          style={{ position: 'fixed', top: tooltipStyle.top, left: tooltipStyle.left }}
          className="pointer-events-none z-[9999] w-56 rounded-lg border border-slate-200 bg-slate-950 px-3 py-2 text-left text-[11px] font-medium leading-5 text-slate-50 shadow-xl"
        >
          {description}
        </span>
      ) : null}
    </span>
  );
}

function LoadingRows({ columns, rows = 4 }: { columns: number; rows?: number }) {
  return Array.from({ length: rows }).map((_, rowIndex) => (
    <tr key={`loading-row-${rowIndex}`}>
      {Array.from({ length: columns }).map((__, columnIndex) => (
        <td key={`loading-cell-${rowIndex}-${columnIndex}`} className="px-6 py-4">
          <div className={cn('h-4 animate-pulse rounded-full bg-gray-100', columnIndex === 0 ? 'w-28' : 'w-20')} />
        </td>
      ))}
    </tr>
  ));
}

function EmptyStateCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-gray-400 shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
}

function CommissionsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const [stats, setStats] = useState<SaleStats | null>(null);
  const [commissions, setCommissions] = useState<CommissionEntry[]>([]);
  const [clawbacks, setClawbacks] = useState<ClawbackEntry[]>([]);
  const [payouts, setPayouts] = useState<PayoutEntry[]>([]);
  const [selectedCommissionStatuses, setSelectedCommissionStatuses] = useState<CommissionStatusValue[]>(() => {
    return parseCommissionStatusValues(searchParams.getAll('commissionStatus'));
  });
  const [selectedPayoutStatuses, setSelectedPayoutStatuses] = useState<PayoutStatusValue[]>(() => {
    return parsePayoutStatusValues(searchParams.getAll('payoutStatus'));
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [commissionsLoading, setCommissionsLoading] = useState(true);
  const [clawbacksLoading, setClawbacksLoading] = useState(true);
  const [payoutsLoading, setPayoutsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFilterRefreshing, setIsFilterRefreshing] = useState(false);
  const [isLoadingMoreCommissions, setIsLoadingMoreCommissions] = useState(false);
  const [isLoadingMorePayouts, setIsLoadingMorePayouts] = useState(false);
  const [isLoadingMoreClawbacks, setIsLoadingMoreClawbacks] = useState(false);
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutNote, setPayoutNote] = useState('');
  const [payoutError, setPayoutError] = useState('');
  const [isPayoutSubmitting, setIsPayoutSubmitting] = useState(false);
  const [isCancelPayoutSubmitting, setIsCancelPayoutSubmitting] = useState(false);
  const [selectedPayoutId, setSelectedPayoutId] = useState('');
  const [isCancelPayoutOpen, setIsCancelPayoutOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [selectedCommissionDetail, setSelectedCommissionDetail] = useState<CommissionDetail | null>(null);
  const [commissionDetailDirection, setCommissionDetailDirection] = useState<'previous' | 'next' | null>(null);
  const [isPayoutDetailOpen, setIsPayoutDetailOpen] = useState(false);
  const [selectedPayoutDetailId, setSelectedPayoutDetailId] = useState('');
  const [payoutDetailDirection, setPayoutDetailDirection] = useState<'previous' | 'next' | null>(null);
  const [visibleCommissionCount, setVisibleCommissionCount] = useState(60);
  const [visiblePayoutCount, setVisiblePayoutCount] = useState(40);
  const [commissionNextPageToken, setCommissionNextPageToken] = useState('');
  const [commissionTotalCount, setCommissionTotalCount] = useState(0);
  const [clawbackNextPageToken, setClawbackNextPageToken] = useState('');
  const [payoutNextPageToken, setPayoutNextPageToken] = useState('');
  const [payoutTotalCount, setPayoutTotalCount] = useState(0);
  const [statsError, setStatsError] = useState('');
  const [commissionError, setCommissionError] = useState('');
  const [clawbackError, setClawbackError] = useState('');
  const [payoutSectionError, setPayoutSectionError] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState('');


  const updateSearchParams = useCallback((updates: Record<string, string | string[] | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      params.delete(key);

      if (value == null || value === '') {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item) {
            params.append(key, item);
          }
        });
        return;
      }

      if (value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    const nextQuery = params.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery === currentQuery) return;

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const loadData = useCallback(async (silent = false) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setStatsLoading(true);
      setCommissionsLoading(true);
      setClawbacksLoading(true);
      setPayoutsLoading(true);
    }

    try {
      const authReady = await ensureAuthReady();

      if (!authReady) {
        throw new Error('SESSION_EXPIRED');
      }

      const [statsRes, commissionsRes, clawbacksRes, payoutsRes] = await Promise.all([
        fetch('/api/sale/commissions/stats', { cache: 'no-store' }),
        fetch('/api/sale/commissions?pageSize=20', { cache: 'no-store' }),
        fetch('/api/sale/commissions/clawbacks?pageSize=10', { cache: 'no-store' }),
        fetch('/api/sale/commissions/payouts?pageSize=10', { cache: 'no-store' }),
      ]);

      const [statsJson, commissionsJson, clawbacksJson, payoutsJson] = await Promise.all([
        statsRes.json().catch(() => ({})),
        commissionsRes.json().catch(() => ({})),
        clawbacksRes.json().catch(() => ({})),
        payoutsRes.json().catch(() => ({})),
      ]);

      if (statsRes.ok) {
        setStats((statsJson?.data ?? null) as SaleStats | null);
        setStatsError('');
      } else {
        setStatsError(statsJson?.error || 'Không tải được thống kê thu nhập');
      }

      if (commissionsRes.ok) {
        setCommissions(Array.isArray(commissionsJson?.data?.commissions) ? (commissionsJson.data.commissions as CommissionEntry[]) : []);
        setCommissionNextPageToken(String(commissionsJson?.data?.nextPageToken ?? ''));
        setCommissionTotalCount(Number(commissionsJson?.data?.totalCount ?? 0));
        setCommissionError('');
      } else {
        setCommissionError(commissionsJson?.error || 'Không tải được lịch sử hoa hồng');
      }

      if (clawbacksRes.ok) {
        setClawbacks(Array.isArray(clawbacksJson?.data?.transactions) ? (clawbacksJson.data.transactions as ClawbackEntry[]) : []);
        setClawbackNextPageToken(String(clawbacksJson?.data?.nextPageToken ?? ''));
        setClawbackError('');
      } else {
        setClawbackError(clawbacksJson?.error || 'Không tải được lịch sử clawback');
      }

      if (payoutsRes.ok) {
        setPayouts(Array.isArray(payoutsJson?.data?.requests) ? (payoutsJson.data.requests as PayoutEntry[]) : []);
        setPayoutNextPageToken(String(payoutsJson?.data?.nextPageToken ?? ''));
        setPayoutTotalCount(Number(payoutsJson?.data?.totalCount ?? 0));
        setPayoutSectionError('');
      } else {
        setPayouts([]);
        setPayoutNextPageToken('');
        setPayoutTotalCount(0);
        setPayoutSectionError(payoutsJson?.error || 'Payout service hiện chưa sẵn sàng. Vui lòng thử lại sau.');
      }

      setLastUpdatedAt(new Date().toISOString());
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Không thể tải dữ liệu commissions';
      if (message === 'SESSION_EXPIRED') {
        router.replace('/login');
        return;
      }
      setStatsError((current) => current || message);
      setCommissionError((current) => current || message);
      setClawbackError((current) => current || message);
      setPayoutSectionError((current) => current || message);
    } finally {
      setStatsLoading(false);
      setCommissionsLoading(false);
      setClawbacksLoading(false);
      setPayoutsLoading(false);
      setIsRefreshing(false);
      setIsFilterRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setSelectedCommissionStatuses(parseCommissionStatusValues(searchParams.getAll('commissionStatus')));
    setSelectedPayoutStatuses(parsePayoutStatusValues(searchParams.getAll('payoutStatus')));
  }, [searchParams]);

  useEffect(() => {
    updateSearchParams({
      commissionStatus: selectedCommissionStatuses.length ? selectedCommissionStatuses : null,
      payoutStatus: selectedPayoutStatuses.length ? selectedPayoutStatuses : null,
    });
  }, [selectedCommissionStatuses, selectedPayoutStatuses, updateSearchParams]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      FILTER_STORAGE_KEY,
      JSON.stringify({
        commissionStatus: selectedCommissionStatuses,
        payoutStatus: selectedPayoutStatuses,
      })
    );
  }, [selectedCommissionStatuses, selectedPayoutStatuses]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== FILTER_STORAGE_KEY || !event.newValue) return;

      try {
        const parsed = JSON.parse(event.newValue) as {
          commissionStatus?: string[];
          payoutStatus?: string[];
        };

        updateSearchParams({
          commissionStatus: parseCommissionStatusValues(parsed.commissionStatus ?? []),
          payoutStatus: parsePayoutStatusValues(parsed.payoutStatus ?? []),
        });
      } catch {
        // Ignore malformed storage payloads.
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [updateSearchParams]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadData(true);
      }
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadData]);

  const filteredCommissions = useMemo(
    () => commissions.filter((entry) => matchesCommissionFilter(entry, selectedCommissionStatuses)),
    [commissions, selectedCommissionStatuses]
  );
  const filteredPayouts = useMemo(
    () => payouts.filter((entry) => matchesPayoutStatuses(entry, selectedPayoutStatuses)),
    [payouts, selectedPayoutStatuses]
  );
  const visibleCommissions = useMemo(
    () => filteredCommissions.slice(0, visibleCommissionCount),
    [filteredCommissions, visibleCommissionCount]
  );
  const visiblePayouts = useMemo(
    () => filteredPayouts.slice(0, visiblePayoutCount),
    [filteredPayouts, visiblePayoutCount]
  );
  const availableBalance = parseMoney(stats?.availableBalance);
  const pendingBalance = useMemo(
    () => commissions
      .filter((entry) => String(entry.status ?? '').toUpperCase() === 'PROVISIONAL')
      .reduce((total, entry) => total + parseMoney(entry.amount), 0),
    [commissions]
  );
  const ytdProfit = parseMoney(stats?.ytdProfit);
  const mtdCommission = parseMoney(stats?.mtdCommission);
  const debtBalance = parseMoney(stats?.debtBalance);
  const tierProgress = resolveTierProgress(stats?.currentTier, ytdProfit);
  const pendingPayoutCount = payouts.filter((item) => Number(item.status) === 1).length;
  const totalPayoutRequested = useMemo(
    () => payouts.reduce((total, item) => total + parseMoney(item.amount), 0),
    [payouts]
  );

  const resetPayoutState = () => {
    setIsPayoutOpen(false);
    setPayoutAmount('');
    setPayoutNote('');
    setPayoutError('');
  };

  const closeCancelPayoutModal = () => {
    setIsCancelPayoutOpen(false);
    setSelectedPayoutId('');
  };

  const closeDetailState = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedCommissionDetail(null);
    setIsDetailLoading(false);
  }, []);

  const handleToggleCommissionFilter = (value: StatusFilter) => {
    setIsFilterRefreshing(true);
    setVisibleCommissionCount(60);
    setSelectedCommissionStatuses((current) => {
      if (value === 'ALL') return [];
      return toggleFilterValue(current, value);
    });
    void loadData(true);
  };

  const handleTogglePayoutFilter = (value: PayoutFilter) => {
    setIsFilterRefreshing(true);
    setVisiblePayoutCount(40);
    setSelectedPayoutStatuses((current) => {
      if (value === 'ALL') return [];
      return toggleFilterValue(current, value);
    });
    void loadData(true);
  };

  const handleLoadMoreCommissions = useCallback(async () => {
    const token = commissionNextPageToken;
    if (!token || isLoadingMoreCommissions) return;

    setIsLoadingMoreCommissions(true);

    try {
      const params = new URLSearchParams({ pageSize: '20', pageToken: token });
      const response = await fetch(`/api/sale/commissions?${params.toString()}`, { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(typeof payload?.error === 'string' ? payload.error : 'Không tải thêm commission');
      }

      const nextItems = Array.isArray(payload?.data?.commissions) ? (payload.data.commissions as CommissionEntry[]) : [];
      setCommissions((prev) => [...prev, ...nextItems.filter((item) => !prev.some((existing) => existing.id === item.id))]);
      const nextPageToken = String(payload?.data?.nextPageToken ?? '');
      setCommissionNextPageToken(nextPageToken === token ? '' : nextPageToken);
      setCommissionTotalCount(Number(payload?.data?.totalCount ?? commissionTotalCount));
      setVisibleCommissionCount((current) => current + 20);
    } catch (loadError) {
      addToast(loadError instanceof Error ? loadError.message : 'Không tải thêm commission', { type: 'error' });
    } finally {
      setIsLoadingMoreCommissions(false);
    }
  }, [addToast, commissionNextPageToken, commissionTotalCount, isLoadingMoreCommissions]);

  const handleLoadMoreClawbacks = useCallback(async () => {
    if (!clawbackNextPageToken || isLoadingMoreClawbacks) return;

    setIsLoadingMoreClawbacks(true);

    try {
      const params = new URLSearchParams({ pageSize: '10', pageToken: clawbackNextPageToken });
      const response = await fetch(`/api/sale/commissions/clawbacks?${params.toString()}`, { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(typeof payload?.error === 'string' ? payload.error : 'Không tải thêm clawback');
      }

      const nextItems = Array.isArray(payload?.data?.transactions) ? (payload.data.transactions as ClawbackEntry[]) : [];
      setClawbacks((prev) => [...prev, ...nextItems.filter((item) => !prev.some((existing) => existing.id === item.id))]);
      setClawbackNextPageToken(String(payload?.data?.nextPageToken ?? ''));
    } catch (loadError) {
      addToast(loadError instanceof Error ? loadError.message : 'Không tải thêm clawback', { type: 'error' });
    } finally {
      setIsLoadingMoreClawbacks(false);
    }
  }, [addToast, clawbackNextPageToken, isLoadingMoreClawbacks]);

  const handleLoadMorePayouts = useCallback(async () => {
    const token = payoutNextPageToken;
    if (!token || isLoadingMorePayouts) return;

    setIsLoadingMorePayouts(true);

    try {
      const params = new URLSearchParams({
        pageSize: '10',
        pageToken: token,
      });

      const response = await fetch(`/api/sale/commissions/payouts?${params.toString()}`, {
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(typeof payload?.error === 'string' ? payload.error : 'Không tải thêm payout requests');
      }

      const nextRequests = Array.isArray(payload?.data?.requests) ? (payload.data.requests as PayoutEntry[]) : [];
      setPayouts((prev) => [...prev, ...nextRequests.filter((item) => !prev.some((existing) => existing.id === item.id))]);
      const nextPageToken = String(payload?.data?.nextPageToken ?? '');
      setPayoutNextPageToken(nextPageToken === token ? '' : nextPageToken);
      setPayoutTotalCount(Number(payload?.data?.totalCount ?? payoutTotalCount));
      setVisiblePayoutCount((current) => current + 10);
    } catch (loadError) {
      addToast(loadError instanceof Error ? loadError.message : 'Không tải thêm payout requests', { type: 'error' });
    } finally {
      setIsLoadingMorePayouts(false);
    }
  }, [addToast, isLoadingMorePayouts, payoutNextPageToken, payoutTotalCount]);

  const openPayoutModal = () => {
    if (availableBalance <= 0) {
      addToast('Không có số dư khả dụng để yêu cầu payout.', { type: 'info' });
      return;
    }

    setPayoutAmount(String(availableBalance));
    setPayoutNote('');
    setPayoutError('');
    setIsPayoutOpen(true);
  };

  const handlePayoutSubmit = async () => {
    const normalizedAmount = parseMoney(payoutAmount);

    if (!normalizedAmount || normalizedAmount <= 0) {
      setPayoutError('Số tiền yêu cầu phải lớn hơn 0.');
      return;
    }

    if (normalizedAmount > availableBalance) {
      setPayoutError('Số tiền yêu cầu vượt quá số dư khả dụng.');
      return;
    }

    setIsPayoutSubmitting(true);
    setPayoutError('');

    try {
      const response = await fetch('/api/sale/commissions/payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: String(normalizedAmount),
          note: payoutNote.trim() || undefined,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = typeof payload?.error === 'string' ? payload.error : 'Không thể tạo yêu cầu payout';
        setPayoutError(message);
        return;
      }

      const createdRequest = payload?.data?.request as PayoutEntry | undefined;
      if (createdRequest) {
        setPayouts((prev) => [createdRequest, ...prev.filter((item) => item.id !== createdRequest.id)]);
        setPayoutTotalCount((prev) => prev + 1);
      }

      addToast(`Đã tạo payout request ${payload?.data?.request?.id || ''}`.trim(), { type: 'success' });
      resetPayoutState();
      void loadData(true);
    } catch {
      setPayoutError('Lỗi kết nối khi tạo yêu cầu payout.');
    } finally {
      setIsPayoutSubmitting(false);
    }
  };

  const handleOpenCancelPayout = (payoutId: string) => {
    setSelectedPayoutId(payoutId);
    setIsCancelPayoutOpen(true);
  };

  const handleCancelPayout = async () => {
    if (!selectedPayoutId) return;

    setIsCancelPayoutSubmitting(true);

    try {
      const response = await fetch(`/api/sale/commissions/payouts/${encodeURIComponent(selectedPayoutId)}/cancel`, {
        method: 'POST',
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(typeof payload?.error === 'string' ? payload.error : 'Không thể hủy payout request');
      }

      const cancelledRequest = payload?.data?.request as PayoutEntry | undefined;
      const previousEntry = payouts.find((item) => item.id === selectedPayoutId);
      if (cancelledRequest) {
        const wasVisible = previousEntry ? matchesPayoutStatuses(previousEntry, selectedPayoutStatuses) : false;
        const isVisible = matchesPayoutStatuses(cancelledRequest, selectedPayoutStatuses);

        setPayouts((prev) => {
          const withoutCurrent = prev.filter((item) => item.id !== cancelledRequest.id);
          if (!isVisible) return withoutCurrent;
          return [cancelledRequest, ...withoutCurrent];
        });

        if (wasVisible !== isVisible) {
          setPayoutTotalCount((prev) => Math.max(0, prev + (isVisible ? 1 : -1)));
        }
      }

      addToast(`Đã hủy payout request ${selectedPayoutId}`, { type: 'success' });
      closeCancelPayoutModal();
  void loadData(true);
    } catch (cancelError) {
      addToast(cancelError instanceof Error ? cancelError.message : 'Không thể hủy payout request', { type: 'error' });
    } finally {
      setIsCancelPayoutSubmitting(false);
    }
  };

  const handleOpenCommissionDetail = (commissionId: string) => {
    setCommissionDetailDirection(null);
    updateSearchParams({ commissionId });
  };

  const handleCloseDetail = () => {
    setCommissionDetailDirection(null);
    updateSearchParams({ commissionId: null });
    closeDetailState();
  };

  useEffect(() => {
    const commissionIdFromQuery = searchParams.get('commissionId')?.trim() || '';

    if (!commissionIdFromQuery) {
      closeDetailState();
      return;
    }

    if (selectedCommissionDetail?.id === commissionIdFromQuery) {
      setIsDetailOpen(true);
      return;
    }

    let isCancelled = false;

    const loadCommissionDetail = async () => {
      setIsDetailOpen(true);
      setIsDetailLoading(true);
      setSelectedCommissionDetail(null);

      try {
        const response = await fetch(`/api/sale/commissions/${encodeURIComponent(commissionIdFromQuery)}`, {
          cache: 'no-store',
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(typeof payload?.error === 'string' ? payload.error : 'Không tải được chi tiết commission');
        }

        if (!isCancelled) {
          setSelectedCommissionDetail((payload?.data ?? null) as CommissionDetail | null);
        }
      } catch (detailError) {
        if (!isCancelled) {
          const message = detailError instanceof Error ? detailError.message : 'Không tải được chi tiết commission';
          addToast(message, { type: 'error' });
          closeDetailState();
          updateSearchParams({ commissionId: null });
        }
      } finally {
        if (!isCancelled) {
          setIsDetailLoading(false);
        }
      }
    };

    void loadCommissionDetail();

    return () => {
      isCancelled = true;
    };
  }, [addToast, closeDetailState, searchParams, selectedCommissionDetail?.id, updateSearchParams]);

  const getStatusBadge = (status?: string) => {
    const normalized = String(status ?? '').toUpperCase();
    if (normalized === 'AVAILABLE') {
      return <span title="Commission đã đủ điều kiện nhận" className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />Available</span>;
    }
    if (normalized === 'PROVISIONAL') {
      return <span title="Commission vẫn đang chờ đối soát" className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"><Clock className="h-3.5 w-3.5" />Provisional</span>;
    }
    return <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700"><CircleSlash className="h-3.5 w-3.5" />{status || 'Unknown'}</span>;
  };

  const getPayoutStatusBadge = (status?: number) => {
    switch (Number(status)) {
      case 1:
        return <span title="Đã gửi yêu cầu và đang chờ kế toán xử lý" className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"><Clock className="h-3.5 w-3.5" />Pending</span>;
      case 2:
        return <span title="Payout đã được duyệt" className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />Approved</span>;
      case 3:
        return <span title="Payout bị từ chối" className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700"><CircleAlert className="h-3.5 w-3.5" />Rejected</span>;
      case 4:
        return <span title="Payout đã được hủy" className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700"><Ban className="h-3.5 w-3.5" />Cancelled</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700"><CircleSlash className="h-3.5 w-3.5" />Unknown</span>;
    }
  };

  const currentCommissionIndex = filteredCommissions.findIndex((item) => item.id === selectedCommissionDetail?.id);
  const selectedPayoutDetail = payouts.find((item) => item.id === selectedPayoutDetailId) ?? null;
  const currentPayoutIndex = filteredPayouts.findIndex((item) => item.id === selectedPayoutDetailId);

  const handleNavigateCommissionDetail = (direction: 'previous' | 'next') => {
    if (currentCommissionIndex < 0) return;
    const nextIndex = direction === 'previous' ? currentCommissionIndex - 1 : currentCommissionIndex + 1;
    const nextItem = filteredCommissions[nextIndex];
    if (!nextItem) return;
    setCommissionDetailDirection(direction);
    updateSearchParams({ commissionId: nextItem.id });
  };

  const openPayoutDetail = (payoutId: string) => {
    setPayoutDetailDirection(null);
    setSelectedPayoutDetailId(payoutId);
    setIsPayoutDetailOpen(true);
  };

  const closePayoutDetail = () => {
    setIsPayoutDetailOpen(false);
    setPayoutDetailDirection(null);
    setSelectedPayoutDetailId('');
  };

  const navigatePayoutDetail = (direction: 'previous' | 'next') => {
    if (currentPayoutIndex < 0) return;
    const nextIndex = direction === 'previous' ? currentPayoutIndex - 1 : currentPayoutIndex + 1;
    const nextItem = filteredPayouts[nextIndex];
    if (!nextItem) return;
    setPayoutDetailDirection(direction);
    setSelectedPayoutDetailId(nextItem.id);
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900 px-6 py-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-blue-50 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Theo dõi commission theo thời gian thực nhẹ, tự làm mới mỗi 30 giây
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Commissions & Performance</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100/85 sm:text-base">
              Theo dõi profit, khoản đang chờ đối soát, payout và clawback trên cùng một màn hình. Bộ lọc hỗ trợ đa chọn, giữ trạng thái khi reload và sync giữa các tab.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-blue-100/80">
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1">Lần cập nhật gần nhất: {lastUpdatedAt ? formatDate(lastUpdatedAt) : 'Đang tải...'}</span>
              <a href="#how-it-works" className="rounded-full border border-white/10 bg-white/10 px-3 py-1 transition-colors hover:bg-white/20">Xem FAQ nhanh</a>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadData(true)}
              isLoading={isRefreshing}
              leftIcon={!isRefreshing ? <RefreshCcw className="h-4 w-4" /> : undefined}
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              Làm mới
            </Button>
            <Button
              size="sm"
              onClick={openPayoutModal}
              disabled={statsLoading || availableBalance <= 0}
              isLoading={isPayoutSubmitting}
              className="border border-white/20 bg-white text-blue-800 hover:bg-blue-50"
              title={
                statsLoading ? 'Đang tải dữ liệu...'
                : debtBalance > 0 ? `Đang có công nợ ${formatCurrency(debtBalance)} — không thể rút`
                : pendingBalance > 0 && availableBalance <= 0 ? `${formatCurrency(pendingBalance)} đang chờ đối soát, chưa khả dụng để rút`
                : availableBalance <= 0 ? 'Chưa có commission khả dụng để yêu cầu rút'
                : 'Tạo yêu cầu rút commission'
              }
            >
              Yêu cầu rút tiền
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="xl:col-span-2 rounded-[24px] bg-[#2442cf] p-6 text-white shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-blue-100">Available Balance</p>
              <h3 className="mt-2 text-4xl font-bold">{statsLoading ? '...' : formatCurrency(availableBalance)}</h3>
              <p className="mt-3 text-xs text-blue-100">YTD Commission: {statsLoading ? '...' : formatCurrency(parseMoney(stats?.ytdCommission))}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <Wallet className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-blue-100">Pending balance</p>
              <p className="mt-1 font-semibold text-white">{statsLoading ? '...' : formatCurrency(pendingBalance)}</p>
              <p className="mt-1 text-xs text-blue-100">MTD Commission: {statsLoading ? '...' : formatCurrency(mtdCommission)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-blue-100">Debt balance</p>
              <p className="mt-1 font-semibold text-white">{statsLoading ? '...' : formatCurrency(debtBalance)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-gray-500">MTD Profit</span>
              <InfoHint label="MTD Profit" description="Tổng lợi nhuận ròng từ các ticket/hợp đồng trong tháng hiện tại (Month-to-Date). Dùng làm cơ sở tính commission." />
            </div>
            <BadgeDollarSign className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">{statsLoading ? '...' : formatCurrency(parseMoney(stats?.mtdProfit))}</p>
        </div>
        <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-gray-500">Total Payout Requested</span>
              <InfoHint label="Total Payout Requested" description="Tổng số tiền commission đã gửi yêu cầu rút (bao gồm cả pending, approved, rejected). Không phải số dư thực nhận." />
            </div>
            <DollarSign className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">{payoutsLoading ? '...' : formatCurrency(totalPayoutRequested)}</p>
          <p className="mt-2 text-xs text-gray-500">Pending requests: {payoutsLoading ? '...' : pendingPayoutCount}</p>
        </div>
        <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-gray-500">Current Tier</span>
              <InfoHint label="Current Tier" description="Tier hoa hồng hiện tại dựa trên tổng YTD Profit. Tier 1 (≥0đ): 10% · Tier 2 (≥50tr): 15% · Tier 3 (≥150tr): 20%." />
            </div>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </div>
          <p className="mt-3 text-xl font-bold text-gray-900">{statsLoading ? '...' : normalizeTierLabel(stats?.currentTier)}</p>
          <div className="mt-4 h-2 rounded-full bg-gray-100">
            <div className="h-2 rounded-full bg-blue-600" style={{ width: `${tierProgress.progress}%` }} />
          </div>
          <p className="mt-2 text-xs font-medium text-blue-600">{statsLoading ? 'Đang tải tiến độ tier...' : tierProgress.label}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_1fr]">
        <section className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
          {statsError ? <div className="mx-6 mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{statsError}</div> : null}
          <div className="border-b border-gray-100 px-6 py-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="font-bold text-gray-900">Payout Requests</h3>
                <p className="mt-1 text-sm text-gray-500">Theo dõi yêu cầu rút commission, bộ lọc đa chọn và hủy request khi còn pending.</p>
              </div>
              <div className="text-sm text-gray-500">Hiển thị <span className="font-semibold text-gray-900">{filteredPayouts.length}</span> / {payouts.length} đã tải • tổng backend {payoutTotalCount}</div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {PAYOUT_FILTERS.map((item) => {
                const active = item.value === 'ALL' ? selectedPayoutStatuses.length === 0 : selectedPayoutStatuses.includes(item.value as PayoutStatusValue);
                return (
                  <button
                    key={item.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => handleTogglePayoutFilter(item.value)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                      active ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-white'
                    )}
                  >
                    {active && isFilterRefreshing ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
          {payoutSectionError ? (
            <div className="mx-6 mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">Payout service đang gặp vấn đề riêng</p>
                  <p className="mt-1">{payoutSectionError}</p>
                </div>
              </div>
            </div>
          ) : null}
          <div className="hidden md:block">
            <div className="max-h-[440px] overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-gray-50 text-xs font-medium uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-4"><InfoHint label="Request" description="Mã yêu cầu payout và các metadata phụ như lý do từ chối hoặc chứng từ." /></th>
                    <th className="px-6 py-4 text-right"><InfoHint label="Amount" description="Số tiền sale yêu cầu rút ở thời điểm gửi request." /></th>
                    <th className="px-6 py-4">Note</th>
                    <th className="px-6 py-4 text-center">Created</th>
                    <th className="px-6 py-4 text-center"><InfoHint label="Status" description="Pending: chờ xử lý. Approved: đã duyệt. Rejected: bị từ chối. Cancelled: sale tự hủy." /></th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payoutsLoading ? <LoadingRows columns={6} rows={4} /> : null}
                  {!payoutsLoading && visiblePayouts.map((item) => (
                    <tr
                      key={item.id}
                      tabIndex={0}
                      role="button"
                      onClick={() => openPayoutDetail(item.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openPayoutDetail(item.id);
                        }
                      }}
                      className="cursor-pointer transition-colors hover:bg-slate-50/80 focus:bg-slate-50 focus:outline-none"
                    >
                      <td className="px-6 py-4 align-top">
                        <p className="font-medium text-gray-900">{item.id}</p>
                        {item.rejectionReason ? <p className="mt-1 text-xs text-rose-600">Lý do từ chối: {item.rejectionReason}</p> : null}
                        {item.proofImageUrl ? <a href={item.proofImageUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-xs text-blue-600 hover:underline">Xem chứng từ thanh toán</a> : null}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">{formatCurrency(parseMoney(item.amount))}</td>
                      <td className="px-6 py-4 text-gray-600">{item.note || 'Không có ghi chú'}</td>
                      <td className="px-6 py-4 text-center text-xs text-gray-500">{formatDate(item.createdAt)}</td>
                      <td className="px-6 py-4 text-center">{getPayoutStatusBadge(item.status)}</td>
                      <td className="px-6 py-4 text-right">
                        {Number(item.status) === 1 ? (
                          <button type="button" onClick={(event) => { event.stopPropagation(); handleOpenCancelPayout(item.id); }} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-100">
                            <Ban className="h-3.5 w-3.5" />Hủy request
                          </button>
                        ) : <span className="text-xs text-gray-400">Không khả dụng</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          </div>
          <div className="space-y-3 px-4 py-4 md:hidden">
            {payoutsLoading ? <EmptyStateCard icon={<LoaderCircle className="h-5 w-5 animate-spin" />} title="Đang tải payout requests" description="Hệ thống đang đồng bộ các yêu cầu payout mới nhất." /> : null}
            {!payoutsLoading && filteredPayouts.length === 0 ? <EmptyStateCard icon={<Wallet className="h-5 w-5" />} title="Chưa có payout request phù hợp" description="Hãy thay đổi bộ lọc hoặc tạo request mới khi có số dư khả dụng." /> : null}
            {!payoutsLoading && visiblePayouts.map((item) => (
              <button key={item.id} type="button" onClick={() => openPayoutDetail(item.id)} className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-colors hover:bg-slate-50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{item.id}</p>
                    <p className="mt-1 text-xs text-gray-500">{formatDate(item.createdAt)}</p>
                  </div>
                  {getPayoutStatusBadge(item.status)}
                </div>
                <p className="mt-4 text-lg font-bold text-gray-900">{formatCurrency(parseMoney(item.amount))}</p>
                <p className="mt-2 text-sm text-gray-600">{item.note || 'Không có ghi chú'}</p>
                {Number(item.status) === 1 ? <span className="mt-4 inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"> <Ban className="h-3.5 w-3.5" /> Có thể hủy trong chi tiết </span> : null}
              </button>
            ))}
          </div>
          {filteredPayouts.length > visiblePayoutCount ? <div className="border-t border-gray-100 px-6 py-4 text-center"><Button variant="ghost" size="sm" onClick={() => setVisiblePayoutCount((current) => current + 30)}>Hiện thêm payout đã tải</Button></div> : null}
          {payoutNextPageToken ? <div className="border-t border-gray-100 px-6 py-4 text-center"><Button variant="outline" size="sm" onClick={() => void handleLoadMorePayouts()} isLoading={isLoadingMorePayouts}>Tải thêm payout requests</Button></div> : null}
        </section>

        <section id="how-it-works" className="space-y-6">
          <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-gray-900">How it works</h3>
                <p className="mt-1 text-sm text-gray-500">Giải thích nhanh để sale hiểu ý nghĩa từng con số.</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">FAQ nhanh</span>
            </div>
            <div className="mt-6 space-y-6">
              <div className="flex gap-4"><div className="h-auto w-1 rounded-full bg-blue-600" /><div><h4 className="text-sm font-medium text-gray-900">Net Profit Base</h4><p className="mt-1 text-xs leading-relaxed text-gray-500">Commission được tính trên Net Profit, không phải doanh thu gộp. Dùng tooltip ở bảng để xem định nghĩa ngay tại chỗ.</p></div></div>
              <div className="flex gap-4"><div className="h-auto w-1 rounded-full bg-red-500" /><div><h4 className="text-sm font-medium text-gray-900">Clawback Mechanism</h4><p className="mt-1 text-xs leading-relaxed text-gray-500">Nếu lợi nhuận giảm sau khi ghi nhận commission, hệ thống sẽ tạo bút toán truy thu riêng trong ledger.</p></div></div>
              <div className="flex gap-4"><div className="h-auto w-1 rounded-full bg-emerald-500" /><div><h4 className="text-sm font-medium text-gray-900">Realtime nhẹ</h4><p className="mt-1 text-xs leading-relaxed text-gray-500">Trang tự làm mới mỗi 30 giây khi tab đang mở. Bộ lọc vẫn được giữ nguyên khi reload hoặc mở tab khác.</p></div></div>
            </div>
          </div>

          <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-bold text-gray-900">Clawback Ledger</h3>
              <span className="text-xs text-gray-500">Đã tải {clawbacks.length} mục</span>
            </div>
            {clawbackError ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{clawbackError}</div> : null}
            <div className="mt-5 space-y-4">
              {clawbacksLoading ? <EmptyStateCard icon={<LoaderCircle className="h-5 w-5 animate-spin" />} title="Đang tải clawback ledger" description="Các khoản truy thu sẽ xuất hiện tại đây sau khi backend trả dữ liệu." /> : null}
              {!clawbacksLoading && clawbacks.length === 0 ? <EmptyStateCard icon={<ShieldAlert className="h-5 w-5" />} title="Chưa có clawback" description="Hiện chưa có khoản truy thu nào được ghi nhận cho sale account này." /> : null}
              {!clawbacksLoading && clawbacks.map((item) => {
                const amount = parseMoney(item.amount);
                return (
                  <div key={item.id} className="rounded-2xl border border-red-100 bg-red-50/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-red-900">{item.transactionType || 'CLAWBACK'}</p>
                        <p className="mt-1 text-xs text-red-700">{item.description || 'No description provided'}</p>
                      </div>
                      <span className="text-sm font-bold text-red-700">{formatCurrency(amount)}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-red-700/80">
                      <span>{item.referenceId || 'No reference'}</span>
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {clawbackNextPageToken ? <div className="mt-5 text-center"><Button variant="outline" size="sm" onClick={() => void handleLoadMoreClawbacks()} isLoading={isLoadingMoreClawbacks}>Tải thêm clawback</Button></div> : null}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="font-bold text-gray-900">Commission History</h3>
              <p className="mt-1 text-sm text-gray-500">Liên kết trực tiếp theo Ticket ID hoặc Contract ID. Click vào row để mở detail nhanh.</p>
            </div>
            <div className="text-sm text-gray-500">Hiển thị <span className="font-semibold text-gray-900">{filteredCommissions.length}</span> / {commissions.length} đã tải • tổng backend {commissionTotalCount}</div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {STATUS_FILTERS.map((item) => {
              const active = item.value === 'ALL' ? selectedCommissionStatuses.length === 0 : selectedCommissionStatuses.includes(item.value as CommissionStatusValue);
              return (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleToggleCommissionFilter(item.value)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                    active ? 'border-blue-600 bg-blue-600 text-white shadow-sm' : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-white'
                  )}
                >
                  {active && isFilterRefreshing ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}
                  {item.label}
                </button>
              );
            })}
          </div>
          {commissionError ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{commissionError}</div> : null}
        </div>
        <div className="hidden md:block">
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50 text-xs font-medium uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4 text-right"><InfoHint label="Net Profit Base" description="Lợi nhuận ròng dùng làm cơ sở tính commission, không phải doanh thu gộp." /></th>
                  <th className="px-6 py-4 text-center"><InfoHint label="Rate" description="Tỷ lệ commission áp dụng theo tier và ngữ cảnh nghiệp vụ." /></th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-center"><InfoHint label="Booked" description="Ngày bút toán commission được ghi nhận vào sổ." /></th>
                  <th className="px-6 py-4 text-right"><InfoHint label="Status" description="Provisional là đang chờ đối soát; Available là đã sẵn sàng để nhận hoặc payout." /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {commissionsLoading ? <LoadingRows columns={6} rows={5} /> : null}
                {!commissionsLoading && visibleCommissions.map((item) => {
                  const amount = parseMoney(item.amount);
                  const targetHref = getTargetHref(item);
                  return (
                    <tr
                      key={item.id}
                      tabIndex={0}
                      role="button"
                      onClick={() => handleOpenCommissionDetail(item.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleOpenCommissionDetail(item.id);
                        }
                      }}
                      className="cursor-pointer transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                    >
                      <td className="px-6 py-4 align-top">
                        <p className="font-medium text-gray-900">{item.targetType || 'Reference'}</p>
                        {targetHref ? (
                          <a href={targetHref} onClick={(event) => event.stopPropagation()} className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline">
                            {item.targetId || 'Open reference'}
                            <ArrowUpRight className="h-3 w-3" />
                          </a>
                        ) : <p className="mt-1 text-xs text-gray-500">{item.targetId || 'N/A'}</p>}
                        <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-600">Xem chi tiết commission <ArrowUpRight className="h-3 w-3" /></span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900">{formatCurrency(parseMoney(item.baseProfit))}</td>
                      <td className="px-6 py-4 text-center text-gray-600">{item.rateApplied || 'N/A'}</td>
                      <td className={cn('px-6 py-4 text-right font-bold', amount < 0 ? 'text-red-600' : 'text-green-600')}>{formatCurrency(amount)}</td>
                      <td className="px-6 py-4 text-center text-xs text-gray-500">{formatDate(item.createdAt)}</td>
                      <td className="px-6 py-4 text-right">{getStatusBadge(item.status)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

          </div>
        </div>
        <div className="space-y-3 px-4 py-4 md:hidden">
          {commissionsLoading ? <EmptyStateCard icon={<LoaderCircle className="h-5 w-5 animate-spin" />} title="Đang tải commission history" description="Hệ thống đang nạp dữ liệu commission mới nhất." /> : null}
          {!commissionsLoading && filteredCommissions.length === 0 ? <EmptyStateCard icon={<BadgeDollarSign className="h-5 w-5" />} title="Không có commission phù hợp" description="Thử đổi bộ lọc hoặc tải thêm dữ liệu để xem nhiều commission hơn." /> : null}
          {!commissionsLoading && visibleCommissions.map((item) => {
            const amount = parseMoney(item.amount);
            const targetHref = getTargetHref(item);
            return (
              <button key={item.id} type="button" onClick={() => handleOpenCommissionDetail(item.id)} className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-colors hover:bg-slate-50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{item.targetType || 'Reference'}</p>
                    <p className="mt-1 text-xs text-gray-500">{item.targetId || 'N/A'}</p>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-gray-500">Net Profit Base</p><p className="mt-1 font-semibold text-gray-900">{formatCurrency(parseMoney(item.baseProfit))}</p></div>
                  <div><p className="text-xs text-gray-500">Amount</p><p className={cn('mt-1 font-semibold', amount < 0 ? 'text-red-600' : 'text-green-600')}>{formatCurrency(amount)}</p></div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                  <span>{item.rateApplied || 'N/A'}</span>
                  <span>{formatDate(item.createdAt)}</span>
                </div>
                {targetHref ? <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-600">Mở reference <ArrowUpRight className="h-3 w-3" /></span> : null}
              </button>
            );
          })}
        </div>
        {filteredCommissions.length > visibleCommissionCount ? <div className="border-t border-gray-100 px-6 py-4 text-center"><Button variant="ghost" size="sm" onClick={() => setVisibleCommissionCount((current) => current + 40)}>Hiện thêm commission đã tải</Button></div> : null}
        {commissionNextPageToken ? <div className="border-t border-gray-100 px-6 py-4 text-center"><Button variant="outline" size="sm" onClick={() => void handleLoadMoreCommissions()} isLoading={isLoadingMoreCommissions}>Tải thêm commission</Button></div> : null}
      </section>

      <PayoutModal
        open={isPayoutOpen}
        onClose={resetPayoutState}
        onConfirm={() => void handlePayoutSubmit()}
        amount={payoutAmount}
        note={payoutNote}
        maxAmount={availableBalance}
        onAmountChange={setPayoutAmount}
        onNoteChange={setPayoutNote}
        isLoading={isPayoutSubmitting}
        error={payoutError}
      />

      <CommissionDetailModal
        open={isDetailOpen}
        onClose={handleCloseDetail}
        detail={selectedCommissionDetail}
        isLoading={isDetailLoading}
        hasPrevious={currentCommissionIndex > 0}
        hasNext={currentCommissionIndex >= 0 && currentCommissionIndex < filteredCommissions.length - 1}
        onPrevious={() => handleNavigateCommissionDetail('previous')}
        onNext={() => handleNavigateCommissionDetail('next')}
        transitionDirection={commissionDetailDirection}
      />

      <PayoutDetailModal
        open={isPayoutDetailOpen}
        onClose={closePayoutDetail}
        detail={selectedPayoutDetail}
        hasPrevious={currentPayoutIndex > 0}
        hasNext={currentPayoutIndex >= 0 && currentPayoutIndex < filteredPayouts.length - 1}
        onPrevious={() => navigatePayoutDetail('previous')}
        onNext={() => navigatePayoutDetail('next')}
        transitionDirection={payoutDetailDirection}
        onRequestCancel={(payoutId) => {
          closePayoutDetail();
          handleOpenCancelPayout(payoutId);
        }}
      />

      <ConfirmModal
        open={isCancelPayoutOpen}
        title="Hủy payout request"
        description="Yêu cầu này sẽ bị hủy trước khi kế toán xử lý. Chỉ payout ở trạng thái pending mới có thể hủy."
        confirmLabel="Xác nhận hủy"
        cancelLabel="Đóng"
        onConfirm={() => void handleCancelPayout()}
        onClose={closeCancelPayoutModal}
        isLoading={isCancelPayoutSubmitting}
      />
    </div>
  );
}

export default function CommissionsPage() {
  return (
    <Suspense fallback={<div className="p-6 max-w-[1600px] mx-auto text-sm text-gray-500">Đang tải commissions...</div>}>
      <CommissionsPageContent />
    </Suspense>
  );
}
