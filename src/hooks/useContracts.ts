'use client';

import { useState, useCallback } from 'react';
import internalApiClient from '@/lib/api/internal-client';
import type {
  Contract,
  ContractTemplate,
  CreateContractRequest,
  ListContractsRequest,
  ListContractsResponse,
  SignContractRequest,
  CreateRecurringScheduleRequest,
  CreateRecurringScheduleResponse,
  SendForSignatureResponse,
  SignContractResponse,
  ContractTimelineEvent,
} from '@/types/contract';

const toIsoString = (value: unknown): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return new Date(value).toISOString();
  if (typeof value === 'object') {
    const obj = value as { seconds?: string | number; nanos?: number };
    if (obj.seconds !== undefined) {
      const seconds = Number(obj.seconds);
      if (!Number.isNaN(seconds)) return new Date(seconds * 1000).toISOString();
    }
  }
  return '';
};

const toNumberValue = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const normalizeContract = (raw: Contract): Contract => {
  const rawRecord = raw as unknown as Record<string, unknown>;
  const lineItems = Array.isArray(raw.lineItems)
    ? raw.lineItems.map((item) => ({
        ...item,
        unitPrice: toNumberValue((item as unknown as { unitPrice?: unknown }).unitPrice),
        totalPrice: toNumberValue(
          (item as unknown as { totalPrice?: unknown; subtotal?: unknown }).totalPrice ??
            (item as unknown as { subtotal?: unknown }).subtotal
        ),
      }))
    : [];

  return {
    ...raw,
    status: toNumberValue(raw.status) as Contract['status'],
    totalValue: toNumberValue(raw.totalValue),
    customerName: String(rawRecord.customerName ?? rawRecord.customer_name ?? raw.customerName ?? raw.customerId ?? ''),
    customerEmail: String(rawRecord.customerEmail ?? rawRecord.customer_email ?? raw.customerEmail ?? ''),
    customerPhone: String(rawRecord.customerPhone ?? rawRecord.customer_phone ?? raw.customerPhone ?? ''),
    createdAt: toIsoString(raw.createdAt) || String(raw.createdAt ?? ''),
    updatedAt: toIsoString(raw.updatedAt) || String(raw.updatedAt ?? ''),
    signedAt: raw.signedAt ? toIsoString(raw.signedAt) || String(raw.signedAt) : undefined,
    lineItems,
  };
};

const normalizeTimelineEvents = (events: ContractTimelineEvent[]): ContractTimelineEvent[] =>
  (Array.isArray(events) ? events : []).map((evt) => ({
    ...evt,
    createdAt: toIsoString((evt as unknown as { createdAt?: unknown }).createdAt) || undefined,
  }));

