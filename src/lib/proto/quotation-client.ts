/**
 * Protobuf/Connect client for QuotationService (server-side)
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
let quotationModuleCache: Record<string, unknown> | null = null;
let moduleLoadAttempted = false;

async function loadQuotationModule(): Promise<Record<string, unknown> | null> {
  if (moduleLoadAttempted) return quotationModuleCache;
  moduleLoadAttempted = true;
  try {
    const mod = await import('@buf/nkc_multiservice.bufbuild_es/multiservice/service/v1/quotation_pb.js');
    quotationModuleCache = mod as unknown as Record<string, unknown>;
    console.log('[quotation-client] Proto module loaded successfully');
    return quotationModuleCache;
  } catch (err) {
    console.warn('[quotation-client] Proto module not available:', err);
    return null;
  }
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_PROTO_URL ||
  process.env.BACKEND_GRPC_URL ||
  process.env.BACKEND_URL ||
  'http://192.168.117.66:3000';

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
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return executeWithRefresh(operation, false);
      }
      try { await deleteSession(); } catch { /* ignore */ }
      throw new Error('SESSION_EXPIRED');
    }
    throw err;
  }
}

async function createAuthenticatedClient() {
  const mod = await loadQuotationModule();
  if (!mod) throw new Error('PROTO_MODULE_NOT_AVAILABLE');

  const token = await getAccessToken();
  const authTransport = createGrpcTransport({
    baseUrl: BACKEND_URL,
    interceptors: [
      (next) => async (req) => {
        if (token) req.header.set('authorization', `Bearer ${token}`);
        return await next(req);
      },
    ],
  });

  return {
    client: createClient(mod.QuotationService as unknown as DescService, authTransport) as unknown,
    mod,
  };
}

type RpcMethod = (req: unknown) => Promise<unknown>;
type QuotationResult = { success: boolean; response?: unknown; error?: string };

// ─── Template Management ────────────────────────────────────────────────────

export async function protoListQuotationTemplates(params?: {
  category?: string;
  isActive?: boolean;
}): Promise<QuotationResult> {
  const mod = await loadQuotationModule();
  if (!mod) return { success: false, error: 'PROTO_MODULE_NOT_AVAILABLE' };
  try {
    const response = await executeWithRefresh(async () => {
      const { client, mod: m } = await createAuthenticatedClient();
      const request = create(m.ListQuotationTemplatesRequestSchema as unknown as DescMessage, {
        category: params?.category,
        isActive: params?.isActive,
      });
      return await (client as Record<string, RpcMethod>).listQuotationTemplates(request);
    });
    return { success: true, response };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'ListQuotationTemplates failed' };
  }
}

export async function protoCreateQuotationTemplate(payload: {
  name: string;
  description: string;
  items: string;
  category: string;
}): Promise<QuotationResult> {
  const mod = await loadQuotationModule();
  if (!mod) return { success: false, error: 'PROTO_MODULE_NOT_AVAILABLE' };
  try {
    const response = await executeWithRefresh(async () => {
      const { client, mod: m } = await createAuthenticatedClient();
      const request = create(m.CreateQuotationTemplateRequestSchema as unknown as DescMessage, {
        name: payload.name,
        description: payload.description,
        items: payload.items,
        category: payload.category,
      });
      return await (client as Record<string, RpcMethod>).createQuotationTemplate(request);
    });
    return { success: true, response };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'CreateQuotationTemplate failed' };
  }
}

export async function protoUpdateQuotationTemplate(payload: {
  id: string;
  name?: string;
  description?: string;
  items?: string;
  category?: string;
  isActive?: boolean;
}): Promise<QuotationResult> {
  const mod = await loadQuotationModule();
  if (!mod) return { success: false, error: 'PROTO_MODULE_NOT_AVAILABLE' };
  try {
    const response = await executeWithRefresh(async () => {
      const { client, mod: m } = await createAuthenticatedClient();
      const request = create(m.UpdateQuotationTemplateRequestSchema as unknown as DescMessage, {
        id: payload.id,
        name: payload.name,
        description: payload.description,
        items: payload.items,
        category: payload.category,
        isActive: payload.isActive,
      });
      return await (client as Record<string, RpcMethod>).updateQuotationTemplate(request);
    });
    return { success: true, response };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'UpdateQuotationTemplate failed' };
  }
}

