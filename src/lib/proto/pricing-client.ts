/**
 * Protobuf/Connect client for PricingService (server-side)
 * Raw gRPC (HTTP/2) must be called from server, not browser.
 */

import 'server-only';
import { createClient } from '@connectrpc/connect';
import { createGrpcTransport } from '@connectrpc/connect-node';
import { create } from '@bufbuild/protobuf';
import type { DescService, DescMessage } from '@bufbuild/protobuf';
import { getAccessToken, deleteSession } from '@/lib/auth/session';
import { refreshTokens } from '@/lib/auth/refresh';
import {
  PricingService,
  CreatePricingKRuleRequestSchema,
  UpdatePricingKRuleRequestSchema,
  UpdatePricingKRuleStatusRequestSchema,
  DeletePricingKRuleRequestSchema,
  ListPricingKRulesRequestSchema,
  CreatePricingDistributionConfigRequestSchema,
  UpdatePricingDistributionConfigRequestSchema,
  UpdatePricingDistributionConfigStatusRequestSchema,
  DeletePricingDistributionConfigRequestSchema,
  ListPricingDistributionConfigsRequestSchema,
} from '@buf/nkc_multiservice.bufbuild_es/multiservice/service/v1/pricing_pb.js';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_PROTO_URL ||
  process.env.BACKEND_GRPC_URL ||
  process.env.BACKEND_URL ||
  'http://192.168.117.18:3000';

async function refreshAccessToken(): Promise<boolean> {
  return await refreshTokens();
}

async function executeWithRefresh<T>(operation: () => Promise<T>, retryOnce = true): Promise<T> {
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
      console.log('[pricing.executeWithRefresh] Unauthenticated error, attempting refresh...');
      const refreshed = await refreshAccessToken();

      if (refreshed) {
        console.log('[pricing.executeWithRefresh] Refresh successful, retrying operation...');
        return executeWithRefresh(operation, false);
      }

      console.error('[pricing.executeWithRefresh] Refresh failed, clearing session and aborting');
      try {
        await deleteSession();
      } catch (e2) {
        console.error('[pricing.executeWithRefresh] deleteSession failed:', e2);
      }
      throw new Error('SESSION_EXPIRED');
    }

    throw err;
  }
}

async function createAuthenticatedPricingClient() {
  const token = await getAccessToken();

  if (!token) {
    console.warn('[createAuthenticatedPricingClient] No access token - will fail unless refreshed');
  }

  const authTransport = createGrpcTransport({
    baseUrl: BACKEND_URL,
    interceptors: [
      (next) => async (req) => {
        if (token) {
          req.header.set('authorization', `Bearer ${token}`);
        }
        return await next(req);
      },
    ],
  });

  return createClient(PricingService as unknown as DescService, authTransport) as unknown;
}

// Enums for RuleCategory and ConditionType
export enum RuleCategory {
  RULE_CATEGORY_UNSPECIFIED = 0,
  RULE_CATEGORY_TIME = 1,
  RULE_CATEGORY_HOLIDAY = 2,
  RULE_CATEGORY_URGENCY = 3,
  RULE_CATEGORY_LOCATION = 4,
  RULE_CATEGORY_CUSTOMER = 5,
}

export enum ConditionType {
  CONDITION_TYPE_UNSPECIFIED = 0,
  CONDITION_TYPE_MULTIPLIER = 1,
  CONDITION_TYPE_ADDITIVE = 2,
  CONDITION_TYPE_PERCENTAGE = 3,
}

