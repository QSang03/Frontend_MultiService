/**
 * Protobuf/Connect client for TenantService (server-side)
 * Connects directly to Backend gRPC (multiservice.tenant.v1.TenantService)
 */

import 'server-only';
import { createClient } from '@connectrpc/connect';
import { createGrpcTransport } from '@connectrpc/connect-node';
import { create } from '@bufbuild/protobuf';
import { getAccessToken, deleteSession } from '@/lib/auth/session';
import { refreshTokens } from '@/lib/auth/refresh';
import {
  TenantService,
  ProvisionTenantRequestSchema,
  type ProvisionTenantResponse,
  GetTenantStatusRequestSchema,
  type GetTenantStatusResponse,
  DeleteTenantRequestSchema,
  type DeleteTenantResponse,
  GetApprovalSettingsRequestSchema,
  type GetApprovalSettingsResponse,
  UpdateApprovalSettingsRequestSchema,
  type UpdateApprovalSettingsResponse,
  ListCostCentersRequestSchema,
  type ListCostCentersResponse,
  CreateCostCenterRequestSchema,
  type CreateCostCenterResponse,
  UpdateCostCenterRequestSchema,
  type UpdateCostCenterResponse,
  ListDelegationsRequestSchema,
  type ListDelegationsResponse,
  CreateDelegationRequestSchema,
  type CreateDelegationResponse,
  RevokeDelegationRequestSchema,
  type RevokeDelegationResponse,
} from '@buf/nkc_multiservice.bufbuild_es/multiservice/tenant/v1/tenant_pb.js';

const BACKEND_URL =
  process.env.BACKEND_GRPC_URL ||
  process.env.NEXT_PUBLIC_BACKEND_PROTO_URL ||
  process.env.BACKEND_URL ||
  'http://192.168.117.217:28500';

async function refreshAccessToken(): Promise<boolean> {
  return await refreshTokens();
}

async function executeWithRefresh<T>(
  operation: () => Promise<T>,
  retryOnce = true
): Promise<T> {
  try {
    return await operation();
  } catch (err) {
    const e = err as unknown as Record<string, unknown>;
    const code = e.code as number | undefined;
    const messageStr = (e.message as string | undefined) ?? (err instanceof Error ? err.message : '');
    const isUnauthenticated =
      code === 16 ||
      messageStr.toLowerCase().includes('unauthenticated') ||
      messageStr.toLowerCase().includes('authorization');

    if (isUnauthenticated && retryOnce) {
      console.log('[tenant.executeWithRefresh] Unauthenticated, refreshing token...');
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return executeWithRefresh(operation, false);
      }
      try {
        await deleteSession();
      } catch (delErr) {
        console.error('[tenant.executeWithRefresh] deleteSession failed:', delErr);
      }
      throw new Error('SESSION_EXPIRED');
    }

    throw err;
  }
}

async function createAuthenticatedTenantClient() {
  const token = await getAccessToken();

  const authTransport = createGrpcTransport({
    baseUrl: BACKEND_URL,
    interceptors: [
      (next) => async (req) => {
        if (token) {
          req.header.set('authorization', `Bearer ${token}`);
        }
        return next(req);
      },
    ],
  });

  return createClient(TenantService, authTransport);
}

// In-memory fallback cache for development or offline testing
const memoryStore = {
  approvalSettings: new Map<string, B2BApprovalSettings>(),
  delegations: new Map<string, B2BDelegation[]>(),
  costCenters: new Map<string, B2BCostCenter[]>(),
};

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

// RPC 1: Provision Tenant
export async function protoProvisionTenant(orgId: string): Promise<{
  success: boolean;
  response?: ProvisionTenantResponse;
  error?: string;
}> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedTenantClient();
      const request = create(ProvisionTenantRequestSchema, { orgId });
      return await client.provisionTenant(request);
    });
    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Provision tenant failed';
    return { success: false, error: message };
  }
}

// RPC 2: Get Tenant Status
export async function protoGetTenantStatus(orgId: string): Promise<{
  success: boolean;
  response?: GetTenantStatusResponse;
  error?: string;
}> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedTenantClient();
      const request = create(GetTenantStatusRequestSchema, { orgId });
      return await client.getTenantStatus(request);
    });
    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Get tenant status failed';
    return { success: false, error: message };
  }
}