export async function protoDeleteQuotationTemplate(id: string): Promise<QuotationResult> {
  const mod = await loadQuotationModule();
  if (!mod) return { success: false, error: 'PROTO_MODULE_NOT_AVAILABLE' };
  try {
    const response = await executeWithRefresh(async () => {
      const { client, mod: m } = await createAuthenticatedClient();
      const request = create(m.DeleteQuotationTemplateRequestSchema as unknown as DescMessage, { id });
      return await (client as Record<string, RpcMethod>).deleteQuotationTemplate(request);
    });
    return { success: true, response };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'DeleteQuotationTemplate failed' };
  }
}

// ─── Quotation Management ───────────────────────────────────────────────────

export async function protoDeleteQuotation(id: string): Promise<QuotationResult> {
  const mod = await loadQuotationModule();
  if (!mod) return { success: false, error: 'PROTO_MODULE_NOT_AVAILABLE' };
  try {
    const response = await executeWithRefresh(async () => {
      const { client, mod: m } = await createAuthenticatedClient();
      const request = create(m.DeleteQuotationRequestSchema as unknown as DescMessage, { id });
      return await (client as Record<string, RpcMethod>).deleteQuotation(request);
    });
    return { success: true, response };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'DeleteQuotation failed' };
  }
}

export async function protoListQuotations(params?: {
  orgId?: string;
  customerId?: string;
  saleId?: string;
  status?: number;
  pageSize?: number;
  pageToken?: string;
}): Promise<QuotationResult> {
  const mod = await loadQuotationModule();
  if (!mod) return { success: false, error: 'PROTO_MODULE_NOT_AVAILABLE' };
  try {
    const response = await executeWithRefresh(async () => {
      const { client, mod: m } = await createAuthenticatedClient();
      const request = create(m.ListQuotationsRequestSchema as unknown as DescMessage, {
        orgId: params?.orgId,
        customerId: params?.customerId,
        saleId: params?.saleId,
        status: params?.status,
        pageSize: params?.pageSize ?? 50,
        pageToken: params?.pageToken ?? '',
      });
      return await (client as Record<string, RpcMethod>).listQuotations(request);
    });
    return { success: true, response };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'ListQuotations failed' };
  }
}

export async function protoGetQuotation(id: string): Promise<QuotationResult> {
  const mod = await loadQuotationModule();
  if (!mod) return { success: false, error: 'PROTO_MODULE_NOT_AVAILABLE' };
  try {
    const response = await executeWithRefresh(async () => {
      const { client, mod: m } = await createAuthenticatedClient();
      const request = create(m.GetQuotationRequestSchema as unknown as DescMessage, { id });
      return await (client as Record<string, RpcMethod>).getQuotation(request);
    });
    return { success: true, response };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'GetQuotation failed' };
  }
}

export async function protoCreateQuotation(payload: {
  customerId: string;
  ticketId?: string;
  templateId?: string;
  totalAmount: string;
  taxAmount: string;
  currency: string;
  items: string;
  note?: string;
}): Promise<QuotationResult> {
  const mod = await loadQuotationModule();
  if (!mod) return { success: false, error: 'PROTO_MODULE_NOT_AVAILABLE' };
  try {
    const response = await executeWithRefresh(async () => {
      const { client, mod: m } = await createAuthenticatedClient();
      const request = create(m.CreateQuotationRequestSchema as unknown as DescMessage, {
        customerId: payload.customerId,
        ticketId: payload.ticketId,
        templateId: payload.templateId,
        totalAmount: payload.totalAmount,
        taxAmount: payload.taxAmount,
        currency: payload.currency,
        items: payload.items,
        note: payload.note,
      });
      return await (client as Record<string, RpcMethod>).createQuotation(request);
    });
    return { success: true, response };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'CreateQuotation failed' };
  }
}

