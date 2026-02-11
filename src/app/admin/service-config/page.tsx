'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Settings, Plus, Eye, Code, Save, FileEdit, Sliders, BookOpen, Filter, CheckCircle, XCircle, Clock, CalendarDays, Trash2, List, Type, Hash, X, Loader2, ChevronRight, ChevronDown, Package, Box, AlertTriangle, DollarSign, Layers, ArrowRight, PieChart } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import TopHeader from '@/components/layout/TopHeader';
import ConfirmModal from '@/components/ui/ConfirmModal';

// Pricing K-Rule types matching the API
enum RuleCategory {
    RULE_CATEGORY_UNSPECIFIED = 0,
    RULE_CATEGORY_CORE = 1,
    RULE_CATEGORY_ADDITIVE = 2,
}

enum ConditionType {
    CONDITION_TYPE_UNSPECIFIED = 0,
    CONDITION_TYPE_TIME = 1,
    CONDITION_TYPE_HOLIDAY = 2,
    CONDITION_TYPE_URGENCY = 3,
}

interface PricingKRuleDto {
    id: string;
    orgId?: string;
    name: string;
    ruleCategory: RuleCategory;
    conditionType: ConditionType;
    multiplier: string;
    metadata?: string;
    priority: number;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

const RULE_CATEGORY_LABELS: Record<RuleCategory, string> = {
    [RuleCategory.RULE_CATEGORY_UNSPECIFIED]: 'Unspecified',
    [RuleCategory.RULE_CATEGORY_CORE]: 'Core',
    [RuleCategory.RULE_CATEGORY_ADDITIVE]: 'Additive',
};

const RULE_CATEGORY_COLORS: Record<RuleCategory, string> = {
    [RuleCategory.RULE_CATEGORY_UNSPECIFIED]: 'bg-gray-100 text-gray-700',
    [RuleCategory.RULE_CATEGORY_CORE]: 'bg-blue-100 text-blue-700',
    [RuleCategory.RULE_CATEGORY_ADDITIVE]: 'bg-purple-100 text-purple-700',
};

const CONDITION_TYPE_LABELS: Record<ConditionType, string> = {
    [ConditionType.CONDITION_TYPE_UNSPECIFIED]: 'Unspecified',
    [ConditionType.CONDITION_TYPE_TIME]: 'Time',
    [ConditionType.CONDITION_TYPE_HOLIDAY]: 'Holiday',
    [ConditionType.CONDITION_TYPE_URGENCY]: 'Urgency',
};

type PricingRuleMeta = {
    timeStart: string;
    timeEnd: string;
    timeDays: number[];
    holidayDates: string[];
    urgencyPriority: string;
    urgencyMaxSlaHours: string;
};

interface PricingDistributionConfig {
    id: string;
    orgId?: string;
    techRate: string;
    companyRate: string;
    description?: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

const DEFAULT_PRICING_RULE_META: PricingRuleMeta = {
    timeStart: '18:00',
    timeEnd: '08:00',
    timeDays: [1, 2, 3, 4, 5],
    holidayDates: ['2026-01-01', '01-26'],
    urgencyPriority: 'URGENT',
    urgencyMaxSlaHours: '2',
};

const parsePricingRuleMeta = (conditionType: ConditionType, metadata?: string): PricingRuleMeta => {
    if (!metadata) return { ...DEFAULT_PRICING_RULE_META };
    try {
        const obj = JSON.parse(metadata) as Record<string, unknown>;
        if (conditionType === ConditionType.CONDITION_TYPE_TIME) {
            return {
                ...DEFAULT_PRICING_RULE_META,
                timeStart: String(obj.start ?? obj.time_start ?? DEFAULT_PRICING_RULE_META.timeStart),
                timeEnd: String(obj.end ?? obj.time_end ?? DEFAULT_PRICING_RULE_META.timeEnd),
                timeDays: Array.isArray(obj.days)
                    ? (obj.days as Array<number | string>).map((d) => Number(d)).filter((d) => !Number.isNaN(d))
                    : DEFAULT_PRICING_RULE_META.timeDays,
            };
        }
        if (conditionType === ConditionType.CONDITION_TYPE_HOLIDAY) {
            return {
                ...DEFAULT_PRICING_RULE_META,
                holidayDates: Array.isArray(obj.dates)
                    ? (obj.dates as Array<string | number>).map(String)
                    : DEFAULT_PRICING_RULE_META.holidayDates,
            };
        }
        if (conditionType === ConditionType.CONDITION_TYPE_URGENCY) {
            return {
                ...DEFAULT_PRICING_RULE_META,
                urgencyPriority: String(obj.priority ?? DEFAULT_PRICING_RULE_META.urgencyPriority),
                urgencyMaxSlaHours: obj.max_sla_hours != null ? String(obj.max_sla_hours) : DEFAULT_PRICING_RULE_META.urgencyMaxSlaHours,
            };
        }
        return { ...DEFAULT_PRICING_RULE_META };
    } catch {
        return { ...DEFAULT_PRICING_RULE_META };
    }
};

const buildPricingRuleMetadata = (conditionType: ConditionType, meta: PricingRuleMeta): string | undefined => {
    if (conditionType === ConditionType.CONDITION_TYPE_TIME) {
        const days = meta.timeDays.filter((d) => !Number.isNaN(d));
        const payload = {
            start: meta.timeStart?.trim(),
            end: meta.timeEnd?.trim(),
            days,
        };
        if (!payload.start && !payload.end && days.length === 0) return undefined;
        return JSON.stringify(payload);
    }
    if (conditionType === ConditionType.CONDITION_TYPE_HOLIDAY) {
        const dates = meta.holidayDates.map((d) => d.trim()).filter(Boolean);
        if (dates.length === 0) return undefined;
        return JSON.stringify({ dates });
    }
    if (conditionType === ConditionType.CONDITION_TYPE_URGENCY) {
        const priority = meta.urgencyPriority?.trim();
        const maxSla = meta.urgencyMaxSlaHours?.trim();
        if (!priority && !maxSla) return undefined;
        const payload: { priority?: string; max_sla_hours?: number } = {};
        if (priority) payload.priority = priority;
        if (maxSla && !Number.isNaN(Number(maxSla))) payload.max_sla_hours = Number(maxSla);
        return JSON.stringify(payload);
    }
    return undefined;
};

type ServiceCategoryDto = {
    id: string;
    name: string;
    description?: string;
    attributesSchema?: string;
    parentId?: string | null;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    status?: number;
    servicesCount?: number;
    // Extended fields for UI
    type?: string;
    engagementModel?: 'one-deal' | 'long-term' | 'subscription' | 'default';
};

type ServiceItemDto = {
    id: string;
    name: string;
    categoryId: string;
    sku: string;
    pricingModel: 'fixed' | 'recurring';
    price: number;
    currency: string;
    status: 'active' | 'inactive';
    description?: string;
    slaConfig?: string;
    defaultPriority?: string;
    config: Record<string, unknown>; // Pre-filled attributes based on category schema
};

type SlaRow = {
    key: string;
    hours: string;
};

const PRICING_MODEL_TO_ENUM: Record<ServiceItemDto['pricingModel'], number> = {
    fixed: 1,
    recurring: 2,
};

// CategoryStatus (matches protobuf) and UI mappings
enum CategoryStatus {
    CATEGORY_STATUS_UNSPECIFIED = 0,
    CATEGORY_STATUS_DRAFT = 1,
    CATEGORY_STATUS_PENDING = 2,
    CATEGORY_STATUS_APPROVED = 3,
    CATEGORY_STATUS_REJECTED = 4,
}

const CATEGORY_STATUS_LABELS: Record<CategoryStatus, string> = {
    [CategoryStatus.CATEGORY_STATUS_UNSPECIFIED]: 'Unspecified',
    [CategoryStatus.CATEGORY_STATUS_DRAFT]: 'Draft',
    [CategoryStatus.CATEGORY_STATUS_PENDING]: 'Pending',
    [CategoryStatus.CATEGORY_STATUS_APPROVED]: 'Approved',
    [CategoryStatus.CATEGORY_STATUS_REJECTED]: 'Rejected',
};

const CATEGORY_STATUS_DOT_CLASS: Record<CategoryStatus, string> = {
    [CategoryStatus.CATEGORY_STATUS_UNSPECIFIED]: 'bg-black',
    [CategoryStatus.CATEGORY_STATUS_DRAFT]: 'bg-gray-400',
    [CategoryStatus.CATEGORY_STATUS_PENDING]: 'bg-yellow-400',
    [CategoryStatus.CATEGORY_STATUS_APPROVED]: 'bg-green-500',
    [CategoryStatus.CATEGORY_STATUS_REJECTED]: 'bg-red-500',
};

const CATEGORY_STATUS_BADGE_CLASS: Record<CategoryStatus, string> = {
    [CategoryStatus.CATEGORY_STATUS_UNSPECIFIED]: 'bg-gray-100 text-gray-700',
    [CategoryStatus.CATEGORY_STATUS_DRAFT]: 'bg-gray-100 text-gray-700',
    [CategoryStatus.CATEGORY_STATUS_PENDING]: 'bg-yellow-100 text-yellow-800',
    [CategoryStatus.CATEGORY_STATUS_APPROVED]: 'bg-green-100 text-green-700',
    [CategoryStatus.CATEGORY_STATUS_REJECTED]: 'bg-red-100 text-red-700',
};

const isUuid = (value?: string | null): boolean => {
    if (!value) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
};


const DEFAULT_SCHEMA = `{
  "type": "object",
  "properties": {
    "printerModel": { "type": "string", "title": "Printer Model", "enum": ["Canon 2900", "HP LaserJet", "Brother HL"] },
    "counter": { "type": "number", "title": "Current Page Count" },
    "drumCondition": { "type": "string", "title": "Drum Status", "enum": ["Good", "Scratched", "Worn"] },
    "isTestPrintOk": { "type": "boolean", "title": "Test Print Passed?" }
  },
  "required": ["printerModel", "counter"]
}`;

// engagement tags / status metadata removed — unused in current UI

type ParsedSchema = {
    fields: Array<{
        key: string;
        title?: string;
        type?: string;
        enum?: string[];
        format?: string;
        description?: string;
        required: boolean;
    }>;
    isValid: boolean;
};

const parseSchema = (schemaJson: string): ParsedSchema => {
    try {
        const parsed = JSON.parse(schemaJson) as Record<string, unknown>;
        const props = (parsed.properties as Record<string, Record<string, unknown>> | undefined) || {};
        const required = (parsed.required as string[] | undefined) || [];
        const fields = Object.entries(props).map(([key, val]) => {
            const field = val || {};
            return {
                key,
                title: (field.title as string | undefined) ?? key,
                type: field.type as string | undefined,
                enum: field.enum as string[] | undefined,
                format: field.format as string | undefined,
                description: field.description as string | undefined,
                required: required.includes(key),
            };
        });
        return { fields, isValid: true };
    } catch {
        return { fields: [], isValid: false };
    }
};

const SLA_PRIORITY_OPTIONS = ['LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL'];

const parseSlaConfigToRows = (value?: string): SlaRow[] => {
    if (!value) return [];
    try {
        const parsed = JSON.parse(value) as Record<string, number | string>;
        return Object.entries(parsed).map(([key, hours]) => ({
            key: String(key).toUpperCase(),
            hours: String(hours),
        }));
    } catch {
        return [];
    }
};

const buildSlaConfigFromRows = (rows: SlaRow[]): string => {
    const payload: Record<string, number> = {};
    rows.forEach((row) => {
        const key = row.key.trim().toUpperCase();
        const hoursNum = Number(row.hours);
        if (key && !Number.isNaN(hoursNum) && hoursNum > 0) {
            payload[key] = hoursNum;
        }
    });
    return Object.keys(payload).length ? JSON.stringify(payload) : '';
};

const formatSchema = (schemaJson?: string): string => {
    if (!schemaJson) return DEFAULT_SCHEMA;
    try {
        const parsed = JSON.parse(schemaJson);
        return JSON.stringify(parsed, null, 2);
    } catch {
        return schemaJson;
    }
};

export default function ServiceConfigPage() {
    const { addToast } = useToast();
    const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
    const router = useRouter();
    const pathname = usePathname() ?? '';

    // mirror search params from window so we avoid CSR-bailout warning from Next's useSearchParams
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const read = () => setSearchParams(new URLSearchParams(window.location.search));
        read();
        const onPop = () => read();
        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, [pathname]);

    const [activeTab, setActiveTabState] = useState<'categories' | 'pricing' | 'knowledge'>('categories');

    // Sync from URL on mount / update
    useEffect(() => {
        const tab = searchParams?.get('tab') ?? null;
        if (tab === 'pricing' || tab === 'knowledge') {
            setActiveTabState(tab);
        } else {
            setActiveTabState('categories');
        }
    }, [searchParams]);

    const setActiveTab = (tab: 'categories' | 'pricing' | 'knowledge') => {
        setActiveTabState(tab);
        const params = new URLSearchParams(searchParams?.toString() ?? '');
        params.set('tab', tab);
        // Using replace to update URL without adding to history stack for every tab click, 
        // preventing "back" button fatigue, while preserving F5 capability.
        const query = params.toString() ? `?${params.toString()}` : '';
        router.replace(`${pathname}${query}`, { scroll: false }); 
    };
    
    // Selection State
    const [selectedType, setSelectedType] = useState<'category' | 'service'>('category');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

    // UI State
    const [viewMode, setViewMode] = useState<'visual' | 'code'>('code');
    const [knowledgeFilter, setKnowledgeFilter] = useState<'all' | 'pending' | 'published' | 'rejected'>('all');
    const [showPreview, setShowPreview] = useState(false);
    
    // Data State
    const [categories, setCategories] = useState<ServiceCategoryDto[]>([]);
    const [servicesMap, setServicesMap] = useState<Record<string, ServiceItemDto[]>>({});
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    // Async State
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [categoryError, setCategoryError] = useState<string | null>(null);
    const [pageSize] = useState<number>(6);
    const [pageToken, setPageToken] = useState<string>('');
    const [nextPageToken, setNextPageToken] = useState<string>('');
    const [prevPageTokens, setPrevPageTokens] = useState<string[]>([]);
    const [pageIndex, setPageIndex] = useState<number>(1);

