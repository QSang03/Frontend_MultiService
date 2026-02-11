/**
 * Protobuf/Connect client for InventoryService (server-side)
 * Raw gRPC (HTTP/2) must be called from server, not browser.
 */

import 'server-only';
import { createClient } from '@connectrpc/connect';
import { createGrpcTransport } from '@connectrpc/connect-node';
import { create } from '@bufbuild/protobuf';
import type { DescService, DescMessage } from '@bufbuild/protobuf';
import { getAccessToken, deleteSession } from '@/lib/auth/session';
import { refreshTokens } from '@/lib/auth/refresh';

// Module cache
let inventoryModuleCache: Record<string, unknown> | null = null;
let moduleLoadAttempted = false;

async function loadInventoryModule(): Promise<Record<string, unknown> | null> {
  if (moduleLoadAttempted) return inventoryModuleCache;
  
  moduleLoadAttempted = true;
  try {
    const mod = await import('@buf/nkc_multiservice.bufbuild_es/multiservice/service/v1/inventory_pb.js');
    inventoryModuleCache = mod as unknown as Record<string, unknown>;
    console.log('[inventory-client] Proto module loaded successfully');
    return inventoryModuleCache;
  } catch (err) {
    console.warn('[inventory-client] Proto module not available:', err);
    return null;
  }
}

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
      console.log('[inventory.executeWithRefresh] Unauthenticated error, attempting refresh...');
      const refreshed = await refreshAccessToken();

      if (refreshed) {
        console.log('[inventory.executeWithRefresh] Refresh successful, retrying operation...');
        return executeWithRefresh(operation, false);
      }

      console.error('[inventory.executeWithRefresh] Refresh failed, clearing session and aborting');
      try {
        await deleteSession();
      } catch (e2) {
        console.error('[inventory.executeWithRefresh] deleteSession failed:', e2);
      }
      throw new Error('SESSION_EXPIRED');
    }

    throw err;
  }
}