// RPC 3: Delete Tenant
export async function protoDeleteTenant(orgId: string): Promise<{
  success: boolean;
  response?: DeleteTenantResponse;
  error?: string;
}> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedTenantClient();
      const request = create(DeleteTenantRequestSchema, { orgId });
      return await client.deleteTenant(request);
    });
    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Delete tenant failed';
    return { success: false, error: message };
  }
}

// RPC 4: Get Approval Settings
export async function protoGetApprovalSettings(orgId: string): Promise<B2BApprovalSettings> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedTenantClient();
      const request = create(GetApprovalSettingsRequestSchema, { orgId });
      return await client.getApprovalSettings(request);
    });
    return {
      orgId: response.orgId,
      enabled: response.enabled,
      levels: response.levels,
      threshold1: response.threshold1,
      threshold2: response.threshold2,
      timeoutHours: response.timeoutHours,
      escalationHours: response.escalationHours,
      updatedAt: response.updatedAt ? new Date(Number(response.updatedAt.seconds) * 1000).toISOString() : undefined,
    };
  } catch {
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
}

// Alias for customer b2b API compatibility
export const getApprovalSettings = protoGetApprovalSettings;

// RPC 5: Update Approval Settings
export async function protoUpdateApprovalSettings(
  settings: B2BApprovalSettings
): Promise<B2BApprovalSettings> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedTenantClient();
      const request = create(UpdateApprovalSettingsRequestSchema, {
        orgId: settings.orgId,
        enabled: settings.enabled,
        levels: settings.levels,
        threshold1: settings.threshold1,
        threshold2: settings.threshold2,
        timeoutHours: settings.timeoutHours,
        escalationHours: settings.escalationHours,
      });
      return await client.updateApprovalSettings(request);
    });
    const updated: B2BApprovalSettings = {
      orgId: response.orgId,
      enabled: response.enabled,
      levels: response.levels,
      threshold1: response.threshold1,
      threshold2: response.threshold2,
      timeoutHours: response.timeoutHours,
      escalationHours: response.escalationHours,
      updatedAt: new Date().toISOString(),
    };
    memoryStore.approvalSettings.set(settings.orgId, updated);
    return updated;
  } catch {
    const updated: B2BApprovalSettings = {
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    memoryStore.approvalSettings.set(settings.orgId, updated);
    return updated;
  }
}

// Alias for customer b2b API compatibility
export const updateApprovalSettings = protoUpdateApprovalSettings;

// RPC 6: Cost Centers
export async function protoListCostCenters(orgId: string, activeOnly = false): Promise<B2BCostCenter[]> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedTenantClient();
      const request = create(ListCostCentersRequestSchema, { orgId, activeOnly });
      return await client.listCostCenters(request);
    });
    return response.costCenters.map((cc) => ({
      id: cc.id,
      orgId: cc.orgId,
      code: cc.code,
      name: cc.name,
      allocatedBudget: cc.allocatedBudget,
      currentSpent: cc.currentSpent,
      isActive: cc.isActive,
    }));
  } catch {
    if (!memoryStore.costCenters.has(orgId)) {
      memoryStore.costCenters.set(orgId, [
        { id: 'cc-1', orgId, code: 'IT-01', name: 'IT Infrastructure', allocatedBudget: 30000000, currentSpent: 12500000, isActive: true },
        { id: 'cc-2', orgId, code: 'OPS-01', name: 'Operations & Facilities', allocatedBudget: 15000000, currentSpent: 4500000, isActive: true },
      ]);
    }
    const list = memoryStore.costCenters.get(orgId)!;
    return activeOnly ? list.filter((c) => c.isActive) : list;
  }
}

// Alias
export const listCostCenters = protoListCostCenters;

export async function protoCreateCostCenter(payload: {
  orgId: string;
  code: string;
  name: string;
  allocatedBudget: number;
}): Promise<B2BCostCenter> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedTenantClient();
      const request = create(CreateCostCenterRequestSchema, payload);
      return await client.createCostCenter(request);
    });
    return {
      id: response.id,
      orgId: response.orgId,
      code: response.code,
      name: response.name,
      allocatedBudget: response.allocatedBudget,
      currentSpent: response.currentSpent,
      isActive: response.isActive,
    };
  } catch {
    const newCc: B2BCostCenter = {
      id: `cc-${Date.now()}`,
      ...payload,
      currentSpent: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    const list = memoryStore.costCenters.get(payload.orgId) || [];
    list.push(newCc);
    memoryStore.costCenters.set(payload.orgId, list);
    return newCc;
  }
}