interface UseContractsReturn {
  // State
  contracts: Contract[];
  templates: ContractTemplate[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  nextPageToken: string;
  
  // Contract CRUD
  listContracts: (params?: ListContractsRequest) => Promise<void>;
  getContract: (contractId: string) => Promise<Contract | null>;
  createContract: (data: CreateContractRequest) => Promise<Contract | null>;
  cancelContract: (contractId: string, reason: string) => Promise<Contract | null>;
  
  // Signature flow
  sendForSignature: (contractId: string) => Promise<SendForSignatureResponse | null>;
  signContract: (data: SignContractRequest) => Promise<SignContractResponse | null>;
  activateContract: (contractId: string) => Promise<Contract | null>;
  
  // Renewal & Schedules
  approveRenewal: (contractId: string, newEndDate: string) => Promise<Contract | null>;
  createRecurringSchedule: (data: CreateRecurringScheduleRequest) => Promise<CreateRecurringScheduleResponse | null>;
  
  // New UC-4 lifecycle methods
  uploadRevisedContract: (contractId: string, fileType: string, fileId: string) => Promise<Contract | null>;
  finalizeContract: (contractId: string) => Promise<Contract | null>;
  getContractTimeline: (contractId: string) => Promise<ContractTimelineEvent[]>;
  
  // Templates
  listTemplates: (category?: string, activeOnly?: boolean) => Promise<ContractTemplate[]>;
  
  // Utilities
  clearError: () => void;
  refresh: () => Promise<void>;
}

export function useContracts(): UseContractsReturn {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [nextPageToken, setNextPageToken] = useState('');
  const [lastParams, setLastParams] = useState<ListContractsRequest>({});

  const clearError = useCallback(() => setError(null), []);

  // List contracts with optional filters
  const listContracts = useCallback(async (params: ListContractsRequest = {}) => {
    setLoading(true);
    setError(null);
    setLastParams(params);
    
    try {
      const queryParams = new URLSearchParams();
      if (params.orgId) queryParams.set('orgId', params.orgId);
      if (params.customerId) queryParams.set('customerId', params.customerId);
      if (params.status !== undefined) queryParams.set('status', String(params.status));
      if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));
      if (params.pageToken) queryParams.set('pageToken', params.pageToken);
      
      const response = await internalApiClient.get(`/api/contracts?${queryParams.toString()}`);
      
      if (response.data.success) {
        const data: ListContractsResponse = response.data.data;
        setContracts((data.contracts || []).map(normalizeContract));
        setTotalCount(data.totalCount);
        setNextPageToken(data.nextPageToken);
      } else {
        setError(response.data.error || 'Failed to load contracts');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load contracts';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh with last params
  const refresh = useCallback(async () => {
    await listContracts(lastParams);
  }, [listContracts, lastParams]);

  // Get single contract
  const getContract = useCallback(async (contractId: string): Promise<Contract | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await internalApiClient.get(`/api/contracts/${contractId}`);
      
      if (response.data.success) {
        return normalizeContract(response.data.data.contract);
      } else {
        setError(response.data.error || 'Failed to get contract');
        return null;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get contract';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create contract
  const createContract = useCallback(async (data: CreateContractRequest): Promise<Contract | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await internalApiClient.post('/api/contracts/create', data);
      
      if (response.data.success) {
        await refresh(); // Refresh list after creation
        return normalizeContract(response.data.data.contract);
      } else {
        setError(response.data.error || 'Failed to create contract');
        return null;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create contract';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  // Cancel contract
  const cancelContract = useCallback(async (contractId: string, reason: string): Promise<Contract | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await internalApiClient.post(`/api/contracts/${contractId}/cancel`, { reason });
      
      if (response.data.success) {
        await refresh();
        return normalizeContract(response.data.data.contract);
      } else {
        setError(response.data.error || 'Failed to cancel contract');
        return null;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel contract';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  // Send for signature
  const sendForSignature = useCallback(async (contractId: string): Promise<SendForSignatureResponse | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await internalApiClient.post(`/api/contracts/${contractId}/send-for-signature`);
      
      if (response.data.success) {
        await refresh();
        return response.data.data;
      } else {
        setError(response.data.error || 'Failed to send for signature');
        return null;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send for signature';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  // Sign contract
  const signContract = useCallback(async (data: SignContractRequest): Promise<SignContractResponse | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await internalApiClient.post(`/api/contracts/${data.contractId}/sign`, {
        method: data.method,
        signatureData: data.signatureData,
        otpCode: data.otpCode,
      });
      
      if (response.data.success) {
        await refresh();
        return response.data.data;
      } else {
        setError(response.data.error || 'Failed to sign contract');
        return null;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign contract';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  // Activate contract
  const activateContract = useCallback(async (contractId: string): Promise<Contract | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await internalApiClient.post(`/api/contracts/${contractId}/activate`);
      
      if (response.data.success) {
        await refresh();
        return normalizeContract(response.data.data.contract);
      } else {
        setError(response.data.error || 'Failed to activate contract');
        return null;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to activate contract';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  // Approve renewal
  const approveRenewal = useCallback(async (contractId: string, newEndDate: string): Promise<Contract | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await internalApiClient.post(`/api/contracts/${contractId}/renew`, { newEndDate });
      
      if (response.data.success) {
        await refresh();
        return normalizeContract(response.data.data.contract);
      } else {
        setError(response.data.error || 'Failed to approve renewal');
        return null;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve renewal';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  // Create recurring schedule
  const createRecurringSchedule = useCallback(async (data: CreateRecurringScheduleRequest): Promise<CreateRecurringScheduleResponse | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await internalApiClient.post('/api/contracts/schedules', data);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        setError(response.data.error || 'Failed to create recurring schedule');
        return null;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create recurring schedule';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload revised contract
  const uploadRevisedContract = useCallback(async (contractId: string, fileType: string, fileId: string): Promise<Contract | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await internalApiClient.post(`/api/contracts/${contractId}/upload-revised`, { fileType, fileId });
      
      if (response.data.success) {
        await refresh();
        return normalizeContract(response.data.data.contract);
      } else {
        setError(response.data.error || 'Failed to upload revised contract');
        return null;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload revised contract';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  // Finalize contract (DRAFT → PENDING_SIGNATURE)
  const finalizeContract = useCallback(async (contractId: string): Promise<Contract | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await internalApiClient.post(`/api/contracts/${contractId}/finalize`);
      
      if (response.data.success) {
        await refresh();
        return normalizeContract(response.data.data.contract);
      } else {
        setError(response.data.error || 'Failed to finalize contract');
        return null;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to finalize contract';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  // Get contract timeline events
  const getContractTimeline = useCallback(async (contractId: string): Promise<ContractTimelineEvent[]> => {
    setError(null);
    
    try {
      const response = await internalApiClient.get(`/api/contracts/${contractId}/timeline`);
      
      if (response.data.success) {
        return normalizeTimelineEvents(response.data.data.events || []);
      } else {
        setError(response.data.error || 'Failed to get timeline');
        return [];
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get timeline';
      setError(message);
      return [];
    }
  }, []);

  // List templates
  const listTemplates = useCallback(async (category?: string, activeOnly: boolean = true): Promise<ContractTemplate[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      if (category) queryParams.set('category', category);
      queryParams.set('activeOnly', String(activeOnly));
      
      const response = await internalApiClient.get(`/api/contracts/templates?${queryParams.toString()}`);
      
      if (response.data.success) {
        setTemplates(response.data.data.templates);
        return response.data.data.templates;
      } else {
        setError(response.data.error || 'Failed to load templates');
        return [];
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load templates';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    contracts,
    templates,
    loading,
    error,
    totalCount,
    nextPageToken,
    listContracts,
    getContract,
    createContract,
    cancelContract,
    sendForSignature,
    signContract,
    activateContract,
    approveRenewal,
    createRecurringSchedule,
    uploadRevisedContract,
    finalizeContract,
    getContractTimeline,
    listTemplates,
    clearError,
    refresh,
  };
}