export interface PricingKRuleDto {
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

export interface PricingDistributionConfigDto {
  id: string;
  orgId?: string;
  techRate: string;
  companyRate: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

function timestampToIso(ts?: unknown): string | undefined {
  if (!ts) return undefined;
  const t = ts as Record<string, unknown>;
  const secondsField = t['seconds'];
  const secondsRaw = (secondsField == null)
    ? undefined
    : (typeof secondsField === 'number' || typeof secondsField === 'string' ? secondsField : String(secondsField));
  if (secondsRaw == null) return undefined;
  const seconds = Number(secondsRaw);
  if (Number.isNaN(seconds)) return undefined;
  const nanos = Number((t.nanos as number | undefined) ?? 0);
  const ms = seconds * 1000 + Math.floor(nanos / 1e6);
  try {
    return new Date(ms).toISOString();
  } catch {
    return undefined;
  }
}

export async function protoCreatePricingKRule(payload: {
  orgId?: string;
  name: string;
  ruleCategory: RuleCategory;
  conditionType: ConditionType;
  multiplier: string;
  metadata?: string;
  priority: number;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    console.debug('[pricing-client] protoCreatePricingKRule payload:', payload);
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedPricingClient();
      const request = create(CreatePricingKRuleRequestSchema as unknown as DescMessage, {
        orgId: payload.orgId,
        name: payload.name,
        ruleCategory: payload.ruleCategory,
        conditionType: payload.conditionType,
        multiplier: payload.multiplier,
        metadata: payload.metadata ?? '',
        priority: payload.priority,
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).createPricingKRule(request as unknown);
    });
    console.debug('[pricing-client] protoCreatePricingKRule response:', response);

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Create pricing k-rule failed';
    return { success: false, error: message };
  }
}

export async function protoUpdatePricingKRule(payload: {
  id: string;
  name?: string;
  ruleCategory?: RuleCategory;
  conditionType?: ConditionType;
  multiplier?: string;
  metadata?: string;
  priority?: number;
  isActive?: boolean;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    console.debug('[pricing-client] protoUpdatePricingKRule payload:', payload);
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedPricingClient();
      const request = create(UpdatePricingKRuleRequestSchema as unknown as DescMessage, {
        id: payload.id,
        name: payload.name,
        ruleCategory: payload.ruleCategory,
        conditionType: payload.conditionType,
        multiplier: payload.multiplier,
        metadata: payload.metadata,
        priority: payload.priority,
        isActive: payload.isActive,
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).updatePricingKRule(request as unknown);
    });
    console.debug('[pricing-client] protoUpdatePricingKRule response:', response);

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update pricing k-rule failed';
    return { success: false, error: message };
  }
}

export async function protoUpdatePricingKRuleStatus(payload: {
  id: string;
  isActive: boolean;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    console.debug('[pricing-client] protoUpdatePricingKRuleStatus payload:', payload);
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedPricingClient();
      const request = create(UpdatePricingKRuleStatusRequestSchema as unknown as DescMessage, {
        id: payload.id,
        isActive: payload.isActive,
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).updatePricingKRuleStatus(request as unknown);
    });
    console.debug('[pricing-client] protoUpdatePricingKRuleStatus response:', response);

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update pricing k-rule status failed';
    return { success: false, error: message };
  }
}

export async function protoDeletePricingKRule(payload: {
  id: string;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    console.debug('[pricing-client] protoDeletePricingKRule id:', payload.id);
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedPricingClient();
      const request = create(DeletePricingKRuleRequestSchema as unknown as DescMessage, {
        id: payload.id,
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).deletePricingKRule(request as unknown);
    });
    console.debug('[pricing-client] protoDeletePricingKRule response:', response);

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Delete pricing k-rule failed';
    return { success: false, error: message };
  }
}

export async function protoListPricingKRules(params?: {
  orgId?: string;
  ruleCategory?: RuleCategory;
  isActive?: boolean;
  pageSize?: number;
  pageToken?: string;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    console.debug('[pricing-client] protoListPricingKRules params:', params);
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedPricingClient();
      const request = create(ListPricingKRulesRequestSchema as unknown as DescMessage, {
        orgId: params?.orgId,
        ruleCategory: params?.ruleCategory,
        isActive: params?.isActive,
        pageSize: params?.pageSize ?? 50,
        pageToken: params?.pageToken ?? '',
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).listPricingKRules(request as unknown);
    });
    console.debug('[pricing-client] protoListPricingKRules response:', response);

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'List pricing k-rules failed';
    return { success: false, error: message };
  }
}

export async function protoCreatePricingDistributionConfig(payload: {
  orgId?: string;
  techRate: string;
  companyRate: string;
  description?: string;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    console.debug('[pricing-client] protoCreatePricingDistributionConfig payload:', payload);
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedPricingClient();
      const request = create(CreatePricingDistributionConfigRequestSchema as unknown as DescMessage, {
        orgId: payload.orgId,
        techRate: payload.techRate,
        companyRate: payload.companyRate,
        description: payload.description ?? '',
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).createPricingDistributionConfig(request as unknown);
    });
    console.debug('[pricing-client] protoCreatePricingDistributionConfig response:', response);

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Create pricing distribution config failed';
    return { success: false, error: message };
  }
}