export async function protoUpdateQuotationStatus(payload: {
  id: string;
  status: number;
}): Promise<QuotationResult> {
  const mod = await loadQuotationModule();
  if (!mod) return { success: false, error: 'PROTO_MODULE_NOT_AVAILABLE' };
  try {
    const response = await executeWithRefresh(async () => {
      const { client, mod: m } = await createAuthenticatedClient();
      const request = create(m.UpdateQuotationStatusRequestSchema as unknown as DescMessage, {
        id: payload.id,
        status: payload.status,
      });
      return await (client as Record<string, RpcMethod>).updateQuotationStatus(request);
    });
    return { success: true, response };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'UpdateQuotationStatus failed' };
  }
}

export async function protoSendQuoteToClient(quotationId: string): Promise<QuotationResult> {
  const mod = await loadQuotationModule();
  if (!mod) return { success: false, error: 'PROTO_MODULE_NOT_AVAILABLE' };
  try {
    const response = await executeWithRefresh(async () => {
      const { client, mod: m } = await createAuthenticatedClient();
      const request = create(m.SendQuoteToClientRequestSchema as unknown as DescMessage, { quotationId });
      return await (client as Record<string, RpcMethod>).sendQuoteToClient(request);
    });
    return { success: true, response };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'SendQuoteToClient failed' };
  }
}

// ─── Lifecycle & Operations ─────────────────────────────────────────────────

export async function protoCalculateQuotationMargin(payload: {
  totalAmount: string;
  items: string;
}): Promise<QuotationResult> {
  const mod = await loadQuotationModule();
  if (!mod) return { success: false, error: 'PROTO_MODULE_NOT_AVAILABLE' };
  try {
    const response = await executeWithRefresh(async () => {
      const { client, mod: m } = await createAuthenticatedClient();
      const request = create(m.CalculateQuotationMarginRequestSchema as unknown as DescMessage, {
        totalAmount: payload.totalAmount,
        items: payload.items,
      });
      return await (client as Record<string, RpcMethod>).calculateQuotationMargin(request);
    });
    return { success: true, response };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'CalculateQuotationMargin failed' };
  }
}

export async function protoConvertToContract(payload: {
  quotationId: string;
  title: string;
  startDate: string;
  endDate: string;
}): Promise<QuotationResult> {
  const mod = await loadQuotationModule();
  if (!mod) return { success: false, error: 'PROTO_MODULE_NOT_AVAILABLE' };
  try {
    const response = await executeWithRefresh(async () => {
      const { client, mod: m } = await createAuthenticatedClient();
      const request = create(m.ConvertToContractRequestSchema as unknown as DescMessage, {
        quotationId: payload.quotationId,
        title: payload.title,
        startDate: payload.startDate,
        endDate: payload.endDate,
      });
      return await (client as Record<string, RpcMethod>).convertToContract(request);
    });
    return { success: true, response };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'ConvertToContract failed' };
  }
}

export async function protoUpdateQuotation(payload: {
  id: string;
  totalAmount?: string;
  taxAmount?: string;
  currency?: string;
  items?: string;
  note?: string;
}): Promise<QuotationResult> {
  const mod = await loadQuotationModule();
  if (!mod) return { success: false, error: 'PROTO_MODULE_NOT_AVAILABLE' };
  try {
    const response = await executeWithRefresh(async () => {
      const { client, mod: m } = await createAuthenticatedClient();
      const request = create(m.UpdateQuotationRequestSchema as unknown as DescMessage, {
        id: payload.id,
        totalAmount: payload.totalAmount,
        taxAmount: payload.taxAmount,
        currency: payload.currency,
        items: payload.items,
        note: payload.note,
      });
      return await (client as Record<string, RpcMethod>).updateQuotation(request);
    });
    return { success: true, response };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'UpdateQuotation failed' };
  }
}

export async function protoGetQuoteContractStatus(quotationId: string): Promise<QuotationResult> {
  const mod = await loadQuotationModule();
  if (!mod) return { success: false, error: 'PROTO_MODULE_NOT_AVAILABLE' };
  try {
    const response = await executeWithRefresh(async () => {
      const { client, mod: m } = await createAuthenticatedClient();
      const request = create(m.GetQuoteContractStatusRequestSchema as unknown as DescMessage, { quotationId });
      return await (client as Record<string, RpcMethod>).getQuoteContractStatus(request);
    });
    return { success: true, response };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'GetQuoteContractStatus failed' };
  }
}