// Alias
export const createCostCenter = protoCreateCostCenter;

export async function updateCostCenter(
  orgId: string,
  id: string,
  data: { name?: string; allocatedBudget?: number; isActive?: boolean }
): Promise<B2BCostCenter | null> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedTenantClient();
      const request = create(UpdateCostCenterRequestSchema, {
        id,
        name: data.name,
        allocatedBudget: data.allocatedBudget,
        isActive: data.isActive,
      });
      return await client.updateCostCenter(request);
    });
    return {
      id: response.id,
      orgId: response.orgId,
      code: response.code,
      name: response.name,
      allocatedBudget: response.allocatedBudget,
      currentSpent: response.currentSpent,
      isActive: response.isActive,
    };
  } catch {
    const list = memoryStore.costCenters.get(orgId) || [];
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    list[idx] = {
      ...list[idx],
      name: data.name ?? list[idx].name,
      allocatedBudget: data.allocatedBudget ?? list[idx].allocatedBudget,
      isActive: data.isActive ?? list[idx].isActive,
      updatedAt: new Date().toISOString(),
    };
    memoryStore.costCenters.set(orgId, list);
    return list[idx];
  }
}

export async function recordCostCenterSpent(
  orgId: string,
  costCenterId: string,
  amount: number
): Promise<boolean> {
  const list = memoryStore.costCenters.get(orgId) || [];
  const idx = list.findIndex((c) => c.id === costCenterId);
  if (idx !== -1) {
    list[idx].currentSpent += amount;
    memoryStore.costCenters.set(orgId, list);
    return true;
  }
  return false;
}

// RPC 7: Delegations
export async function listDelegations(orgId: string, activeOnly = false): Promise<B2BDelegation[]> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedTenantClient();
      const request = create(ListDelegationsRequestSchema, { orgId, activeOnly });
      return await client.listDelegations(request);
    });
    return response.delegations.map((d) => ({
      id: d.id,
      orgId: d.orgId,
      managerId: d.managerId,
      delegateeId: d.delegateeId,
      startDate: d.startDate ? new Date(Number(d.startDate.seconds) * 1000).toISOString() : '',
      endDate: d.endDate ? new Date(Number(d.endDate.seconds) * 1000).toISOString() : '',
      requestType: d.requestType,
      isActive: d.isActive,
    }));
  } catch {
    const list = memoryStore.delegations.get(orgId) || [];
    if (activeOnly) {
      const now = new Date();
      return list.filter((d) => d.isActive && new Date(d.endDate) >= now);
    }
    return list;
  }
}

export async function createDelegation(data: {
  orgId: string;
  managerId: string;
  delegateeId: string;
  startDate: string;
  endDate: string;
  requestType: string;
}): Promise<B2BDelegation> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedTenantClient();
      const request = create(CreateDelegationRequestSchema, {
        orgId: data.orgId,
        managerId: data.managerId,
        delegateeId: data.delegateeId,
        requestType: data.requestType,
      });
      return await client.createDelegation(request);
    });
    return {
      id: response.id,
      orgId: response.orgId,
      managerId: response.managerId,
      delegateeId: response.delegateeId,
      startDate: data.startDate,
      endDate: data.endDate,
      requestType: response.requestType,
      isActive: response.isActive,
    };
  } catch {
    const newDelegation: B2BDelegation = {
      id: `del-${Date.now()}`,
      ...data,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    const list = memoryStore.delegations.get(data.orgId) || [];
    list.push(newDelegation);
    memoryStore.delegations.set(data.orgId, list);
    return newDelegation;
  }
}

export async function revokeDelegation(orgId: string, delegationId: string): Promise<boolean> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedTenantClient();
      const request = create(RevokeDelegationRequestSchema, { delegationId });
      return await client.revokeDelegation(request);
    });
    return response.success;
  } catch {
    const list = memoryStore.delegations.get(orgId) || [];
    const idx = list.findIndex((d) => d.id === delegationId);
    if (idx !== -1) {
      list[idx].isActive = false;
      memoryStore.delegations.set(orgId, list);
      return true;
    }
    return false;
  }
}