export async function protoUpdatePricingDistributionConfig(payload: {
  id: string;
  techRate?: string;
  companyRate?: string;
  description?: string;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    console.debug('[pricing-client] protoUpdatePricingDistributionConfig payload:', payload);
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedPricingClient();
      const request = create(UpdatePricingDistributionConfigRequestSchema as unknown as DescMessage, {
        id: payload.id,
        techRate: payload.techRate,
        companyRate: payload.companyRate,
        description: payload.description,
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).updatePricingDistributionConfig(request as unknown);
    });
    console.debug('[pricing-client] protoUpdatePricingDistributionConfig response:', response);

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update pricing distribution config failed';
    return { success: false, error: message };
  }
}

export async function protoUpdatePricingDistributionConfigStatus(payload: {
  id: string;
  isActive: boolean;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    console.debug('[pricing-client] protoUpdatePricingDistributionConfigStatus payload:', payload);
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedPricingClient();
      const request = create(UpdatePricingDistributionConfigStatusRequestSchema as unknown as DescMessage, {
        id: payload.id,
        isActive: payload.isActive,
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).updatePricingDistributionConfigStatus(request as unknown);
    });
    console.debug('[pricing-client] protoUpdatePricingDistributionConfigStatus response:', response);

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update pricing distribution config status failed';
    return { success: false, error: message };
  }
}

export async function protoDeletePricingDistributionConfig(payload: {
  id: string;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    console.debug('[pricing-client] protoDeletePricingDistributionConfig id:', payload.id);
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedPricingClient();
      const request = create(DeletePricingDistributionConfigRequestSchema as unknown as DescMessage, {
        id: payload.id,
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).deletePricingDistributionConfig(request as unknown);
    });
    console.debug('[pricing-client] protoDeletePricingDistributionConfig response:', response);

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Delete pricing distribution config failed';
    return { success: false, error: message };
  }
}

export async function protoListPricingDistributionConfigs(params?: {
  orgId?: string;
  isActive?: boolean;
  pageSize?: number;
  pageToken?: string;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    console.debug('[pricing-client] protoListPricingDistributionConfigs params:', params);
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedPricingClient();
      const request = create(ListPricingDistributionConfigsRequestSchema as unknown as DescMessage, {
        orgId: params?.orgId,
        isActive: params?.isActive,
        pageSize: params?.pageSize ?? 50,
        pageToken: params?.pageToken ?? '',
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).listPricingDistributionConfigs(request as unknown);
    });
    console.debug('[pricing-client] protoListPricingDistributionConfigs response:', response);

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'List pricing distribution configs failed';
    return { success: false, error: message };
  }
}

// Helper to normalize response from API
export function normalizePricingKRule(rule: unknown): PricingKRuleDto {
  const obj = (rule as Record<string, unknown>) || {};
  return {
    id: String(obj.id ?? ''),
    orgId: obj.orgId == null ? undefined : String(obj.orgId),
    name: String(obj.name ?? ''),
    ruleCategory: Number(obj.ruleCategory ?? obj.rule_category ?? 0) as RuleCategory,
    conditionType: Number(obj.conditionType ?? obj.condition_type ?? 0) as ConditionType,
    multiplier: String(obj.multiplier ?? '1'),
    metadata: obj.metadata == null ? undefined : String(obj.metadata),
    priority: Number(obj.priority ?? 0),
    isActive: Boolean(obj.isActive ?? obj.is_active ?? true),
    createdAt: timestampToIso(obj.createdAt ?? obj.created_at),
    updatedAt: timestampToIso(obj.updatedAt ?? obj.updated_at),
  };
}

export function normalizePricingDistributionConfig(config: unknown): PricingDistributionConfigDto {
  const obj = (config as Record<string, unknown>) || {};
  return {
    id: String(obj.id ?? ''),
    orgId: obj.orgId == null ? undefined : String(obj.orgId),
    techRate: String(obj.techRate ?? obj.tech_rate ?? '0'),
    companyRate: String(obj.companyRate ?? obj.company_rate ?? '0'),
    description: obj.description == null ? undefined : String(obj.description),
    isActive: Boolean(obj.isActive ?? obj.is_active ?? true),
    createdAt: timestampToIso(obj.createdAt ?? obj.created_at),
    updatedAt: timestampToIso(obj.updatedAt ?? obj.updated_at),
  };
}