async function createAuthenticatedInventoryClient() {
  const mod = await loadInventoryModule();
  if (!mod) {
    throw new Error('PROTO_MODULE_NOT_AVAILABLE');
  }

  const token = await getAccessToken();

  if (!token) {
    console.warn('[createAuthenticatedInventoryClient] No access token - will fail unless refreshed');
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

  const InventoryService = mod.InventoryService;
  if (!InventoryService) {
    throw new Error('InventoryService not found in proto module');
  }

  return {
    client: createClient(InventoryService as unknown as DescService, authTransport) as unknown,
    mod,
  };
}

// ========================
// Item Management
// ========================

export type CostingMethod = 'COSTING_METHOD_UNSPECIFIED' | 'FIFO' | 'WEIGHTED_AVERAGE' | 'SPECIFIC_ID';

export interface CreateItemPayload {
  skuCode: string;
  name: string;
  categoryId?: string;
  description?: string;
  minStockLevel?: number;
  costingMethod?: CostingMethod;
  metadata?: string;
}

export async function protoCreateItem(
  payload: CreateItemPayload
): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    const response = await executeWithRefresh(async () => {
      const { client, mod } = await createAuthenticatedInventoryClient();
      const schema = mod.CreateItemRequestSchema as unknown as DescMessage;
      
      // Map costing method string to enum value
      let costingMethodValue = 0; // COSTING_METHOD_UNSPECIFIED
      if (payload.costingMethod === 'FIFO') costingMethodValue = 1;
      else if (payload.costingMethod === 'WEIGHTED_AVERAGE') costingMethodValue = 2;
      else if (payload.costingMethod === 'SPECIFIC_ID') costingMethodValue = 3;

      const requestData: Record<string, unknown> = {
        skuCode: payload.skuCode,
        name: payload.name,
        description: payload.description ?? '',
        minStockLevel: payload.minStockLevel ?? 0,
        costingMethod: costingMethodValue,
      };
      if (payload.categoryId) {
        requestData.categoryId = payload.categoryId;
      }
      if (payload.metadata && payload.metadata.trim() !== '') {
        requestData.metadata = payload.metadata;
      }

      const request = create(schema, requestData);

      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).createItem(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Create item failed';
    return { success: false, error: message };
  }
}

export interface UpdateItemPayload {
  id: string;
  name?: string;
  description?: string;
  minStockLevel?: number;
  costingMethod?: CostingMethod;
  metadata?: string;
}

export async function protoUpdateItem(
  payload: UpdateItemPayload
): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    const response = await executeWithRefresh(async () => {
      const { client, mod } = await createAuthenticatedInventoryClient();
      const schema = mod.UpdateItemRequestSchema as unknown as DescMessage;

      const requestData: Record<string, unknown> = { id: payload.id };
      if (payload.name !== undefined) requestData.name = payload.name;
      if (payload.description !== undefined) requestData.description = payload.description;
      if (payload.minStockLevel !== undefined) requestData.minStockLevel = payload.minStockLevel;
      if (payload.costingMethod !== undefined) {
        let costingMethodValue = 0;
        if (payload.costingMethod === 'FIFO') costingMethodValue = 1;
        else if (payload.costingMethod === 'WEIGHTED_AVERAGE') costingMethodValue = 2;
        else if (payload.costingMethod === 'SPECIFIC_ID') costingMethodValue = 3;
        requestData.costingMethod = costingMethodValue;
      }
      if (payload.metadata && payload.metadata.trim() !== '') requestData.metadata = payload.metadata;

      const request = create(schema, requestData);
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).updateItem(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update item failed';
    return { success: false, error: message };
  }
}

export async function protoGetItem(
  id: string
): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    const response = await executeWithRefresh(async () => {
      const { client, mod } = await createAuthenticatedInventoryClient();
      const schema = mod.GetItemRequestSchema as unknown as DescMessage;
      const request = create(schema, { id });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).getItem(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Get item failed';
    return { success: false, error: message };
  }
}

export interface ListItemsPayload {
  categoryId?: string;
  isActive?: boolean;
  pageSize?: number;
  pageToken?: string;
}

export async function protoListItems(
  payload: ListItemsPayload = {}
): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    const response = await executeWithRefresh(async () => {
      const { client, mod } = await createAuthenticatedInventoryClient();
      const schema = mod.ListItemsRequestSchema as unknown as DescMessage;

      const requestData: Record<string, unknown> = {
        pageSize: payload.pageSize ?? 50,
        pageToken: payload.pageToken ?? '',
      };
      if (payload.categoryId !== undefined) requestData.categoryId = payload.categoryId;
      if (payload.isActive !== undefined) requestData.isActive = payload.isActive;

      const request = create(schema, requestData);
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).listItems(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'List items failed';
    return { success: false, error: message };
  }
}

// ========================
// Stock Management
// ========================

// Backend enum mapping (proto):
// 0: TRANSACTION_TYPE_UNSPECIFIED
// 1: TRANSACTION_TYPE_IN
// 2: TRANSACTION_TYPE_OUT
// 3: TRANSACTION_TYPE_ADJUST
// 4: TRANSACTION_TYPE_RMA
export type TransactionType =
  | 'TRANSACTION_TYPE_UNSPECIFIED'
  | 'TRANSACTION_TYPE_IN'
  | 'TRANSACTION_TYPE_OUT'
  | 'TRANSACTION_TYPE_ADJUST'
  | 'TRANSACTION_TYPE_RMA';

export interface AdjustStockPayload {
  itemId: string;
  type: TransactionType;
  quantity: string;
  unitCost: string;
  ticketId?: string;
  reason: string;
  batchNumber?: string;
}

export async function protoAdjustStock(
  payload: AdjustStockPayload
): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    const response = await executeWithRefresh(async () => {
      const { client, mod } = await createAuthenticatedInventoryClient();
      const schema = mod.AdjustStockRequestSchema as unknown as DescMessage;

      // Map transaction type string to enum value
      let typeValue = 0; // TRANSACTION_TYPE_UNSPECIFIED
      if (payload.type === 'TRANSACTION_TYPE_IN') typeValue = 1;
      else if (payload.type === 'TRANSACTION_TYPE_OUT') typeValue = 2;
      else if (payload.type === 'TRANSACTION_TYPE_ADJUST') typeValue = 3;
      else if (payload.type === 'TRANSACTION_TYPE_RMA') typeValue = 4;

      const requestData: Record<string, unknown> = {
        itemId: payload.itemId,
        type: typeValue,
        quantity: payload.quantity,
        unitCost: payload.unitCost,
        reason: payload.reason,
      };
      if (payload.ticketId) requestData.ticketId = payload.ticketId;
      if (payload.batchNumber) requestData.batchNumber = payload.batchNumber;

      const request = create(schema, requestData);
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).adjustStock(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Adjust stock failed';
    return { success: false, error: message };
  }
}

export async function protoGetStockStatus(
  itemId: string
): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    const response = await executeWithRefresh(async () => {
      const { client, mod } = await createAuthenticatedInventoryClient();
      const schema = mod.GetStockStatusRequestSchema as unknown as DescMessage;
      const request = create(schema, { itemId });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).getStockStatus(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Get stock status failed';
    return { success: false, error: message };
  }
}