    // Form/Edit State
    const [schemaDraft, setSchemaDraft] = useState(DEFAULT_SCHEMA);
    const [isSavingSchema, setIsSavingSchema] = useState(false);

    // Distribution Config State
    const [distributionConfigs, setDistributionConfigs] = useState<PricingDistributionConfig[]>([]);
    const [isLoadingDistributionConfigs, setIsLoadingDistributionConfigs] = useState(false);
    const [distributionConfigsError, setDistributionConfigsError] = useState<string | null>(null);
    const [showDistributionModal, setShowDistributionModal] = useState(false);
    const [distributionConfigForm, setDistributionConfigForm] = useState<Partial<PricingDistributionConfig>>({
        techRate: '0.90',
        companyRate: '0.10',
        description: '',
        isActive: true,
    });
    const [isSavingDistribution, setIsSavingDistribution] = useState(false);
    const [editingDistributionConfig, setEditingDistributionConfig] = useState<PricingDistributionConfig | null>(null);
    const [schemaError, setSchemaError] = useState<string | null>(null);
    const [activeService, setActiveService] = useState<ServiceItemDto | null>(null);
    const [isSavingService, setIsSavingService] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    // Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createName, setCreateName] = useState('');
    const [createDescription, setCreateDescription] = useState('');
    const [createType, setCreateType] = useState('hardware');
    const [createEngagement, setCreateEngagement] = useState('one-deal');
    const [createParentId, setCreateParentId] = useState('');
    const [createSchema, setCreateSchema] = useState(DEFAULT_SCHEMA);
    const [createError, setCreateError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    // Create Service Modal State
    const [showCreateServiceModal, setShowCreateServiceModal] = useState(false);
    const [svcCreateName, setSvcCreateName] = useState('');
    const [svcCreateSku, setSvcCreateSku] = useState('');
    const [svcCreatePrice, setSvcCreatePrice] = useState<number | undefined>(0);
    const [svcCreatePriceInput, setSvcCreatePriceInput] = useState<string>('');
    const [svcCreatePricingModel, setSvcCreatePricingModel] = useState<'fixed' | 'recurring'>('fixed');
    const [svcCreateSlaConfig, setSvcCreateSlaConfig] = useState<string>('');
    const [svcCreateDefaultPriority, setSvcCreateDefaultPriority] = useState<string>('');
    const [svcCreateSlaRows, setSvcCreateSlaRows] = useState<SlaRow[]>([]);
    const [svcCreateError, setSvcCreateError] = useState<string | null>(null);
    const [isCreatingService, setIsCreatingService] = useState(false);
    const [activePriceInput, setActivePriceInput] = useState<string>('');
    const [activeSlaRows, setActiveSlaRows] = useState<SlaRow[]>([]);

    // Confirm Modal state for deletions (replace window.confirm)
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmTarget, setConfirmTarget] = useState<{ type: 'rule' | 'distribution'; id?: string; name?: string } | null>(null);
    const [isConfirmLoading, setIsConfirmLoading] = useState(false);

    const selectedCategory = useMemo(
        () => categories.find((c) => c.id === selectedCategoryId) || null,
        [categories, selectedCategoryId]
    );

    // Helper to update active service and keep servicesMap in sync so list reflects edits immediately
    const updateActiveAndMap = (changes: Partial<ServiceItemDto>) => {
        setActiveService(prev => {
            if (!prev) return prev;
            const updated = { ...prev, ...changes } as ServiceItemDto;
            setServicesMap(prevMap => {
                const catId = updated.categoryId;
                if (!catId) return prevMap;
                const list = prevMap[catId] || [];
                const exists = list.some(s => s.id === updated.id);
                const newList = exists ? list.map(s => s.id === updated.id ? { ...s, ...updated } : s) : [...list, updated];
                return { ...prevMap, [catId]: newList };
            });
            return updated;
        });
    };

    // VND formatting helpers
    const formatVND = (value?: number | string) => {
        if (value === undefined || value === null || value === '') return '';
        const num = typeof value === 'number' ? value : Number(String(value).replace(/[^0-9]/g, ''));
        if (!isFinite(num)) return '';
        return num.toLocaleString('vi-VN');
    };

    const parseVND = (text: string) => {
        if (!text) return 0;
        const digits = String(text).replace(/[^0-9]/g, '');
        return digits === '' ? 0 : Number(digits);
    };

    // Map server service shape to UI ServiceItemDto
    const mapServerService = (s: unknown, defaultCatId?: string): ServiceItemDto => {
        const obj = (s as Record<string, unknown>) || {};
        const id = String(obj.id ?? obj.serviceId ?? obj.service_id ?? '');
        const catId = String(obj.categoryId ?? obj.category_id ?? defaultCatId ?? '');
        const pricingNum = Number(obj.pricingModel ?? obj.pricing_model ?? 1);
        const pricingModel = pricingNum === 2 ? 'recurring' as const : 'fixed' as const;
        const price = Number(obj.basePrice ?? obj.base_price ?? 0);
        let config: Record<string, unknown> = {};
        try { config = obj.attributes ? JSON.parse(String(obj.attributes)) : {}; } catch { config = {}; }
        const status = (obj.isActive || obj.is_active) ? 'active' : 'inactive';
        return {
            id,
            name: String(obj.name ?? ''),
            categoryId: catId,
            sku: String(obj.code ?? ''),
            pricingModel,
            price,
            currency: String(obj.currency ?? '₫'),
            status,
            description: obj.description == null ? undefined : String(obj.description),
            slaConfig: obj.slaConfig ?? obj.sla_config ? String(obj.slaConfig ?? obj.sla_config) : undefined,
            defaultPriority: obj.defaultPriority ?? obj.default_priority ? String(obj.defaultPriority ?? obj.default_priority) : undefined,
            config,
        };
    };

    // Persist selection/expanded state so F5 keeps the same open row
    const LS_SELECTED_CAT = 'serviceConfig.selectedCategoryId';
    const LS_SELECTED_SVC = 'serviceConfig.selectedServiceId';
    const LS_EXPANDED = 'serviceConfig.expandedCategories';

    // ===================== PRICING K-RULES STATE =====================
    const [pricingRules, setPricingRules] = useState<PricingKRuleDto[]>([]);
    const [isLoadingPricingRules, setIsLoadingPricingRules] = useState(false);
    const [pricingRulesError, setPricingRulesError] = useState<string | null>(null);
    // Modal state for create/edit pricing rule
    const [showPricingRuleModal, setShowPricingRuleModal] = useState(false);
    const [editingPricingRule, setEditingPricingRule] = useState<PricingKRuleDto | null>(null);
    const [pricingRuleForm, setPricingRuleForm] = useState({
        name: '',
        ruleCategory: RuleCategory.RULE_CATEGORY_CORE,
        conditionType: ConditionType.CONDITION_TYPE_TIME,
        multiplier: '1',
        priority: 0,
    });
    const [pricingRuleMeta, setPricingRuleMeta] = useState<PricingRuleMeta>(DEFAULT_PRICING_RULE_META);
    const [holidayDateInput, setHolidayDateInput] = useState<string>('');
    const [holidayRecurringMonth, setHolidayRecurringMonth] = useState<string>('');
    const [holidayRecurringDay, setHolidayRecurringDay] = useState<string>('');
    const [isSavingPricingRule, setIsSavingPricingRule] = useState(false);
    const [pricingRuleFormError, setPricingRuleFormError] = useState<string | null>(null);
    // Simulator state
    const [simulatorBasePrice, setSimulatorBasePrice] = useState<number>(500000);
    const [simulatorSelectedRules, setSimulatorSelectedRules] = useState<Set<string>>(new Set());

    // Helper to fetch services for a category. Returns the mapped ServiceItemDto[].
    const loadServicesForCategory = useCallback(async (catId: string, force = false): Promise<ServiceItemDto[]> => {
        const cat = categories.find(c => c.id === catId);
        if (!cat) return [];

        // If we already have services for this category, don't overwrite unless force reload
        if (!force && servicesMap[catId]) return servicesMap[catId];

        try {
            const url = new URL(window.location.origin + '/api/admin/catalog/services');
            url.searchParams.set('category_id', catId);
            url.searchParams.set('page_size', '100');
            // include inactive services so the UI shows all products (not only active)
            url.searchParams.set('show_inactive', 'true');

            const res = await fetch(url.toString());
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Failed to load services');

            const list = (data.services as unknown[]) || [];
            const services: ServiceItemDto[] = list.map(s => mapServerService(s, catId));

            // store whatever the API returned (may be empty array)
            setServicesMap(prev => ({ ...prev, [catId]: services }));
            return services;
        } catch {
            console.error('[loadServicesForCategory] failed');
            // reflect failure with an empty list and notify user
            setServicesMap(prev => ({ ...prev, [catId]: [] }));
            addToast(`Không tải được danh sách dịch vụ cho "${cat.name}"`, { type: 'error' });
            return [];
        }
    }, [categories, servicesMap, addToast]);

    // restore saved state when categories list changes (initial load)
    useEffect(() => {
        try {
            const savedCat = typeof window !== 'undefined' ? localStorage.getItem(LS_SELECTED_CAT) : null;
            const savedSvc = typeof window !== 'undefined' ? localStorage.getItem(LS_SELECTED_SVC) : null;
            const savedExp = typeof window !== 'undefined' ? localStorage.getItem(LS_EXPANDED) : null;
            if (savedExp) {
                try { const arr = JSON.parse(savedExp) as string[]; setExpandedCategories(new Set(arr)); } catch {}
            }

            if (savedCat) {
                const exists = categories.find(c => c.id === savedCat);
                if (exists) {
                    setSelectedCategoryId(savedCat);
                    setExpandedCategories(prev => { const n = new Set(prev); n.add(savedCat); return n; });
                    // trigger services load
                    // loadServicesForCategory is declared above
                    void loadServicesForCategory(savedCat);
                    if (savedSvc) {
                        // if services already loaded, select; otherwise set id and wait for servicesMap effect
                        const list = servicesMap[savedCat] || [];
                        const svc = list.find(s => s.id === savedSvc);
                        if (svc) {
                            handleSelectService(svc);
                        } else {
                            setSelectedServiceId(savedSvc);
                        }
                    }
                }
            }
        } catch {
            // no-op
        }
    }, [categories, servicesMap, loadServicesForCategory]);

    // when servicesMap updates, if we have a saved selectedServiceId ensure it's selected once available
    useEffect(() => {
        if (!selectedServiceId || !selectedCategoryId) return;
        const list = servicesMap[selectedCategoryId] || [];
        const svc = list.find(s => s.id === selectedServiceId);
        if (svc && (!activeService || activeService.id !== svc.id)) {
            handleSelectService(svc);
        }
    }, [servicesMap, selectedCategoryId, selectedServiceId, activeService]);

