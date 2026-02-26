/**
 * Protobuf/Connect client for CatalogService (server-side)
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
  CatalogService,
  CreateCategoryRequestSchema,
  UpdateCategoryRequestSchema,
  ListCategoriesRequestSchema,
  GetCategoryRequestSchema,
  CreateServiceRequestSchema,
  UpdateServiceRequestSchema,
  ListServicesRequestSchema,
  GetServiceRequestSchema,
  DeleteServiceRequestSchema,
  SubmitCategoryRequestSchema,
  ApproveCategoryRequestSchema,
  RejectCategoryRequestSchema,
} from '@buf/nkc_multiservice.bufbuild_es/multiservice/service/v1/catalog_pb.js';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_PROTO_URL ||
  process.env.BACKEND_GRPC_URL ||
  process.env.BACKEND_URL ||
  'http://192.168.117.66:3000';

export async function protoSubmitCategory(payload: {
  id: string;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedCatalogClient();
      const request = create(SubmitCategoryRequestSchema as unknown as DescMessage, { id: payload.id });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).submitCategory(request as unknown);
    });
    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Submit category failed';
    return { success: false, error: message };
  }
}

export async function protoApproveCategory(payload: {
  id: string;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedCatalogClient();
      const request = create(ApproveCategoryRequestSchema as unknown as DescMessage, { id: payload.id });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).approveCategory(request as unknown);
    });
    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Approve category failed';
    return { success: false, error: message };
  }
}

export async function protoRejectCategory(payload: {
  id: string;
  reason?: string;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedCatalogClient();
      const request = create(RejectCategoryRequestSchema as unknown as DescMessage, {
        id: payload.id,
        reason: payload.reason ?? '',
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).rejectCategory(request as unknown);
    });
    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Reject category failed';
    return { success: false, error: message };
  }
}

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
      console.log('[catalog.executeWithRefresh] Unauthenticated error, attempting refresh...');
      const refreshed = await refreshAccessToken();

      if (refreshed) {
        console.log('[catalog.executeWithRefresh] Refresh successful, retrying operation...');
        return executeWithRefresh(operation, false);
      }

      console.error('[catalog.executeWithRefresh] Refresh failed, clearing session and aborting');
      try {
        await deleteSession();
      } catch (e2) {
        console.error('[catalog.executeWithRefresh] deleteSession failed:', e2);
      }
      throw new Error('SESSION_EXPIRED');
    }

    throw err;
  }
}

async function createAuthenticatedCatalogClient() {
  const token = await getAccessToken();

  if (!token) {
    console.warn('[createAuthenticatedCatalogClient] No access token - will fail unless refreshed');
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

  return createClient(CatalogService as unknown as DescService, authTransport) as unknown;
}

export async function protoCreateCategory(payload: {
  name: string;
  description?: string;
  attributesSchema?: string;
  parentId?: string;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedCatalogClient();
      const request = create(CreateCategoryRequestSchema as unknown as DescMessage, {
        name: payload.name,
        description: payload.description ?? '',
        attributesSchema: payload.attributesSchema ?? '',
        parentId: payload.parentId,
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).createCategory(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Create category failed';
    return { success: false, error: message };
  }
}

export async function protoGetCategory(payload: {
  categoryId: string;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedCatalogClient();
      const request = create(GetCategoryRequestSchema as unknown as DescMessage, { id: payload.categoryId });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).getCategory(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Get category failed';
    return { success: false, error: message };
  }
}

export async function protoUpdateCategory(payload: {
  categoryId: string;
  name?: string;
  description?: string;
  attributesSchema?: string;
  parentId?: string;
  status?: number;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedCatalogClient();
      const request = create(UpdateCategoryRequestSchema as unknown as DescMessage, {
        id: payload.categoryId,
        name: payload.name,
        description: payload.description,
        attributesSchema: payload.attributesSchema,
        parentId: payload.parentId,
        status: payload.status ?? 0,
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).updateCategory(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update category failed';
    return { success: false, error: message };
  }
}

export async function protoListCategories(params?: {
  pageSize?: number;
  pageToken?: string;
  parentId?: string;
  hasServices?: boolean;
  showApproved?: boolean;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedCatalogClient();
      const request = create(ListCategoriesRequestSchema as unknown as DescMessage, {
        pageSize: params?.pageSize ?? 50,
        pageToken: params?.pageToken ?? '',
        parentId: params?.parentId,
        hasServices: params?.hasServices,
        showApproved: params?.showApproved,
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).listCategories(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'List categories failed';
    return { success: false, error: message };
  }
}

export async function protoCreateService(payload: {
  categoryId: string;
  name: string;
  description?: string;
  code?: string;
  pricingModel?: number;
  basePrice?: string;
  attributes?: string;
  slaConfig?: string;
  defaultPriority?: string;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    console.debug('[catalog-client] protoCreateService payload:', payload);
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedCatalogClient();
      const request = create(CreateServiceRequestSchema as unknown as DescMessage, {
        categoryId: payload.categoryId,
        name: payload.name,
        description: payload.description ?? '',
        code: payload.code ?? '',
        pricingModel: payload.pricingModel ?? 0,
        basePrice: payload.basePrice ?? '0',
        attributes: payload.attributes ?? '',
        slaConfig: payload.slaConfig ?? '',
        defaultPriority: payload.defaultPriority ?? '',
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).createService(request as unknown);
    });
    console.debug('[catalog-client] protoCreateService response:', response);

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Create service failed';
    return { success: false, error: message };
  }
}

export async function protoGetService(payload: {
  serviceId: string;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedCatalogClient();
      const request = create(GetServiceRequestSchema as unknown as DescMessage, { id: payload.serviceId });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).getService(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Get service failed';
    return { success: false, error: message };
  }
}

export async function protoUpdateService(payload: {
  serviceId: string;
  categoryId?: string;
  name?: string;
  description?: string;
  code?: string;
  pricingModel?: number;
  basePrice?: string;
  attributes?: string;
  slaConfig?: string;
  defaultPriority?: string;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedCatalogClient();
      const request = create(UpdateServiceRequestSchema as unknown as DescMessage, {
        id: payload.serviceId,
        categoryId: payload.categoryId,
        name: payload.name,
        description: payload.description,
        code: payload.code,
        pricingModel: payload.pricingModel ?? 0,
        basePrice: payload.basePrice,
        attributes: payload.attributes,
        slaConfig: payload.slaConfig,
        defaultPriority: payload.defaultPriority,
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).updateService(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update service failed';
    return { success: false, error: message };
  }
}

export async function protoDeleteService(payload: {
  serviceId: string;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedCatalogClient();
      const request = create(DeleteServiceRequestSchema as unknown as DescMessage, { id: payload.serviceId });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).deleteService(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Delete service failed';
    return { success: false, error: message };
  }
}

export async function protoListServices(params?: {
  pageSize?: number;
  pageToken?: string;
  categoryId?: string;
  showInactive?: boolean;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedCatalogClient();
      const request = create(ListServicesRequestSchema as unknown as DescMessage, {
        pageSize: params?.pageSize ?? 50,
        pageToken: params?.pageToken ?? '',
        categoryId: params?.categoryId,
        showInactive: params?.showInactive ?? false,
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).listServices(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'List services failed';
    return { success: false, error: message };
  }
}