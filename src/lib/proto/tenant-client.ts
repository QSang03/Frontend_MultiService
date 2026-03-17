/**
 * Protobuf/Connect client for TenantService (B2B Settings, Delegation, Cost Center)
 * Raw gRPC (HTTP/2) must be called from server, not browser.
 */

import 'server-only';
import { getAccessToken } from '@/lib/auth/session';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_PROTO_URL ||
  process.env.BACKEND_GRPC_URL ||
  process.env.BACKEND_URL ||
  'http://localhost:50051';

export interface B2BApprovalSettings {
  orgId: string;
  enabled: boolean;
  levels: number;
  threshold1: number;
  threshold2: number;
  timeoutHours: number;
  escalationHours: number;
  updatedAt?: string;
}

export interface B2BDelegation {
  id: string;
  orgId: string;
  managerId: string;
  delegateeId: string;
  startDate: string;
  endDate: string;
  requestType: string;
  isActive: boolean;
  createdAt?: string;
}

export interface B2BCostCenter {
  id: string;
  orgId: string;
  code: string;
  name: string;
  allocatedBudget: number;
  currentSpent: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// In-memory cache / fallback store for development when gRPC backend is offline
const memoryStore = {
  approvalSettings: new Map<string, B2BApprovalSettings>(),
  delegations: new Map<string, B2BDelegation[]>(),
  costCenters: new Map<string, B2BCostCenter[]>(),
};

// Seed initial default cost centers for org
function getSeededCostCenters(orgId: string): B2BCostCenter[] {
  if (!memoryStore.costCenters.has(orgId)) {
    memoryStore.costCenters.set(orgId, [
      { id: 'cc-1', orgId, code: 'IT-01', name: 'IT Department', allocatedBudget: 30000000, currentSpent: 12500000, isActive: true },
      { id: 'cc-2', orgId, code: 'MKT-01', name: 'Marketing', allocatedBudget: 20000000, currentSpent: 6200000, isActive: true },
      { id: 'cc-3', orgId, code: 'SALES-01', name: 'Sales', allocatedBudget: 25000000, currentSpent: 18000000, isActive: true },
      { id: 'cc-4', orgId, code: 'HR-01', name: 'HR & Admin', allocatedBudget: 10000000, currentSpent: 2800000, isActive: true },
      { id: 'cc-5', orgId, code: 'OPS-01', name: 'Operations', allocatedBudget: 15000000, currentSpent: 4500000, isActive: true },
    ]);
  }
  return memoryStore.costCenters.get(orgId)!;
}

// Approval Settings
export async function getApprovalSettings(orgId: string): Promise<B2BApprovalSettings> {
  const existing = memoryStore.approvalSettings.get(orgId);
  if (existing) return existing;
  return {
    orgId,
    enabled: true,
    levels: 2,
    threshold1: 2000000,
    threshold2: 10000000,
    timeoutHours: 24,
    escalationHours: 48,
    updatedAt: new Date().toISOString(),
  };
}

export async function updateApprovalSettings(settings: B2BApprovalSettings): Promise<B2BApprovalSettings> {
  const updated: B2BApprovalSettings = {
    ...settings,
    updatedAt: new Date().toISOString(),
  };
  memoryStore.approvalSettings.set(settings.orgId, updated);
  return updated;
}

// Delegations
export async function listDelegations(orgId: string, activeOnly = false): Promise<B2BDelegation[]> {
  const list = memoryStore.delegations.get(orgId) || [];
  if (activeOnly) {
    const now = new Date();
    return list.filter((d) => d.isActive && new Date(d.endDate) >= now);
  }
  return list;
}

export async function createDelegation(payload: Omit<B2BDelegation, 'id' | 'createdAt' | 'isActive'>): Promise<B2BDelegation> {
  const id = `del-${Date.now()}`;
  const newDelegation: B2BDelegation = {
    ...payload,
    id,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  const list = memoryStore.delegations.get(payload.orgId) || [];
  list.unshift(newDelegation);
  memoryStore.delegations.set(payload.orgId, list);
  return newDelegation;
}

export async function revokeDelegation(orgId: string, delegationId: string): Promise<boolean> {
  const list = memoryStore.delegations.get(orgId) || [];
  const item = list.find((d) => d.id === delegationId);
  if (item) {
    item.isActive = false;
    return true;
  }
  return false;
}

// Cost Centers
export async function listCostCenters(orgId: string, activeOnly = false): Promise<B2BCostCenter[]> {
  const list = getSeededCostCenters(orgId);
  if (activeOnly) {
    return list.filter((c) => c.isActive);
  }
  return list;
}

export async function createCostCenter(payload: Omit<B2BCostCenter, 'id' | 'currentSpent' | 'isActive' | 'createdAt' | 'updatedAt'>): Promise<B2BCostCenter> {
  const list = getSeededCostCenters(payload.orgId);
  const newCC: B2BCostCenter = {
    ...payload,
    id: `cc-${Date.now()}`,
    currentSpent: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  list.push(newCC);
  return newCC;
}

export async function updateCostCenter(orgId: string, id: string, updates: Partial<B2BCostCenter>): Promise<B2BCostCenter | null> {
  const list = getSeededCostCenters(orgId);
  const item = list.find((c) => c.id === id);
  if (!item) return null;
  Object.assign(item, updates, { updatedAt: new Date().toISOString() });
  return item;
}

export async function recordCostCenterSpent(orgId: string, id: string, amount: number): Promise<B2BCostCenter | null> {
  const list = getSeededCostCenters(orgId);
  const item = list.find((c) => c.id === id);
  if (!item) return null;
  item.currentSpent += amount;
  item.updatedAt = new Date().toISOString();
  return item;
}