    // persist selections
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (selectedCategoryId) localStorage.setItem(LS_SELECTED_CAT, selectedCategoryId); else localStorage.removeItem(LS_SELECTED_CAT);
    }, [selectedCategoryId]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (selectedServiceId) localStorage.setItem(LS_SELECTED_SVC, selectedServiceId); else localStorage.removeItem(LS_SELECTED_SVC);
    }, [selectedServiceId]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(LS_EXPANDED, JSON.stringify(Array.from(expandedCategories)));
    }, [expandedCategories]);

    // pricing mapping moved to `mapServerService` / handled when mapping server response

    const toggleExpandCategory = (catId: string) => {
        // Only one category open at a time. Toggling the same category closes it.
        if (expandedCategories.has(catId)) {
            setExpandedCategories(new Set());
        } else {
            setExpandedCategories(new Set([catId]));
            void loadServicesForCategory(catId, true);
        }
    };

    const handleSelectCategory = (catId: string) => {
        setSelectedCategoryId(catId);
        setSelectedType('category');
        setSelectedServiceId(null);
        setActiveService(null);

        // Expand only this category and load its services
        setExpandedCategories(new Set([catId]));
        void loadServicesForCategory(catId, true);
    };

    const handleSelectService = (service: ServiceItemDto) => {
        setSelectedCategoryId(service.categoryId);
        setSelectedServiceId(service.id);
        setSelectedType('service');
        setActiveService({ ...service });
    };

    

    const parsedSchema = useMemo(() => parseSchema(schemaDraft), [schemaDraft]);

    // ===================== PRICING K-RULES FUNCTIONS =====================
    const loadPricingRules = useCallback(async () => {
        setIsLoadingPricingRules(true);
        setPricingRulesError(null);
        try {
            const url = new URL(window.location.origin + '/api/admin/pricing/k-rules');
            url.searchParams.set('page_size', '100');

            const res = await fetch(url.toString());
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.error || 'Failed to load pricing rules');
            }

            const rules = (data.rules as PricingKRuleDto[]) || [];
            setPricingRules(rules);
        } catch (err) {
            setPricingRulesError(err instanceof Error ? err.message : 'Failed to load pricing rules');
        } finally {
            setIsLoadingPricingRules(false);
        }
    }, []);

    const loadDistributionConfigs = useCallback(async () => {
        setIsLoadingDistributionConfigs(true);
        setDistributionConfigsError(null);
        try {
            const url = new URL(window.location.origin + '/api/admin/pricing/distribution-configs');
            url.searchParams.set('page_size', '100');

            const res = await fetch(url.toString());
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.error || 'Failed to load distribution configs');
            }

            const configs = (data.configs as PricingDistributionConfig[]) || [];
            setDistributionConfigs(configs);
        } catch (err) {
            setDistributionConfigsError(err instanceof Error ? err.message : 'Failed to load distribution configs');
        } finally {
            setIsLoadingDistributionConfigs(false);
        }
    }, []);

    // Load pricing rules when pricing tab is selected
    useEffect(() => {
        if (activeTab === 'pricing') {
            void loadPricingRules();
            void loadDistributionConfigs();
        }
    }, [activeTab, loadPricingRules, loadDistributionConfigs]);

    const handleCreatePricingRule = () => {
        setEditingPricingRule(null);
        setPricingRuleForm({
            name: '',
            ruleCategory: RuleCategory.RULE_CATEGORY_CORE,
            conditionType: ConditionType.CONDITION_TYPE_TIME,
            multiplier: '1',
            priority: pricingRules.length,
        });
        setPricingRuleMeta({ ...DEFAULT_PRICING_RULE_META });
        setHolidayDateInput('');
        setHolidayRecurringMonth('');
        setHolidayRecurringDay('');
        setPricingRuleFormError(null);
        setShowPricingRuleModal(true);
    };

    const handleEditPricingRule = (rule: PricingKRuleDto) => {
        setEditingPricingRule(rule);
        setPricingRuleForm({
            name: rule.name,
            ruleCategory: rule.ruleCategory,
            conditionType: rule.conditionType,
            multiplier: rule.multiplier,
            priority: rule.priority,
        });
        setPricingRuleMeta(parsePricingRuleMeta(rule.conditionType, rule.metadata));
        setHolidayDateInput('');
        setHolidayRecurringMonth('');
        setHolidayRecurringDay('');
        setPricingRuleFormError(null);
        setShowPricingRuleModal(true);
    };

    const handleSavePricingRule = async () => {
        setPricingRuleFormError(null);
        if (!pricingRuleForm.name.trim()) {
            setPricingRuleFormError('Rule name is required');
            return;
        }
        if (!pricingRuleForm.multiplier.trim()) {
            setPricingRuleFormError('Multiplier/value is required');
            return;
        }

        setIsSavingPricingRule(true);
        try {
            const isEditing = !!editingPricingRule;
            const url = '/api/admin/pricing/k-rules';
            const method = isEditing ? 'PATCH' : 'POST';
            const payload = {
                ...(isEditing ? { id: editingPricingRule.id } : {}),
                name: pricingRuleForm.name.trim(),
                rule_category: pricingRuleForm.ruleCategory,
                condition_type: pricingRuleForm.conditionType,
                multiplier: pricingRuleForm.multiplier.trim(),
                metadata: buildPricingRuleMetadata(pricingRuleForm.conditionType, pricingRuleMeta),
                priority: pricingRuleForm.priority,
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.error || `Failed to ${isEditing ? 'update' : 'create'} pricing rule`);
            }

            if (data.rule) {
                const savedRule = data.rule as PricingKRuleDto;
                if (isEditing) {
                    setPricingRules(prev => prev.map(r => r.id === savedRule.id ? savedRule : r));
                } else {
                    setPricingRules(prev => [...prev, savedRule]);
                }
                addToast(`Pricing rule ${isEditing ? 'updated' : 'created'} successfully`, { type: 'success' });
            }

            setShowPricingRuleModal(false);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to save pricing rule';
            setPricingRuleFormError(msg);
            addToast(msg, { type: 'error' });
        } finally {
            setIsSavingPricingRule(false);
        }
    };

    // Distribution Config Handlers
    const handleSaveDistributionConfig = async () => {
        setIsSavingDistribution(true);
        const techRate = distributionConfigForm.techRate?.trim() || '';
        const companyRate = distributionConfigForm.companyRate?.trim() || '';

        const techNum = Number(techRate);
        const companyNum = Number(companyRate);
        if (!techRate || !companyRate || Number.isNaN(techNum) || Number.isNaN(companyNum)) {
            addToast('Tech Rate và Company Rate phải là số hợp lệ', { type: 'error' });
            setIsSavingDistribution(false);
            return;
        }
        if (Math.abs(techNum + companyNum - 1) > 0.0001) {
            addToast('Tổng tech_rate + company_rate phải bằng 1.00', { type: 'error' });
            setIsSavingDistribution(false);
            return;
        }

        try {
            const isEditing = !!editingDistributionConfig;
            const url = '/api/admin/pricing/distribution-configs';
            const method = isEditing ? 'PATCH' : 'POST';
            const payload = {
                ...(isEditing ? { id: editingDistributionConfig.id } : {}),
                tech_rate: techRate,
                company_rate: companyRate,
                description: distributionConfigForm.description?.trim() || '',
                is_active: distributionConfigForm.isActive ?? true,
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.error || `Failed to ${isEditing ? 'update' : 'create'} distribution config`);
            }

            if (data.config) {
                const savedConfig = data.config as PricingDistributionConfig;
                if (isEditing) {
                    setDistributionConfigs(prev => prev.map(c => c.id === savedConfig.id ? savedConfig : c));
                } else {
                    setDistributionConfigs(prev => [...prev, savedConfig]);
                }
                addToast(`Config ${isEditing ? 'updated' : 'created'} successfully`, { type: 'success' });
            } else {
                void loadDistributionConfigs();
            }

            setShowDistributionModal(false);
            setEditingDistributionConfig(null);
            setDistributionConfigForm({ techRate: '0.90', companyRate: '0.10', description: '', isActive: true });
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to save distribution config';
            addToast(msg, { type: 'error' });
        } finally {
            setIsSavingDistribution(false);
        }
    };

    const handleDeleteDistributionConfig = (id: string) => {
        setConfirmTarget({ type: 'distribution', id });
        setConfirmModalOpen(true);
    };

    const performConfirmDelete = async () => {
        if (!confirmTarget) return;
        setIsConfirmLoading(true);
        try {
            if (confirmTarget.type === 'distribution') {
                const id = confirmTarget.id!;
                const url = new URL(window.location.origin + '/api/admin/pricing/distribution-configs');
                url.searchParams.set('id', id);
                const res = await fetch(url.toString(), { method: 'DELETE' });
                const data = await res.json();
                if (!res.ok) throw new Error(data?.error || 'Failed to delete config');
                setDistributionConfigs(prev => prev.filter(c => c.id !== id));
                addToast('Config deleted', { type: 'success' });
            } else if (confirmTarget.type === 'rule') {
                const id = confirmTarget.id!;
                const url = new URL(window.location.origin + '/api/admin/pricing/k-rules');
                url.searchParams.set('id', id);
                const res = await fetch(url.toString(), { method: 'DELETE' });
                const data = await res.json();
                if (!res.ok) throw new Error(data?.error || 'Failed to delete pricing rule');
                setPricingRules(prev => prev.filter(r => r.id !== id));
                setSimulatorSelectedRules(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(id);
                    return newSet;
                });
                addToast('Pricing rule deleted', { type: 'success' });
            }
        } catch (err) {
            addToast(err instanceof Error ? err.message : 'Failed to delete item', { type: 'error' });
        } finally {
            setIsConfirmLoading(false);
            setConfirmModalOpen(false);
            setConfirmTarget(null);
        }
    };

    const handleTogglePricingRuleActive = async (rule: PricingKRuleDto) => {
        try {
            const res = await fetch('/api/admin/pricing/k-rules', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: rule.id,
                    is_active: !rule.isActive,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.error || 'Failed to toggle rule status');
            }

            if (data.rule) {
                const updatedRule = data.rule as PricingKRuleDto;
                setPricingRules(prev => prev.map(r => r.id === updatedRule.id ? updatedRule : r));
                addToast(`Rule ${updatedRule.isActive ? 'enabled' : 'disabled'}`, { type: 'success' });
            }
        } catch (err) {
            addToast(err instanceof Error ? err.message : 'Failed to toggle rule', { type: 'error' });
        }
    };

    const handleDeletePricingRule = (rule: PricingKRuleDto) => {
        setConfirmTarget({ type: 'rule', id: rule.id, name: rule.name });
        setConfirmModalOpen(true);
    };

    // Simulator calculations
    const simulatorCalculation = useMemo(() => {
        const selectedRules = pricingRules.filter(r => simulatorSelectedRules.has(r.id) && r.isActive);
        let totalAdditive = 0;
        let coreMultiplier = 1;

        for (const rule of selectedRules) {
            const value = parseFloat(rule.multiplier) || 0;
            if (rule.ruleCategory === RuleCategory.RULE_CATEGORY_ADDITIVE) {
                totalAdditive += value;
            } else if (coreMultiplier === 1) {
                coreMultiplier = value || 1;
            }
        }

        const totalMultiplier = coreMultiplier + totalAdditive;
        const surchargeFromMultiplier = simulatorBasePrice * (totalMultiplier - 1);
        const finalPrice = simulatorBasePrice * totalMultiplier;

        return {
            totalMultiplier,
            totalAdditive,
            surchargeAmount: surchargeFromMultiplier,
            finalPrice,
            selectedRules,
        };
    }, [pricingRules, simulatorSelectedRules, simulatorBasePrice]);

    const toggleSimulatorRule = (ruleId: string) => {
        const selectedRule = pricingRules.find(r => r.id === ruleId);
        setSimulatorSelectedRules(prev => {
            const newSet = new Set(prev);
            if (newSet.has(ruleId)) {
                newSet.delete(ruleId);
                return newSet;
            }

            if (selectedRule?.ruleCategory === RuleCategory.RULE_CATEGORY_CORE) {
                // Only one CORE rule can be selected at a time
                pricingRules.forEach(rule => {
                    if (rule.ruleCategory === RuleCategory.RULE_CATEGORY_CORE) {
                        newSet.delete(rule.id);
                    }
                });
            }

            newSet.add(ruleId);
            return newSet;
        });
    };

    // Mock knowledge base articles
    const knowledgeArticles = [
        {
            id: 1,
            title: 'Fixing Error 52 on Canon 2900',
            status: 'PENDING REVIEW',
            statusColor: 'bg-orange-100 text-orange-700',
            author: 'Tech Nguyen Van A',
            category: 'Hardware',
            description: 'Laser unit error solution involving polygon mirror cleaning.',
            tags: ['#Printer', '#Canon', '#Repair'],
        },
        {
            id: 2,
            title: 'Outlook 365 Indexing Fix',
            status: 'PUBLISHED',
            statusColor: 'bg-green-100 text-green-700',
            author: 'Tech Tran Thi B',
            category: 'Software',
            description: 'Rebuilding search index for large mailboxes.',
            tags: ['#Office365', '#Outlook'],
        },
        {
            id: 3,
            title: 'Cisco Switch VLAN Config',
            status: 'DRAFT',
            statusColor: 'bg-gray-100 text-gray-700',
            author: 'Tech Le Van C',
            category: 'Network',
            description: 'Standard VLAN setup for office segmentation.',
            tags: ['#Network', '#Cisco'],
        },
    ];

    const loadCategories = useCallback(async (token = pageToken) => {
        setIsLoadingCategories(true);
        setCategoryError(null);
        try {
            const url = new URL(window.location.origin + '/api/admin/catalog/categories');
            url.searchParams.set('page_size', String(pageSize));
            if (token) url.searchParams.set('page_token', token);

            const res = await fetch(url.toString());
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.error || 'Failed to load categories');
            }

            const list = (data.categories as ServiceCategoryDto[]) || [];
            setCategories(list);
            if (list.length > 0 && !selectedCategoryId) {
                setSelectedCategoryId(list[0].id);
            }

            // update next/prev tokens
            const next = (data.nextPageToken ?? data.next_page_token ?? '') as string;
            setNextPageToken(next || '');

            // debug info to help diagnose pagination issues
            // (shows pageSize, requested token, returned count and next token)
            // remove in production if desired
            console.debug('loadCategories', { pageSize, requestedToken: token, returnedCount: list.length, next });
        } catch (err) {
            setCategoryError(err instanceof Error ? err.message : 'Failed to load categories');
        } finally {
            setIsLoadingCategories(false);
        }
    }, [pageSize, pageToken, selectedCategoryId]);

    useEffect(() => {
        // load initial page or when loadCategories function changes
        void loadCategories();
    }, [loadCategories]);

    const handleNextPage = () => {
        if (!nextPageToken) {
            // If backend didn't return a token but list is full, inform user
            if (categories.length >= pageSize) {
                addToast('Không thể chuyển trang: backend không trả next_page_token', { type: 'info' });
            }
            return;
        }

        setPrevPageTokens((p) => [...p, pageToken]);
        setPageToken(nextPageToken);
        setPageIndex((i) => i + 1);
    };

    const handlePrevPage = () => {
        if (prevPageTokens.length === 0) return;
        const last = prevPageTokens[prevPageTokens.length - 1];
        const rest = prevPageTokens.slice(0, -1);
        setPrevPageTokens(rest);
        setPageToken(last);
        setPageIndex((i) => Math.max(1, i - 1));
    };

    const activeSlaKeys = useMemo(() => {
        const keys = activeSlaRows.map(row => row.key.trim().toUpperCase()).filter(Boolean);
        return Array.from(new Set(keys));
    }, [activeSlaRows]);

    const createSlaKeys = useMemo(() => {
        const keys = svcCreateSlaRows.map(row => row.key.trim().toUpperCase()).filter(Boolean);
        return Array.from(new Set(keys));
    }, [svcCreateSlaRows]);

    const updateActiveSlaRows = (rows: SlaRow[]) => {
        setActiveSlaRows(rows);
        const slaConfig = buildSlaConfigFromRows(rows);
        const keys = Array.from(new Set(rows.map(row => row.key.trim().toUpperCase()).filter(Boolean)));
        const nextDefault = keys.includes(activeService?.defaultPriority ?? '') ? activeService?.defaultPriority : '';
        updateActiveAndMap({
            slaConfig,
            defaultPriority: nextDefault || undefined,
        });
    };

    const updateCreateSlaRows = (rows: SlaRow[]) => {
        setSvcCreateSlaRows(rows);
        const slaConfig = buildSlaConfigFromRows(rows);
        setSvcCreateSlaConfig(slaConfig);
        const keys = Array.from(new Set(rows.map(row => row.key.trim().toUpperCase()).filter(Boolean)));
        if (!keys.includes(svcCreateDefaultPriority)) {
            setSvcCreateDefaultPriority('');
        }
    };

    useEffect(() => {
        if (selectedCategory) {
            setSchemaDraft(formatSchema(selectedCategory.attributesSchema));
        }
    }, [selectedCategory]);

    // keep formatted inputs in sync when active service changes or modal opens
    useEffect(() => {
        if (showCreateServiceModal) {
            setSvcCreatePriceInput(formatVND(svcCreatePrice));
        }
    }, [showCreateServiceModal, svcCreatePrice]);

    useEffect(() => {
        if (!showCreateServiceModal) return;
        setSvcCreateSlaRows(parseSlaConfigToRows(svcCreateSlaConfig));
    }, [showCreateServiceModal, svcCreateSlaConfig]);

    useEffect(() => {
        setActivePriceInput(formatVND(activeService?.price));
    }, [activeService]);

    useEffect(() => {
        setActiveSlaRows(parseSlaConfigToRows(activeService?.slaConfig));
    }, [activeService?.slaConfig]);

    const handleUpdateCategoryStatus = async (newStatus: CategoryStatus) => {
        if (!selectedCategory) return;
        setIsUpdatingStatus(true);
        try {
            let action = '';
            const method = 'POST';
            if (newStatus === CategoryStatus.CATEGORY_STATUS_PENDING) action = 'submit';
            else if (newStatus === CategoryStatus.CATEGORY_STATUS_APPROVED) action = 'approve';
            else if (newStatus === CategoryStatus.CATEGORY_STATUS_REJECTED) action = 'reject';
            else throw new Error('Invalid status transition');

            const url = `/api/admin/catalog/categories/${selectedCategory.id}/${action}`;
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                // For reject, we might want to pass a reason, but simplistic for now
                body: JSON.stringify({}), 
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.error || `Failed to ${action} category`);
            }
            
            // Update local state with the returned category (which should have new status)
            if (data.category) {
                 setCategories(prev => prev.map(c => c.id === data.category.id ? data.category : c));
            } else {
                 setCategories(prev => prev.map(c => c.id === selectedCategory.id ? { ...c, status: newStatus } : c));
            }

            addToast(`Category ${action} successful`, { type: 'success' });
        } catch (err) {
            addToast(err instanceof Error ? err.message : 'Failed to update category status', { type: 'error' });
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleSaveSchema = async () => {
        setSchemaError(null);
        if (!selectedCategory) {
            setSchemaError('Please select a category first.');
            return;
        }

        const parsed = parseSchema(schemaDraft);
        if (!parsed.isValid) {
            setSchemaError('Invalid JSON schema. Please fix before saving.');
            return;
        }

        setIsSavingSchema(true);
        try {
            const res = await fetch('/api/admin/catalog/categories', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedCategory.id,
                    attributes_schema: schemaDraft,
                    status: selectedCategory.status ?? 0,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.error || 'Failed to save schema');
            }

            if (data.category) {
                const updated = data.category as ServiceCategoryDto;
                setCategories((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
                setSchemaDraft(formatSchema(updated.attributesSchema));
                addToast('Schema saved successfully', { type: 'success' });
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to save schema';
            setSchemaError(msg);
            addToast(msg, { type: 'error' });
        } finally {
            setIsSavingSchema(false);
        }
    };

    const handleSaveServiceConfig = async () => {
        if (!activeService) return;
        setIsSavingService(true);
        try {
                const payload = {
                id: activeService.id,
                category_id: activeService.categoryId,
                name: activeService.name,
                    description: activeService.description || undefined,
                code: activeService.sku,
                pricing_model: PRICING_MODEL_TO_ENUM[activeService.pricingModel] ?? 0,
                base_price: String(activeService.price),
                attributes: JSON.stringify(activeService.config || {}),
                    sla_config: activeService.slaConfig || undefined,
                    default_priority: activeService.defaultPriority || undefined,
            };

            const isNewService = !isUuid(activeService.id);
            const res = await fetch('/api/admin/catalog/services', {
                method: isNewService ? 'POST' : 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(
                    isNewService
                        ? {
                            category_id: payload.category_id,
                            name: payload.name,
                            description: payload.description,
                            code: payload.code,
                            pricing_model: payload.pricing_model,
                            base_price: payload.base_price,
                            attributes: payload.attributes,
                            sla_config: payload.sla_config,
                            default_priority: payload.default_priority,
                        }
                        : payload
                ),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.error || 'Failed to update service');
            }

            if (data.service) {
                const updated = data.service as ServiceItemDto;
                setServicesMap(prev => {
                    const list = prev[updated.categoryId] || [];
                    const newList = list.map(s => (s.id === (isNewService ? activeService.id : updated.id) ? { ...s, ...updated } : s));
                    // if updated service moved category, ensure it's placed correctly
                    return { ...prev, [updated.categoryId]: newList };
                });
                setActiveService(prev => ({ ...(prev || {}), ...updated } as ServiceItemDto));
                addToast(isNewService ? 'Service created successfully' : 'Service saved successfully', { type: 'success' });
            } else {
                // fallback: update local copy
                setServicesMap(prev => {
                    const catId = activeService.categoryId;
                    const list = prev[catId] || [];
                    const newList = list.map(s => s.id === activeService.id ? activeService : s);
                    return { ...prev, [catId]: newList };
                });
                addToast('Service saved locally', { type: 'info' });
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to save service';
            addToast(msg, { type: 'error' });
        } finally {
            setIsSavingService(false);
        }
    };

    const handleCreateCategory = async () => {
        setCreateError(null);
        if (!createName.trim()) {
            setCreateError('Category name is required.');
            return;
        }

        const parsed = parseSchema(createSchema);
        if (!parsed.isValid) {
            setCreateError('Invalid JSON schema. Please fix before creating.');
            return;
        }

        setIsCreating(true);
        try {
            const res = await fetch('/api/admin/catalog/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: createName.trim(),
                    description: createDescription.trim() || undefined,
                    parent_id: createParentId || undefined,
                    attributes_schema: createSchema,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.error || 'Failed to create category');
            }

            if (data.category) {
                const created = data.category as ServiceCategoryDto;
                setCategories((prev) => [created, ...prev]);
                setSelectedCategoryId(created.id);
                setSchemaDraft(formatSchema(created.attributesSchema));
                addToast('Category created', { type: 'success' });
            }

            setCreateName('');
            setCreateDescription('');
            setCreateParentId('');
            setCreateSchema(DEFAULT_SCHEMA);
            setShowCreateModal(false);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to create category';
            setCreateError(msg);
            addToast(msg, { type: 'error' });
        } finally {
            setIsCreating(false);
        }
    };

    const handleSubmitCreateService = async () => {
        setSvcCreateError(null);
        if (!createParentId) {
            setSvcCreateError('Parent category required');
            return;
        }
        if (!svcCreateName.trim()) {
            setSvcCreateError('Service name is required');
            return;
        }
        setIsCreatingService(true);
        try {
            const res = await fetch('/api/admin/catalog/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category_id: createParentId,
                    name: svcCreateName.trim(),
                    description: undefined,
                    code: svcCreateSku || undefined,
                    pricing_model: PRICING_MODEL_TO_ENUM[svcCreatePricingModel] ?? 0,
                    base_price: String(svcCreatePrice ?? 0),
                    attributes: '{}',
                    sla_config: svcCreateSlaConfig.trim() || undefined,
                    default_priority: svcCreateDefaultPriority.trim() || undefined,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Failed to create service');

            if (data.service) {
                // Backend returned created service; map and insert into local map then select it.
                const svcRaw = data.service;
                const svc = mapServerService(svcRaw, createParentId);
                setServicesMap(prev => {
                    const list = prev[svc.categoryId] || [];
                    const exists = list.some(x => x.id === svc.id);
                    const newList = exists ? list.map(x => x.id === svc.id ? svc : x) : [...list, svc];
                    return { ...prev, [svc.categoryId]: newList };
                });
                setSelectedServiceId(svc.id);
                setActiveService(svc);
                addToast('Service created', { type: 'success' });
            }

            setShowCreateServiceModal(false);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to create service';
            setSvcCreateError(msg);
            addToast(msg, { type: 'error' });
        } finally {
            setIsCreatingService(false);
        }
    };

    const handleAddField = () => {
        try {
            const parsed = JSON.parse(schemaDraft);
            const newKey = `new_field_${Date.now()}`;
            parsed.properties = parsed.properties || {};
            parsed.properties[newKey] = {
                type: 'string',
                title: 'New Field'
            };
            setSchemaDraft(JSON.stringify(parsed, null, 2));
        } catch {
            console.error('handleAddField failed');
        }
    };

    const handleRemoveField = (keyToRemove: string) => {
        try {
            const parsed = JSON.parse(schemaDraft);
            if (parsed.properties && parsed.properties[keyToRemove]) {
                delete parsed.properties[keyToRemove];
                
                // Also remove from required array if present
                if (parsed.required && Array.isArray(parsed.required)) {
                    parsed.required = parsed.required.filter((k: string) => k !== keyToRemove);
                }

                setSchemaDraft(JSON.stringify(parsed, null, 2));
            }
        } catch {
            console.error('handleRemoveField failed');
        }
    };

    const handleRenameField = (oldKey: string, newKey: string) => {
        if (!newKey || oldKey === newKey) return;
        try {
            const parsed = JSON.parse(schemaDraft);
            if (parsed.properties && parsed.properties[oldKey]) {
                // Prevent duplicate keys
                if (parsed.properties[newKey]) return;

                const newProperties: Record<string, unknown> = {};
                // Preserve order
                Object.keys(parsed.properties).forEach((k) => {
                    if (k === oldKey) {
                        newProperties[newKey] = parsed.properties[oldKey];
                    } else {
                        newProperties[k] = parsed.properties[k];
                    }
                });
                parsed.properties = newProperties;

                // Update required array
                if (parsed.required && Array.isArray(parsed.required)) {
                    parsed.required = parsed.required.map((k: string) => (k === oldKey ? newKey : k));
                }

                setSchemaDraft(JSON.stringify(parsed, null, 2));
            }
        } catch {
            console.error('handleRenameField failed');
        }
    };

    const handleUpdateFieldProperty = (key: string, property: string, value: unknown) => {
        try {
            const parsedRaw = JSON.parse(schemaDraft) as unknown;
            if (typeof parsedRaw === 'object' && parsedRaw !== null) {
                const parsed = parsedRaw as { properties?: Record<string, Record<string, unknown>> };
                const props = parsed.properties || {};
                // ensure the key exists then assign
                props[key] = props[key] || {};
                props[key][property] = value;
                parsed.properties = props;
                setSchemaDraft(JSON.stringify(parsed, null, 2));
            }
        } catch {
            console.error('handleUpdateFieldProperty failed');
        }
    };

    const handleToggleRequired = (key: string) => {
        try {
            const parsed = JSON.parse(schemaDraft);
            if (!parsed.required) parsed.required = [];
            
            if (parsed.required.includes(key)) {
                parsed.required = parsed.required.filter((k: string) => k !== key);
            } else {
                parsed.required.push(key);
            }
            setSchemaDraft(JSON.stringify(parsed, null, 2));
        } catch {
            console.error('handleToggleRequired failed');
        }
    };

    const filteredArticles = knowledgeArticles.filter(article => {
        if (knowledgeFilter === 'all') return true;
        if (knowledgeFilter === 'pending') return article.status === 'PENDING REVIEW';
        if (knowledgeFilter === 'published') return article.status === 'PUBLISHED';
        if (knowledgeFilter === 'rejected') return false; // No rejected articles in mock
        return true;
    });

    const pendingCount = knowledgeArticles.filter(a => a.status === 'PENDING REVIEW').length;
    const publishedCount = knowledgeArticles.filter(a => a.status === 'PUBLISHED').length;
    const rejectedCount = 1; // Mock count

    return (
        <div className="min-h-screen bg-gray-50">
            <TopHeader
                title="Service Config"
                icon={<Settings className="w-6 h-6" />}
            />

            <div className="p-6">
                {/* Page Header */}
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Service Configuration</h1>
                        <p className="text-gray-600">Define categories, pricing logic (k-System), and knowledge base.</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === 'categories'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <Settings className="w-5 h-5" />
                        Categories & Forms
                    </button>
                    <button
                        onClick={() => setActiveTab('pricing')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === 'pricing'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <Sliders className="w-5 h-5" />
                        Pricing Engine (k-System)
                    </button>
                    <button
                        onClick={() => setActiveTab('knowledge')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === 'knowledge'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <BookOpen className="w-5 h-5" />
                        Knowledge Base
                    </button>
                </div>

                {/* Categories & Forms Tab */}
                {activeTab === 'categories' && (
                    <div className="grid grid-cols-12 gap-6 h-[calc(100vh-220px)]">
                        {/* LEFT: HIERARCHY TREE */}
                        <div className="col-span-12 lg:col-span-4 bg-white rounded-lg border border-gray-200 flex flex-col h-full overflow-hidden">
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xs font-bold text-gray-500 tracking-wider uppercase">Hierarchy</h3>
                                    {isLoadingCategories && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
                                </div>
                                <div className="flex items-center gap-2">
                                    {categoryError && <span className="text-xs text-red-500 mr-2">{categoryError}</span>}
                                    <button 
                                        onClick={() => setShowCreateModal(true)}
                                        className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-blue-600 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                {categories.map(category => (
                                    <div key={category.id} className="select-none">
                                        <div 
                                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                                selectedType === 'category' && selectedCategoryId === category.id 
                                                ? 'bg-blue-50 text-blue-700' 
                                                : 'hover:bg-gray-50 text-gray-700'
                                            }`}
                                            onClick={() => handleSelectCategory(category.id)}
                                        >
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleExpandCategory(category.id);
                                                }}
                                                className="p-0.5 hover:bg-gray-200 rounded text-gray-400"
                                            >
                                                {expandedCategories.has(category.id) ? (
                                                    <ChevronDown className="w-4 h-4" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4" />
                                                )}
                                            </button>
                                            <Package className={`w-4 h-4 ${selectedType === 'category' && selectedCategoryId === category.id ? 'text-blue-600' : 'text-gray-400'}`} />
                                            <span className="text-sm font-medium truncate flex-1">{category.name}</span>
                                            {(() => {
                                                const st = Number(category.status ?? 0) as CategoryStatus;
                                                const cls = CATEGORY_STATUS_DOT_CLASS[st] ?? 'bg-black';
                                                const label = CATEGORY_STATUS_LABELS[st] ?? 'Unspecified';
                                                return (
                                                    <span
                                                        title={`Status: ${label}`}
                                                        aria-label={`Category status: ${label}`}
                                                        className={`w-2 h-2 rounded-full ${cls} shrink-0`}
                                                    />
                                                );
                                            })()}
                                        </div>
                                        
                                        {/* Nested Services */}
                                        {expandedCategories.has(category.id) && (
                                            <div className="pl-9 pr-2 py-1 space-y-0.5">
                                                {servicesMap[category.id]?.map(service => (
                                                    <div 
                                                        key={service.id}
                                                        onClick={() => handleSelectService(service)}
                                                        className={`flex items-center gap-2 p-2 rounded-md cursor-pointer text-sm transition-colors border-l-2 ${
                                                            selectedType === 'service' && selectedServiceId === service.id
                                                            ? 'border-blue-500 bg-blue-50/50 text-blue-700'
                                                            : 'border-transparent hover:bg-gray-50 text-gray-600'
                                                        }`}
                                                    >
                                                        <Box className="w-3.5 h-3.5 opacity-70" />
                                                        <span className="truncate flex-1">{service.name}</span>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // open create service modal scoped to this category
                                                        if (!expandedCategories.has(category.id)) toggleExpandCategory(category.id);
                                                        setSelectedCategoryId(category.id);
                                                        setShowCreateServiceModal(true);
                                                        setSvcCreateName('');
                                                        setSvcCreateSku('');
                                                        setSvcCreatePrice(0);
                                                        setSvcCreatePriceInput(formatVND(0));
                                                        setSvcCreatePricingModel('fixed');
                                                        setSvcCreateSlaConfig('');
                                                        setSvcCreateDefaultPriority('');
                                                        setCreateParentId(category.id);
                                                    }}
                                                    className="flex items-center gap-2 p-2 text-xs text-gray-400 hover:text-blue-600 w-full transition-colors"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    New Service...
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {/* Pagination Footer */}
                            <div className="p-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between sticky bottom-0">
                                <button
                                    onClick={handlePrevPage}
                                    disabled={pageIndex <= 1}
                                    className="p-1 px-2 rounded hover:bg-white border border-transparent hover:border-gray-200 text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent transition-colors"
                                >
                                    <span className="text-xs font-bold">Prev</span>
                                </button>
                                <span className="text-[10px] text-gray-400 font-mono font-medium">Page {pageIndex}</span>
                                <button
                                    onClick={handleNextPage}
                                    disabled={!(nextPageToken || categories.length >= pageSize)}
                                    className="p-1 px-2 rounded hover:bg-white border border-transparent hover:border-gray-200 text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent transition-colors"
                                >
                                    <span className="text-xs font-bold">Next</span>
                                </button>
                            </div>
                        </div>

                        {/* RIGHT: EDITOR PANEL */}
                        <div className="col-span-12 lg:col-span-8 flex flex-col h-full overflow-hidden gap-4">
                        {selectedType === 'category' && selectedCategory ? (
                        <>
                            {/* Category Info Card */}
                            <div className="bg-white rounded-lg border border-gray-200 p-6 flex items-center justify-between shrink-0 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                        <Layers className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-xl font-bold text-gray-900">{selectedCategory.name}</h2>
                                            {(() => {
                                                const st = Number(selectedCategory.status ?? 0) as CategoryStatus;
                                                const cls = CATEGORY_STATUS_BADGE_CLASS[st] ?? 'bg-gray-100 text-gray-700';
                                                const label = CATEGORY_STATUS_LABELS[st] ?? 'Unspecified';
                                                return (
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${cls}`}>
                                                        {label}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">{selectedCategory.description || 'No description provided'}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        // open create service modal and set selected category
                                        setShowCreateServiceModal(true);
                                        setSvcCreateName('');
                                        setSvcCreateSku('');
                                            setSvcCreatePrice(0);
                                            setSvcCreatePriceInput(formatVND(0));
                                        setSvcCreatePricingModel('fixed');
                                        setSvcCreateSlaConfig('');
                                        setSvcCreateDefaultPriority('');
                                        if (selectedCategoryId) setCreateParentId(selectedCategoryId);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-100"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Service Product
                                </button>
                            </div>

                            {/* Form Designer Card */}
                            <div className="bg-white rounded-lg border border-gray-200 flex flex-col flex-1 overflow-hidden shadow-sm">
                                <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/30">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900">Form Designer</h2>
                                            <p className="text-xs font-medium text-gray-500 mt-0.5">Target: {selectedCategory?.name || '—'}</p>
                                        </div>

                                        <div className="h-8 w-px bg-gray-200 mx-2"></div>

                                        <div className="flex p-1 bg-gray-100 rounded-lg">
                                            <button
                                                onClick={() => setViewMode('visual')}
                                                className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 rounded-md transition-all ${viewMode === 'visual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                Visual
                                            </button>
                                            <button
                                                onClick={() => setViewMode('code')}
                                                className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 rounded-md transition-all ${viewMode === 'code' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                <Code className="w-3.5 h-3.5" />
                                                Code
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {((Number(selectedCategory.status) || 0) === CategoryStatus.CATEGORY_STATUS_DRAFT) && (
                                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${CATEGORY_STATUS_BADGE_CLASS[CategoryStatus.CATEGORY_STATUS_DRAFT]}`}>Draft</span>
                                                <button
                                                    onClick={() => handleUpdateCategoryStatus(CategoryStatus.CATEGORY_STATUS_PENDING)}
                                                    disabled={isUpdatingStatus}
                                                    className="flex items-center gap-1.5 px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-semibold rounded shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed mx-1"
                                                >
                                                    {isUpdatingStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>Submit</span>}
                                                    <ArrowRight className="w-3 h-3" />
                                                </button>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase opacity-60 bg-yellow-50 text-yellow-800 border border-yellow-100`}>Pending</span>
                                            </div>
                                        )}
                                        {((Number(selectedCategory.status) || 0) === CategoryStatus.CATEGORY_STATUS_PENDING) && (
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center justify-end gap-2 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${CATEGORY_STATUS_BADGE_CLASS[CategoryStatus.CATEGORY_STATUS_PENDING]}`}>Pending</span>
                                                    <button
                                                        onClick={() => handleUpdateCategoryStatus(CategoryStatus.CATEGORY_STATUS_APPROVED)}
                                                        disabled={isUpdatingStatus}
                                                        className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed mx-1 w-[90px] justify-center"
                                                    >
                                                        {isUpdatingStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>Approve</span>}
                                                        <ArrowRight className="w-3 h-3" />
                                                    </button>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase opacity-60 bg-green-50 text-green-800 border border-green-100 min-w-[70px] text-center`}>Approved</span>
                                                </div>
                                                <div className="flex items-center justify-end gap-2 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${CATEGORY_STATUS_BADGE_CLASS[CategoryStatus.CATEGORY_STATUS_PENDING]}`}>Pending</span>
                                                    <button
                                                        onClick={() => handleUpdateCategoryStatus(CategoryStatus.CATEGORY_STATUS_REJECTED)}
                                                        disabled={isUpdatingStatus}
                                                        className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed mx-1 w-[90px] justify-center"
                                                    >
                                                        {isUpdatingStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>Reject</span>}
                                                        <ArrowRight className="w-3 h-3" />
                                                    </button>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase opacity-60 bg-red-50 text-red-800 border border-red-100 min-w-[70px] text-center`}>Rejected</span>
                                                </div>
                                            </div>
                                        )} 

                                        <div className="h-8 w-px bg-gray-200 mx-2"></div>
                                        
                                        <button onClick={() => setShowPreview(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors">
                                            <Eye className="w-4 h-4" />
                                            Preview
                                        </button>
                                        <button
                                            onClick={handleSaveSchema}
                                            disabled={isSavingSchema}
                                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-blue-100"
                                        >
                                            {isSavingSchema ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            {isSavingSchema ? 'Saving...' : 'Save'}
                                        </button>
                                    </div>
                                </div>


                            {/* Code / Visual Editor */}
                            <div className="flex-1 overflow-y-auto">
                            {viewMode === 'code' ? (
                                <div className="bg-[#1a1d29] p-6 text-sm font-mono h-full min-h-[500px]">
                                    <textarea
                                        value={schemaDraft}
                                        onChange={(e) => setSchemaDraft(e.target.value)}
                                        className="w-full h-full resize-none bg-transparent text-gray-200 outline-none"
                                        spellCheck={false}
                                    />
                                </div>
                            ) : (
                                <div className="p-8 bg-gray-50/50 min-h-full">
                                    <div className="flex items-center justify-between mb-6">
                                        <p className="text-gray-500">Arrange fields as they appear in the Mobile App.</p>
                                        <button 
                                            onClick={handleAddField}
                                            className="px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-sm"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Field
                                        </button>
                                    </div>

                                    {!parsedSchema.isValid && (
                                        <div className="text-sm text-red-600 mb-4 bg-red-50 p-3 rounded-lg border border-red-100">
                                            Invalid JSON schema. Switch to Code View to fix.
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        {parsedSchema.fields.map((field, index) => (
                                            <div key={index} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group">
                                                <div className="flex gap-5">
                                                    {/* Drag Handle */}
                                                    <div className="pt-8 cursor-grab active:cursor-grabbing text-gray-300 group-hover:text-gray-400 transition-colors">
                                                        <div className="grid grid-cols-2 gap-1">
                                                            <div className="w-1 h-1 rounded-full bg-current"></div><div className="w-1 h-1 rounded-full bg-current"></div>
                                                            <div className="w-1 h-1 rounded-full bg-current"></div><div className="w-1 h-1 rounded-full bg-current"></div>
                                                            <div className="w-1 h-1 rounded-full bg-current"></div><div className="w-1 h-1 rounded-full bg-current"></div>
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 grid grid-cols-2 gap-8">
                                                        {/* Left Column */}
                                                        <div className="space-y-5">
                                                            <div>
                                                                <label className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-2 block">FIELD KEY (ID)</label>
                                                                <div className="relative group/input">
                                                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium select-none bg-gray-50 px-1 py-0.5 rounded text-xs">#</div>
                                                                    <input
                                                                        defaultValue={field.key}
                                                                        onBlur={(e) => handleRenameField(field.key, e.target.value)}
                                                                        className="w-full bg-gray-50 border border-gray-200 text-gray-700 font-mono text-sm rounded-lg py-2.5 pl-9 pr-3 focus:outline-none focus:border-blue-500 transition-colors"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-2 block">DISPLAY LABEL</label>
                                                                <input
                                                                    value={field.title || ''}
                                                                    onChange={(e) => handleUpdateFieldProperty(field.key, 'title', e.target.value)}
                                                                    className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-lg py-2.5 px-3 focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-300"
                                                                    placeholder="Enter label..."
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Right Column */}
                                                        <div className="space-y-5">
                                                            <div>
                                                                <label className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-2 block">DATA TYPE</label>
                                                                <div className="relative">
                                                                    <select
                                                                        value={field.type}
                                                                        onChange={(e) => handleUpdateFieldProperty(field.key, 'type', e.target.value)}
                                                                        className="w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-lg py-2.5 pl-3 pr-10 appearance-none focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                                                                    >
                                                                        <option value="string">Text (String)</option>
                                                                        <option value="number">Number</option>
                                                                        <option value="boolean">Yes/No (Boolean)</option>
                                                                    </select>
                                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                                        {field.type === 'number' && <Hash className="w-4 h-4 text-gray-400" />}
                                                                        {field.type === 'string' && <Type className="w-4 h-4 text-gray-400" />}
                                                                        {field.type === 'boolean' && (
                                                                            <div className="w-8 h-4 bg-gray-200 rounded-full relative transform scale-75">
                                                                                <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm"></div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="flex items-center gap-4 h-[42px]">
                                                                <label 
                                                                    className="flex items-center gap-2.5 cursor-pointer select-none group/check"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        handleToggleRequired(field.key);
                                                                    }}
                                                                >
                                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${field.required ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 group-hover:check:border-blue-400'}`}>
                                                                        {field.required && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                                                    </div>
                                                                    <span className="text-sm font-medium text-gray-700">Required</span>
                                                                </label>
                                                                
                                                                {field.enum && (
                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100 uppercase tracking-wide cursor-pointer hover:bg-blue-100">
                                                                        <List className="w-3.5 h-3.5" />
                                                                        List
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Delete Action - Aligned with Input Row */}
                                                    <div className="pt-7">
                                                        <button 
                                                            onClick={() => handleRemoveField(field.key)}
                                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" 
                                                            title="Remove Field"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            </div>
                            </div>
                        </>
                        ) : selectedType === 'service' && activeService ? (
                                <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                                    {/* Service Header */}
                                    <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-white shrink-0">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                <Box className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900">{activeService.name}</h2>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="px-2 py-0.5 rounded text-xs font-mono bg-gray-100 text-gray-600">{activeService.sku}</span>
                                                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                                                        <CheckCircle className="w-3 h-3" /> Live Product
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                             <p className="text-xs text-gray-500 mb-1">Selling Price ({activeService.pricingModel})</p>
                                             <p className="text-2xl font-bold text-gray-900">{(activeService.price ?? 0).toLocaleString()} {activeService.currency ?? ''}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Service Body - Scrollable */}
                                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                                        <div className="grid grid-cols-12 gap-6">
                                            {/* Commercial Details */}
                                            <div className="col-span-12 xl:col-span-5 space-y-6">
                                                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                                    <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Commercial Details</h3>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Product Name</label>
                                                            <input 
                                                                value={activeService.name ?? ''} 
                                                                onChange={e => updateActiveAndMap({ name: e.target.value })}
                                                                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none" 
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-xs font-semibold text-gray-500 mb-1">SKU / Code</label>
                                                                <input 
                                                                    value={activeService.sku ?? ''} 
                                                                    onChange={e => updateActiveAndMap({ sku: e.target.value })}
                                                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-100 outline-none" 
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                                                                <select 
                                                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                                                                    value={activeService.status ?? 'inactive'}
                                                                    onChange={e => updateActiveAndMap({ status: e.target.value as ServiceItemDto['status'] })}
                                                                >
                                                                    <option value="active">Active (Sales Enabled)</option>
                                                                    <option value="inactive">Inactive</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Base Price</label>
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-2.5 text-gray-400 text-sm">₫</span>
                                                                <input 
                                                                    type="text"
                                                                    value={activePriceInput}
                                                                    onChange={e => {
                                                                        const raw = e.target.value;
                                                                        const digitsOnly = raw.replace(/[^0-9]/g, '');
                                                                        if (digitsOnly === '') {
                                                                            setActivePriceInput('');
                                                                            updateActiveAndMap({ price: undefined });
                                                                        } else {
                                                                            const num = parseVND(raw);
                                                                            setActivePriceInput(formatVND(num));
                                                                            updateActiveAndMap({ price: num });
                                                                        }
                                                                    }}
                                                                    className="w-full border border-gray-200 rounded-lg p-2.5 pl-7 text-sm font-semibold focus:ring-2 focus:ring-blue-100 outline-none" 
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-500 mb-1">SLA Config (JSON)</label>
                                                            <div className="space-y-2">
                                                                {activeSlaRows.map((row, idx) => (
                                                                    <div key={`${row.key}-${idx}`} className="grid grid-cols-12 gap-2 items-center">
                                                                        <div className="col-span-6">
                                                                            <select
                                                                                value={row.key}
                                                                                onChange={e => {
                                                                                    const next = [...activeSlaRows];
                                                                                    next[idx] = { ...row, key: e.target.value };
                                                                                    updateActiveSlaRows(next);
                                                                                }}
                                                                                className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100 outline-none"
                                                                            >
                                                                                {SLA_PRIORITY_OPTIONS.map(opt => (
                                                                                    <option key={opt} value={opt}>{opt}</option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
                                                                        <div className="col-span-4">
                                                                            <input
                                                                                type="number"
                                                                                min={1}
                                                                                value={row.hours}
                                                                                onChange={e => {
                                                                                    const next = [...activeSlaRows];
                                                                                    next[idx] = { ...row, hours: e.target.value };
                                                                                    updateActiveSlaRows(next);
                                                                                }}
                                                                                placeholder="Hours"
                                                                                className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100 outline-none"
                                                                            />
                                                                        </div>
                                                                        <div className="col-span-2 flex justify-end">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const next = activeSlaRows.filter((_, i) => i !== idx);
                                                                                    updateActiveSlaRows(next);
                                                                                }}
                                                                                className="text-xs text-red-500 hover:text-red-600"
                                                                            >
                                                                                Remove
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const used = new Set(activeSlaRows.map(r => r.key));
                                                                        const nextKey = SLA_PRIORITY_OPTIONS.find(k => !used.has(k)) ?? SLA_PRIORITY_OPTIONS[0];
                                                                        updateActiveSlaRows([...activeSlaRows, { key: nextKey, hours: '' }]);
                                                                    }}
                                                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                                                                >
                                                                    + Add SLA Priority
                                                                </button>
                                                            </div>
                                                            <p className="mt-1 text-[11px] text-gray-400">Select priority types and set hours. Values must be positive.</p>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Default Priority</label>
                                                            <select
                                                                value={activeService.defaultPriority ?? ''}
                                                                onChange={e => updateActiveAndMap({ defaultPriority: e.target.value || undefined })}
                                                                disabled={activeSlaKeys.length === 0}
                                                                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-100 outline-none disabled:bg-gray-50"
                                                            >
                                                                <option value="">Select default</option>
                                                                {activeSlaKeys.map(key => (
                                                                    <option key={key} value={key}>{key}</option>
                                                                ))}
                                                            </select>
                                                            <p className="mt-1 text-[11px] text-gray-400">Must exist in SLA config keys.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Product Configuration */}
                                            <div className="col-span-12 xl:col-span-7 space-y-6">
                                                <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-sm ring-4 ring-blue-50/50">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div>
                                                            <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                                                                <Settings className="w-4 h-4" />
                                                                Product Configuration
                                                            </h3>
                                                            <p className="text-xs text-blue-600 mt-1">
                                                                Define fixed attribute values based on <b>{categories.find(c => c.id === activeService.categoryId)?.name}</b> schema.
                                                            </p>
                                                        </div>
                                                        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-200 uppercase">Pre-sets</span>
                                                    </div>
                                                    
                                                    <div className="space-y-4 bg-gray-50 rounded-lg p-4 border border-gray-200/50">
                                                        {categories.find(c => c.id === activeService.categoryId)?.attributesSchema ? 
                                                            (() => {
                                                                const schema = parseSchema(categories.find(c => c.id === activeService.categoryId)?.attributesSchema || '{}');
                                                                return schema.fields.map(field => (
                                                                    <div key={field.key} className="grid grid-cols-12 gap-4 items-start">
                                                                        <div className="col-span-4 pt-2.5">
                                                                            <label className="block text-sm font-medium text-gray-700 leading-none mb-1">{field.title}</label>
                                                                            <p className="text-[11px] text-gray-400 font-mono leading-none">{field.key}</p>
                                                                        </div>
                                                                        <div className="col-span-8">
                                                                             {/* Input logic based on type */}
                                                                             {field.enum ? (
                                                                                 <div className="relative">
                                                                                     <select 
                                                                                         className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-100 outline-none appearance-none cursor-pointer"
                                                                                        value={String(activeService.config?.[field.key] ?? '')}
                                                                                        onChange={e => setActiveService({
                                                                                            ...activeService,
                                                                                            config: { ...(activeService.config || {}), [field.key]: e.target.value }
                                                                                        })}
                                                                                     >
                                                                                         <option value="">(User Input on Ticket)</option>
                                                                                         {field.enum.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                                                     </select>
                                                                                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                                                                        <ChevronDown className="w-4 h-4" />
                                                                                    </div>
                                                                                 </div>
                                                                             ) : (
                                                                                                                                                                 <input 
                                                                                    type={field.type === 'number' ? 'number' : 'text'}
                                                                                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-100 outline-none placeholder:text-gray-400"
                                                                                    placeholder="(User Input on Ticket)"
                                                                                                                                                                     value={String(activeService.config?.[field.key] ?? '')}
                                                                                    onChange={e => updateActiveAndMap({ config: { ...(activeService.config || {}), [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value } })}
                                                                                 />
                                                                             )}
                                                                        </div>
                                                                    </div>
                                                                ));
                                                            })()
                                                        : (
                                                            <div className="text-center py-4 text-gray-400 text-sm">No schema defined for parent category.</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="p-4 border-t border-gray-200 bg-white flex justify-end">
                                        <button 
                                            onClick={handleSaveServiceConfig}
                                            disabled={isSavingService}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {isSavingService ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            {isSavingService ? 'Saving...' : 'Save Product Configuration'}
                                        </button>
                                    </div>
                                </div>
                        ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-white rounded-lg border border-gray-200 shadow-sm">
                                    <Settings className="w-12 h-12 mb-4 opacity-20" />
                                    <p>Select a category or service to configure</p>
                                </div>
                        )}
                        </div>
                    </div>
                )}

                {/* Confirm delete modal (used for both pricing rules and distribution configs) */}
                <ConfirmModal
                    open={confirmModalOpen}
                    title={confirmTarget?.type === 'rule' ? 'Delete Pricing Rule' : 'Delete Configuration'}
                    description={
                        confirmTarget?.type === 'rule'
                            ? `Are you sure you want to delete "${confirmTarget?.name ?? ''}"?`
                            : 'Are you sure you want to delete this configuration?'
                    }
                    confirmLabel="OK"
                    cancelLabel="Hủy"
                    onConfirm={performConfirmDelete}
                    onClose={() => { setConfirmModalOpen(false); setConfirmTarget(null); }}
                    isLoading={isConfirmLoading}
                />

                {/* Mobile Preview Modal */}
                {showPreview && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
                    onClick={() => setShowPreview(false)}
                  >
                    <div className="relative w-[420px]" onClick={(e) => e.stopPropagation()}>
                      {/* Close Button */}
                      <button
                        onClick={() => setShowPreview(false)}
                        className="absolute -top-3 -right-3 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-gray-100 z-10"
                        aria-label="Close preview"
                      >
                        <span className="text-gray-400 text-3xl font-light hover:text-white transition-colors">✕</span>
                      </button>

                                            {/* Phone Frame */}
                                            <div className="bg-[#1e1e1e] rounded-[40px] shadow-2xl p-[10px] w-[360px] h-[720px] relative">
                                                {/* Screen */}
                                                <div className="bg-gray-50 rounded-[30px] w-full h-full overflow-hidden flex flex-col relative">
                                                    
                                                    {/* Status Bar (Mock) */}
                                                    <div className="h-12 bg-white flex items-center justify-between px-6 pt-2">
                                                        <div className="text-xs font-bold text-gray-900">9:41</div>
                                                        {/* Notch */}
                                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl"></div>
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-4 h-2.5 bg-gray-900 rounded-[1px]"></div>
                                                            <div className="w-0.5 h-1 bg-gray-900"></div>
                                                        </div>
                                                    </div>

                                                    {/* App Header */}
                                                    <div className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                                            <Code className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <h2 className="text-sm font-bold text-gray-900">Ticket #T-9921</h2>
                                                            <p className="text-[11px] font-medium text-gray-500">{selectedCategory?.name || 'Service'}</p>
                                                        </div>
                                                    </div>

                                                    {/* Content Scrollable */}
                                                    <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
                                                        <div className="space-y-5">
                                                            <MockFormRenderer schemaJson={schemaDraft} />
                                                        </div>
                                                    </div>

                                                    {/* Bottom Action Bar */}
                                                    <div className="p-5 bg-white border-t border-gray-100">
                                                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-blue-200 shadow-md transition-colors">
                                                            Submit Report
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                    </div>
                  </div>
                )}

                {/* Create Category Modal */}
                {showCreateModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <div className="relative w-[500px] bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                <h2 className="text-lg font-bold text-gray-900">New Service Category</h2>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6">
                                {createError && (
                                    <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                                        {createError}
                                    </div>
                                )}

                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category Name</label>
                                        <input
                                            value={createName}
                                            onChange={(e) => setCreateName(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                                            placeholder="e.g. Server Maintenance"
                                            autoFocus
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type</label>
                                        <div className="relative">
                                            <select
                                                value={createType}
                                                onChange={(e) => setCreateType(e.target.value)}
                                                className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all cursor-pointer"
                                            >
                                                <option value="hardware">Hardware (Physical)</option>
                                                <option value="software">Software</option>
                                                <option value="network">Network</option>
                                                <option value="subscription">Subscription</option>
                                                <option value="other">Other</option>
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Engagement Model</label>
                                        <div className="relative">
                                            <select
                                                value={createEngagement}
                                                onChange={(e) => setCreateEngagement(e.target.value)}
                                                className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all cursor-pointer"
                                            >
                                                <option value="long-term">Long-term (Subscription)</option>
                                                <option value="one-deal">One-deal (Project/Fix)</option>
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-between gap-3 pt-6 border-t border-gray-50">
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateCategory}
                                        disabled={isCreating}
                                        className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isCreating ? 'Creating...' : 'Create Category'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create Service Modal */}
                {showCreateServiceModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowCreateServiceModal(false)}
                    >
                        <div className="relative w-[520px] bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                <h2 className="text-lg font-bold text-gray-900">Add Service to: {categories.find(c => c.id === createParentId)?.name || 'Category'}</h2>
                                <button onClick={() => setShowCreateServiceModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="p-6">
                                {svcCreateError && <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">{svcCreateError}</div>}

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Service Product Name</label>
                                        <input value={svcCreateName} onChange={e => setSvcCreateName(e.target.value)} placeholder="e.g. Basic Repair Package" className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-100" autoFocus />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">SKU / Code</label>
                                            <input value={svcCreateSku} onChange={e => setSvcCreateSku(e.target.value)} placeholder="SVC-001" className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Base Price (VND)</label>
                                            <input
                                                type="text"
                                                value={svcCreatePriceInput}
                                                onChange={e => {
                                                    const raw = e.target.value;
                                                    const digitsOnly = raw.replace(/[^0-9]/g, '');
                                                    if (digitsOnly === '') {
                                                        setSvcCreatePrice(undefined);
                                                        setSvcCreatePriceInput('');
                                                    } else {
                                                        const num = parseVND(raw);
                                                        setSvcCreatePrice(num);
                                                        setSvcCreatePriceInput(formatVND(num));
                                                    }
                                                }}
                                                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pricing Model</label>
                                        <div className="relative">
                                            <select value={svcCreatePricingModel} onChange={e => setSvcCreatePricingModel(e.target.value as 'fixed' | 'recurring')} className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-100">
                                                <option value="fixed">One-time (Fixed)</option>
                                                <option value="recurring">Recurring</option>
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">SLA Config (JSON)</label>
                                        <div className="space-y-2">
                                            {svcCreateSlaRows.map((row, idx) => (
                                                <div key={`${row.key}-${idx}`} className="grid grid-cols-12 gap-2 items-center">
                                                    <div className="col-span-6">
                                                        <select
                                                            value={row.key}
                                                            onChange={e => {
                                                                const next = [...svcCreateSlaRows];
                                                                next[idx] = { ...row, key: e.target.value };
                                                                updateCreateSlaRows(next);
                                                            }}
                                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                        >
                                                            {SLA_PRIORITY_OPTIONS.map(opt => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-span-4">
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            value={row.hours}
                                                            onChange={e => {
                                                                const next = [...svcCreateSlaRows];
                                                                next[idx] = { ...row, hours: e.target.value };
                                                                updateCreateSlaRows(next);
                                                            }}
                                                            placeholder="Hours"
                                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                        />
                                                    </div>
                                                    <div className="col-span-2 flex justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const next = svcCreateSlaRows.filter((_, i) => i !== idx);
                                                                updateCreateSlaRows(next);
                                                            }}
                                                            className="text-xs text-red-500 hover:text-red-600"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const used = new Set(svcCreateSlaRows.map(r => r.key));
                                                    const nextKey = SLA_PRIORITY_OPTIONS.find(k => !used.has(k)) ?? SLA_PRIORITY_OPTIONS[0];
                                                    updateCreateSlaRows([...svcCreateSlaRows, { key: nextKey, hours: '' }]);
                                                }}
                                                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                                            >
                                                + Add SLA Priority
                                            </button>
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">Select priority types and set hours. Values are positive hours.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Default Priority (optional)</label>
                                        <select
                                            value={svcCreateDefaultPriority}
                                            onChange={e => setSvcCreateDefaultPriority(e.target.value)}
                                            disabled={createSlaKeys.length === 0}
                                            className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm disabled:bg-gray-50"
                                        >
                                            <option value="">Select default</option>
                                            {createSlaKeys.map(key => (
                                                <option key={key} value={key}>{key}</option>
                                            ))}
                                        </select>
                                        <p className="mt-1 text-xs text-gray-500">Must exist in SLA config keys.</p>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end gap-3 pt-6 border-t border-gray-50">
                                    <button onClick={() => setShowCreateServiceModal(false)} className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl">Cancel</button>
                                    <button onClick={handleSubmitCreateService} disabled={isCreatingService} className="px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl">{isCreatingService ? 'Creating...' : 'Create Service Product'}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Pricing Engine Tab */}
                {activeTab === 'pricing' && (
                    <div className="grid grid-cols-3 gap-6">
                        {/* Left 2/3: Pricing Rules */}
                        <div className="col-span-2 space-y-6">
                            {/* k-System Coefficients */}
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-semibold text-gray-900">k-System Coefficients</h2>
                                        {isLoadingPricingRules && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
                                    </div>
                                    <button
                                        onClick={handleCreatePricingRule}
                                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Rule
                                    </button>
                                </div>

                                {pricingRulesError && (
                                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        {pricingRulesError}
                                    </div>
                                )}

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Rule Name</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                                                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Value (k)</th>
                                                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Priority</th>
                                                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pricingRules.length === 0 && !isLoadingPricingRules && (
                                                <tr>
                                                    <td colSpan={6} className="py-8 text-center text-gray-400">
                                                        No pricing rules configured. Click &quot;Add Rule&quot; to create one.
                                                    </td>
                                                </tr>
                                            )}
                                            {pricingRules.map((rule) => (
                                                <tr key={rule.id} className={`border-b border-gray-100 hover:bg-gray-50 ${!rule.isActive ? 'opacity-50' : ''}`}>
                                                    <td className="py-3 px-4 text-sm text-gray-900 font-medium">{rule.name}</td>
                                                    <td className="py-3 px-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${RULE_CATEGORY_COLORS[rule.ruleCategory]}`}>
                                                            {RULE_CATEGORY_LABELS[rule.ruleCategory]}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-600">
                                                        {CONDITION_TYPE_LABELS[rule.conditionType]}
                                                    </td>
                                                    <td className="py-3 px-4 text-center text-sm font-bold text-gray-900">
                                                        {rule.ruleCategory === RuleCategory.RULE_CATEGORY_ADDITIVE
                                                            ? `+${Number(rule.multiplier).toLocaleString()}`
                                                            : `×${rule.multiplier}`}
                                                    </td>
                                                    <td className="py-3 px-4 text-center text-sm text-gray-600">{rule.priority}</td>
                                                    <td className="py-3 px-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={rule.isActive}
                                                                    onChange={() => handleTogglePricingRuleActive(rule)}
                                                                    className="sr-only peer"
                                                                />
                                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                                            </label>
                                                            <button
                                                                onClick={() => handleEditPricingRule(rule)}
                                                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                                title="Edit rule"
                                                            >
                                                                <FileEdit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeletePricingRule(rule)}
                                                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                                                title="Delete rule"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Surcharge Distribution */}
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-2">
                                        <Sliders className="w-5 h-5 text-gray-600" />
                                        <h2 className="text-lg font-semibold text-gray-900">Surcharge Distribution</h2>
                                        {isLoadingDistributionConfigs && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
                                    </div>
                                    <button
                                        onClick={() => {
                                            setEditingDistributionConfig(null);
                                            setDistributionConfigForm({ techRate: '0.90', companyRate: '0.10', description: '', isActive: true });
                                            setShowDistributionModal(true);
                                        }}
                                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Create Config
                                    </button>
                                </div>

                                {distributionConfigsError && (
                                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        {distributionConfigsError}
                                    </div>
                                )}

                                <div className="space-y-4">
                                {distributionConfigs.map(config => (
                                    <div key={config.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-sm transition-shadow">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-semibold text-gray-900 text-sm">
                                                        {config.description || 'Standard Distribution'}
                                                    </h3>
                                                    {config.isActive && (
                                                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold uppercase">
                                                            Active
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-gray-500 mt-1">
                                                    ID: {config.id} • Last updated: {new Date(config.updatedAt || config.createdAt || '').toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingDistributionConfig(config);
                                                        setDistributionConfigForm({
                                                            techRate: config.techRate,
                                                            companyRate: config.companyRate,
                                                            description: config.description,
                                                            isActive: config.isActive,
                                                        });
                                                        setShowDistributionModal(true);
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                                                >
                                                    <FileEdit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteDistributionConfig(config.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Progress Bar Visualization */}
                                        <div className="border-t border-gray-100 pt-3 mt-3">
                                            <div className="flex justify-between text-xs font-semibold mb-2">
                                                <span className="text-blue-600">Tech Bonus: {(Number(config.techRate) * 100).toFixed(0)}%</span>
                                                <span className="text-gray-600">Company Retain: {(Number(config.companyRate) * 100).toFixed(0)}%</span>
                                            </div>
                                            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden flex">
                                                <div 
                                                    className="h-full bg-blue-600 transition-all duration-300" 
                                                    style={{ width: `${Number(config.techRate) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {distributionConfigs.length === 0 && (
                                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                        <PieChart className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                        <p className="text-xs text-gray-500">No active distribution configurations.</p>
                                    </div>
                                )}
                                </div>

                                <p className="text-sm text-gray-600 mt-3">
                                    *Surcharges (k &gt; 1) are primarily allocated to field technicians to incentivize after-hours/emergency work.
                                </p>
                            </div>
                        </div>

                        {/* Right 1/3: Pricing Simulator */}
                        <div className="col-span-1">
                            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-6">Pricing Simulator</h2>

                                {/* Base Price */}
                                <div className="bg-[#1e2a4a] rounded-lg p-4 mb-6">
                                    <p className="text-xs text-gray-400 uppercase mb-2">BASE SERVICE PRICE (VND)</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-400 text-2xl">₫</span>
                                        <input
                                            type="text"
                                            value={formatVND(simulatorBasePrice)}
                                            onChange={(e) => {
                                                const val = parseVND(e.target.value);
                                                setSimulatorBasePrice(val);
                                            }}
                                            className="bg-transparent text-3xl font-bold text-white outline-none flex-1 w-full"
                                        />
                                    </div>
                                </div>

                                {/* Conditions */}
                                <div className="space-y-3 mb-6">
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-3">SELECT CONDITIONS</p>

                                    {pricingRules.filter(r => r.isActive).length === 0 && (
                                        <p className="text-sm text-gray-400 text-center py-4">No active rules to simulate</p>
                                    )}

                                    {pricingRules.filter(r => r.isActive).map((rule) => {
                                        const isSelected = simulatorSelectedRules.has(rule.id);
                                        return (
                                            <div
                                                key={rule.id}
                                                onClick={() => toggleSimulatorRule(rule.id)}
                                                className={`rounded-lg p-3 flex items-center justify-between cursor-pointer transition-colors ${
                                                    isSelected ? 'bg-blue-600' : 'bg-[#1e2a4a] hover:bg-[#2a3a5a]'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {rule.conditionType === ConditionType.CONDITION_TYPE_TIME && <Clock className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-gray-400'}`} />}
                                                    {rule.conditionType === ConditionType.CONDITION_TYPE_HOLIDAY && <CalendarDays className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-gray-400'}`} />}
                                                    {rule.conditionType === ConditionType.CONDITION_TYPE_URGENCY && <AlertTriangle className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-gray-400'}`} />}
                                                    {rule.conditionType === ConditionType.CONDITION_TYPE_UNSPECIFIED && <DollarSign className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-gray-400'}`} />}
                                                    <span className={`text-sm ${isSelected ? 'text-white' : 'text-white'}`}>{rule.name}</span>
                                                </div>
                                                <span className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                                    {rule.ruleCategory === RuleCategory.RULE_CATEGORY_ADDITIVE
                                                        ? `+${Number(rule.multiplier).toLocaleString()}`
                                                        : `k=${rule.multiplier}`}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Calculation */}
                                <div className="border-t border-gray-200 pt-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Total Multiplier (k)</span>
                                        <span className="text-xl font-bold text-blue-600">{simulatorCalculation.totalMultiplier.toFixed(2)}x</span>
                                    </div>
                                    {simulatorCalculation.totalAdditive > 0 && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Fixed Addition</span>
                                            <span className="text-lg font-semibold text-purple-500">+{simulatorCalculation.totalAdditive.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Surcharge Amount</span>
                                        <span className="text-lg font-semibold text-orange-500">+{simulatorCalculation.surchargeAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="bg-green-100 rounded-lg p-4 mt-4">
                                        <p className="text-xs text-green-700 uppercase font-semibold mb-1">FINAL PRICE</p>
                                        <p className="text-3xl font-bold text-green-700">{simulatorCalculation.finalPrice.toLocaleString()} đ</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Pricing Rule Modal */}
                {showPricingRuleModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowPricingRuleModal(false)}
                    >
                        <div className="relative w-[520px] bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                <h2 className="text-lg font-bold text-gray-900">
                                    {editingPricingRule ? 'Edit Pricing Rule' : 'New Pricing Rule'}
                                </h2>
                                <button onClick={() => setShowPricingRuleModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6">
                                {pricingRuleFormError && (
                                    <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                                        {pricingRuleFormError}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Rule Name</label>
                                        <input
                                            value={pricingRuleForm.name}
                                            onChange={e => setPricingRuleForm(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="e.g. After-hours (18:00 - 08:00)"
                                            className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                                            <select
                                                value={pricingRuleForm.ruleCategory}
                                                onChange={e => {
                                                    const nextCategory = Number(e.target.value) as RuleCategory;
                                                    setPricingRuleForm(prev => {
                                                        return {
                                                            ...prev,
                                                            ruleCategory: nextCategory,
                                                        };
                                                    });
                                                }}
                                                className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                                            >
                                                <option value={RuleCategory.RULE_CATEGORY_CORE}>Core</option>
                                                <option value={RuleCategory.RULE_CATEGORY_ADDITIVE}>Additive</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Condition Type</label>
                                            <select
                                                value={pricingRuleForm.conditionType}
                                                onChange={e => {
                                                    const nextType = Number(e.target.value) as ConditionType;
                                                    setPricingRuleForm(prev => ({ ...prev, conditionType: nextType }));
                                                    setPricingRuleMeta(prev => {
                                                        if (nextType === ConditionType.CONDITION_TYPE_TIME) {
                                                            return {
                                                                ...prev,
                                                                timeStart: prev.timeStart || DEFAULT_PRICING_RULE_META.timeStart,
                                                                timeEnd: prev.timeEnd || DEFAULT_PRICING_RULE_META.timeEnd,
                                                                timeDays: prev.timeDays.length ? prev.timeDays : DEFAULT_PRICING_RULE_META.timeDays,
                                                            };
                                                        }
                                                        if (nextType === ConditionType.CONDITION_TYPE_HOLIDAY) {
                                                            return {
                                                                ...prev,
                                                                holidayDates: prev.holidayDates.length ? prev.holidayDates : DEFAULT_PRICING_RULE_META.holidayDates,
                                                            };
                                                        }
                                                        if (nextType === ConditionType.CONDITION_TYPE_URGENCY) {
                                                            return {
                                                                ...prev,
                                                                urgencyPriority: prev.urgencyPriority || DEFAULT_PRICING_RULE_META.urgencyPriority,
                                                                urgencyMaxSlaHours: prev.urgencyMaxSlaHours || DEFAULT_PRICING_RULE_META.urgencyMaxSlaHours,
                                                            };
                                                        }
                                                        return prev;
                                                    });
                                                }}
                                                className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                                            >
                                                <option value={ConditionType.CONDITION_TYPE_TIME}>Time</option>
                                                <option value={ConditionType.CONDITION_TYPE_HOLIDAY}>Holiday</option>
                                                <option value={ConditionType.CONDITION_TYPE_URGENCY}>Urgency</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                                {pricingRuleForm.ruleCategory === RuleCategory.RULE_CATEGORY_ADDITIVE
                                                    ? 'Amount to Add'
                                                    : 'Multiplier Value (k)'}
                                            </label>
                                            <input
                                                type="text"
                                                value={pricingRuleForm.multiplier}
                                                onChange={e => setPricingRuleForm(prev => ({ ...prev, multiplier: e.target.value }))}
                                                placeholder={pricingRuleForm.ruleCategory === RuleCategory.RULE_CATEGORY_ADDITIVE ? "50000" : "1.5"}
                                                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Priority</label>
                                            <input
                                                type="number"
                                                value={pricingRuleForm.priority}
                                                onChange={e => setPricingRuleForm(prev => ({ ...prev, priority: Number(e.target.value) }))}
                                                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Metadata (auto JSON)</label>
                                        {pricingRuleForm.conditionType === ConditionType.CONDITION_TYPE_TIME && (
                                            <div className="grid grid-cols-3 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Start</label>
                                                    <input
                                                        type="time"
                                                        value={pricingRuleMeta.timeStart}
                                                        onChange={e => setPricingRuleMeta(prev => ({ ...prev, timeStart: e.target.value }))}
                                                        placeholder="18:00"
                                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">End</label>
                                                    <input
                                                        type="time"
                                                        value={pricingRuleMeta.timeEnd}
                                                        onChange={e => setPricingRuleMeta(prev => ({ ...prev, timeEnd: e.target.value }))}
                                                        placeholder="08:00"
                                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Days (1-7)</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                                                            <label key={day} className="flex items-center gap-1 text-xs text-gray-600">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={pricingRuleMeta.timeDays.includes(day)}
                                                                    onChange={() => {
                                                                        setPricingRuleMeta(prev => {
                                                                            const exists = prev.timeDays.includes(day);
                                                                            const next = exists
                                                                                ? prev.timeDays.filter(d => d !== day)
                                                                                : [...prev.timeDays, day].sort();
                                                                            return { ...prev, timeDays: next };
                                                                        });
                                                                    }}
                                                                />
                                                                {day}
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {pricingRuleForm.conditionType === ConditionType.CONDITION_TYPE_HOLIDAY && (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Dates</label>
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="date"
                                                            value={holidayDateInput}
                                                            onChange={e => setHolidayDateInput(e.target.value)}
                                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const val = holidayDateInput.trim();
                                                                if (!val) return;
                                                                setPricingRuleMeta(prev => {
                                                                    if (prev.holidayDates.includes(val)) return prev;
                                                                    return { ...prev, holidayDates: [...prev.holidayDates, val] };
                                                                });
                                                                setHolidayDateInput('');
                                                            }}
                                                            className="px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                                                        >
                                                            Add Specific Date
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            value={holidayRecurringMonth}
                                                            onChange={e => setHolidayRecurringMonth(e.target.value)}
                                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                        >
                                                            <option value="">Month</option>
                                                            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                                                <option key={m} value={String(m).padStart(2, '0')}>{m}</option>
                                                            ))}
                                                        </select>
                                                        <select
                                                            value={holidayRecurringDay}
                                                            onChange={e => setHolidayRecurringDay(e.target.value)}
                                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                        >
                                                            <option value="">Day</option>
                                                            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                                                                <option key={d} value={String(d).padStart(2, '0')}>{d}</option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (!holidayRecurringMonth || !holidayRecurringDay) return;
                                                                const val = `${holidayRecurringMonth}-${holidayRecurringDay}`;
                                                                setPricingRuleMeta(prev => {
                                                                    if (prev.holidayDates.includes(val)) return prev;
                                                                    return { ...prev, holidayDates: [...prev.holidayDates, val] };
                                                                });
                                                                setHolidayRecurringMonth('');
                                                                setHolidayRecurringDay('');
                                                            }}
                                                            className="px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                                                        >
                                                            Add Recurring (MM-DD)
                                                        </button>
                                                    </div>
                                                </div>
                                                {pricingRuleMeta.holidayDates.length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {pricingRuleMeta.holidayDates.map((date) => (
                                                            <span key={date} className="inline-flex items-center gap-2 px-2 py-1 text-xs bg-gray-100 border border-gray-200 rounded-full">
                                                                {date}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setPricingRuleMeta(prev => ({
                                                                        ...prev,
                                                                        holidayDates: prev.holidayDates.filter(d => d !== date),
                                                                    }))}
                                                                    className="text-gray-400 hover:text-red-500"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {pricingRuleForm.conditionType === ConditionType.CONDITION_TYPE_URGENCY && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
                                                    <select
                                                        value={pricingRuleMeta.urgencyPriority}
                                                        onChange={e => setPricingRuleMeta(prev => ({ ...prev, urgencyPriority: e.target.value }))}
                                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                    >
                                                        <option value="LOW">LOW</option>
                                                        <option value="MEDIUM">MEDIUM</option>
                                                        <option value="HIGH">HIGH</option>
                                                        <option value="CRITICAL">CRITICAL</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Max SLA Hours</label>
                                                    <input
                                                        value={pricingRuleMeta.urgencyMaxSlaHours}
                                                        onChange={e => setPricingRuleMeta(prev => ({ ...prev, urgencyMaxSlaHours: e.target.value }))}
                                                        placeholder="2"
                                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end gap-3 pt-6 border-t border-gray-50">
                                    <button
                                        onClick={() => setShowPricingRuleModal(false)}
                                        className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSavePricingRule}
                                        disabled={isSavingPricingRule}
                                        className="px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isSavingPricingRule && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {isSavingPricingRule ? 'Saving...' : editingPricingRule ? 'Update Rule' : 'Create Rule'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Knowledge Base Tab */}
                {activeTab === 'knowledge' && (
                    <div>
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">Knowledge Base & Wiki</h2>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-3xl font-bold text-orange-600">{pendingCount}</p>
                                            <p className="text-sm text-orange-700 mt-1">Pending Review</p>
                                        </div>
                                        <Clock className="w-8 h-8 text-orange-400" />
                                    </div>
                                </div>

                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-3xl font-bold text-green-600">{publishedCount}</p>
                                            <p className="text-sm text-green-700 mt-1">Published Articles</p>
                                        </div>
                                        <CheckCircle className="w-8 h-8 text-green-400" />
                                    </div>
                                </div>

                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
                                            <p className="text-sm text-red-700 mt-1">Rejected</p>
                                        </div>
                                        <XCircle className="w-8 h-8 text-red-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Filter Tabs */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setKnowledgeFilter('all')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${knowledgeFilter === 'all'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setKnowledgeFilter('pending')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${knowledgeFilter === 'pending'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        Pending Review
                                    </button>
                                    <button
                                        onClick={() => setKnowledgeFilter('published')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${knowledgeFilter === 'published'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        Published
                                    </button>
                                    <button
                                        onClick={() => setKnowledgeFilter('rejected')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${knowledgeFilter === 'rejected'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        Rejected
                                    </button>
                                </div>

                                <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                                    <Filter className="w-4 h-4" />
                                    Advanced Filter
                                </button>
                            </div>

                            {/* Articles List */}
                            <div className="space-y-4">
                                {filteredArticles.map((article) => (
                                    <div key={article.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-semibold text-gray-900">{article.title}</h3>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${article.statusColor}`}>
                                                        {article.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">
                                                    by {article.author} • {article.category}
                                                </p>
                                                <p className="text-sm text-gray-700 mb-3">{article.description}</p>
                                                <div className="flex items-center gap-2">
                                                    {article.tags.map((tag, idx) => (
                                                        <span key={idx} className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2 ml-4">
                                                {article.status === 'PENDING REVIEW' && (
                                                    <>
                                                        <button className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors">
                                                            <CheckCircle className="w-4 h-4" />
                                                            Approve
                                                        </button>
                                                        <button className="px-3 py-1.5 border border-red-300 text-red-600 text-sm rounded hover:bg-red-50 transition-colors">
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 transition-colors">
                                                    <Eye className="w-4 h-4" />
                                                    View
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Distribution Modal */}
                {showDistributionModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <h3 className="font-semibold text-gray-900">
                                    {editingDistributionConfig ? 'Edit Configuration' : 'Create Configuration'}
                                </h3>
                                <button onClick={() => setShowDistributionModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <input
                                        type="text"
                                        value={distributionConfigForm.description}
                                        onChange={e => setDistributionConfigForm({...distributionConfigForm, description: e.target.value})}
                                        placeholder="e.g. Standard 90/10 Split"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">Distribution Split</label>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-blue-600">
                                                    {(Number(distributionConfigForm.techRate) * 100).toFixed(0)}%
                                                </div>
                                                <div className="text-xs text-blue-700 font-medium">Tech Bonus</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-gray-600">
                                                    {(Number(distributionConfigForm.companyRate) * 100).toFixed(0)}%
                                                </div>
                                                <div className="text-xs text-gray-600 font-medium">Company Retain</div>
                                            </div>
                                        </div>
                                        
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            step="1"
                                            value={Number(distributionConfigForm.techRate) * 100}
                                            onChange={e => {
                                                const techVal = Number(e.target.value);
                                                const companyVal = 100 - techVal;
                                                setDistributionConfigForm({
                                                    ...distributionConfigForm,
                                                    techRate: (techVal / 100).toFixed(2),
                                                    companyRate: (companyVal / 100).toFixed(2)
                                                });
                                            }}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        />
                                        <div className="flex justify-between text-xs text-gray-400 mt-2">
                                            <span>0% Tech</span>
                                            <span>100% Tech</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="isActiveConfig"
                                        checked={distributionConfigForm.isActive}
                                        onChange={e => setDistributionConfigForm({...distributionConfigForm, isActive: e.target.checked})}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="isActiveConfig" className="text-sm text-gray-700 font-medium cursor-pointer">
                                        Set as active configuration
                                    </label>
                                </div>

                                <div className="pt-4 flex justify-end gap-3">
                                    <button
                                        onClick={() => setShowDistributionModal(false)}
                                        className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveDistributionConfig}
                                        disabled={isSavingDistribution}
                                        className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isSavingDistribution && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Save Configuration
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            {schemaError && (
                <div className="px-6 pb-6 text-sm text-red-600">{schemaError}</div>
            )}
            </div>
        </div>
    );
}

// Helper Component to render the actual inputs inside the modal
const MockFormRenderer: React.FC<{ schemaJson: string }> = ({ schemaJson }) => {
    // Parse schemaJson in a hook so hooks remain in the same order
    const parsedObj = React.useMemo(() => {
        try {
            const p = JSON.parse(schemaJson);
            return (p && typeof p === 'object') ? (p as Record<string, unknown>) : null;
        } catch {
            return null;
        }
    }, [schemaJson]);

    interface FieldDef { title?: string; type?: string; enum?: string[]; format?: string; description?: string }
    const schemaProps = React.useMemo(() => (parsedObj?.properties as Record<string, FieldDef> | undefined) || {}, [parsedObj]);
    const requiredFields = React.useMemo(() => (parsedObj?.required as string[] | undefined) || [], [parsedObj]);

    const initialValues = React.useMemo(() => {
        const vals: Record<string, unknown> = {};
        Object.entries(schemaProps).forEach(([k, f]) => {
            const t = (f.type as string | undefined) || 'string';
            if (t === 'boolean') vals[k] = false;
            else if (t === 'number') vals[k] = '';
            else vals[k] = '';
        });
        return vals;
    }, [schemaProps]);

    const [formValues, setFormValues] = React.useState<Record<string, unknown>>(initialValues);
    React.useEffect(() => setFormValues(initialValues), [initialValues]);

    const isInvalid = !parsedObj;

    const setValue = (key: string, value: unknown) => setFormValues((s) => ({ ...s, [key]: value }));

    return (
        <>
            {isInvalid ? (
                <div className="text-center text-xs text-red-500 py-10">Invalid Schema Data</div>
            ) : (
                Object.entries(schemaProps).map(([key, val]) => {
                const field = val as FieldDef;
                const value = formValues[key];

                return (
                    <div key={key} className="space-y-1.5">
                        <label className="block text-[11px] font-semibold text-gray-700 tracking-wide mb-1.5 ml-1">
                            {field.title || key} {requiredFields.includes(key) && <span className="text-red-500">*</span>}
                        </label>

                        {field.type === 'boolean' ? (
                            // Interactive toggle (UI-only)
                            <div
                                role="switch"
                                tabIndex={0}
                                aria-checked={!!value}
                                onKeyDown={(e) => {
                                    if (e.key === ' ' || e.key === 'Enter') {
                                        e.preventDefault();
                                        setValue(key, !value);
                                    }
                                }}
                                onClick={() => setValue(key, !value)}
                                className={
                                    `flex items-center gap-3 p-3 rounded-xl border transition-colors ` +
                                    (value
                                        ? 'bg-blue-600 border-blue-600 cursor-pointer'
                                        : 'bg-white border-gray-200 cursor-pointer')
                                }
                            >
                                <div className={
                                    `relative w-10 h-6 rounded-full transition-colors duration-150 ` +
                                    (value ? 'bg-blue-600' : 'bg-gray-200')
                                }>
                                    <div className={
                                        `absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-150 ` +
                                        (value ? 'translate-x-4' : 'translate-x-0')
                                    } />
                                </div>
                                <span className={value ? 'text-white text-sm font-medium' : 'text-sm text-gray-500'}>
                                    {value ? 'Passed' : 'Tap to toggle'}
                                </span>
                            </div>
                        ) : field.enum ? (
                            <div className="relative">
                                <select
                                    value={(typeof value === 'string' || typeof value === 'number') ? String(value) : (field.enum && field.enum.length ? field.enum[0] : '')}
                                    onChange={(e) => setValue(key, e.target.value)}
                                    className="w-full appearance-none bg-white border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all font-medium"
                                >
                                    {field.enum!.map((opt: string) => (
                                        <option key={opt} value={opt}>
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                    <svg className="w-3 h-3 text-slate-500 fill-current" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
                                </div>
                            </div>
                        ) : field.format === 'textarea' ? (
                            <textarea
                                value={(typeof value === 'string' || typeof value === 'number') ? String(value) : ''}
                                onChange={(e) => setValue(key, e.target.value)}
                                className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all placeholder:text-gray-400 font-medium"
                                rows={3}
                                placeholder={`Enter ${field.title?.toLowerCase()}...`}
                            />
                        ) : (
                            <input
                                value={(typeof value === 'string' || typeof value === 'number') ? String(value) : ''}
                                onChange={(e) => setValue(key, field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
                                type={field.type === 'number' ? 'number' : 'text'}
                                className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all placeholder:text-gray-400 font-medium"
                                placeholder={`Enter ${field.title?.toLowerCase()}...`}
                            />
                        )}

                        {field.description && <p className="text-xs text-slate-400 px-1">{field.description}</p>}
                    </div>
                );
            }))}
        </>
    );
};
