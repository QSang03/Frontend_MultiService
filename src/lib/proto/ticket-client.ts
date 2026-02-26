/**
 * Protobuf/Connect client for TicketService (server-side)
 * Raw gRPC (HTTP/2) must be called from server, not browser.
 * 
 * Note: This client requires the ticket_pb module to be published to the BSR.
 * Until the module is available, the functions will return appropriate errors.
 */

import 'server-only';
import { createClient } from '@connectrpc/connect';
import { createGrpcTransport } from '@connectrpc/connect-node';
import { create } from '@bufbuild/protobuf';
import type { DescService, DescMessage } from '@bufbuild/protobuf';
import { getAccessToken, deleteSession } from '@/lib/auth/session';
import { refreshTokens } from '@/lib/auth/refresh';

// Module cache
let ticketModuleCache: Record<string, unknown> | null = null;
let moduleLoadAttempted = false;

async function loadTicketModule(): Promise<Record<string, unknown> | null> {
  if (moduleLoadAttempted) return ticketModuleCache;
  
  moduleLoadAttempted = true;
  try {
    const mod = await import('@buf/nkc_multiservice.bufbuild_es/multiservice/service/v1/ticket_pb.js');
    ticketModuleCache = mod as unknown as Record<string, unknown>;
    console.log('[ticket-client] Proto module loaded successfully');
    return ticketModuleCache;
  } catch (err) {
    console.warn('[ticket-client] Proto module not available:', err);
    return null;
  }
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_PROTO_URL ||
  process.env.BACKEND_GRPC_URL ||
  process.env.BACKEND_URL ||
  'http://192.168.117.66:3000';

function mapPriorityToProto(priority: string | number | undefined): number {
  if (typeof priority === 'number') return priority;
  const normalized = String(priority ?? 'normal').trim().toLowerCase();
  if (normalized === 'low') return 1;
  if (normalized === 'high') return 3;
  if (normalized === 'critical' || normalized === 'urgent') return 4;
  return 2;
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
      console.log('[ticket.executeWithRefresh] Unauthenticated error, attempting refresh...');
      const refreshed = await refreshAccessToken();

      if (refreshed) {
        console.log('[ticket.executeWithRefresh] Refresh successful, retrying operation...');
        return executeWithRefresh(operation, false);
      }

      console.error('[ticket.executeWithRefresh] Refresh failed, clearing session and aborting');
      try {
        await deleteSession();
      } catch (e2) {
        console.error('[ticket.executeWithRefresh] deleteSession failed:', e2);
      }
      throw new Error('SESSION_EXPIRED');
    }

    throw err;
  }
}

async function createAuthenticatedTicketClient() {
  const mod = await loadTicketModule();
  if (!mod) {
    throw new Error('PROTO_MODULE_NOT_AVAILABLE');
  }

  const token = await getAccessToken();

  if (!token) {
    console.warn('[createAuthenticatedTicketClient] No access token - will fail unless refreshed');
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

  return createClient(mod.TicketService as unknown as DescService, authTransport) as unknown;
}

// CreateTicket
export async function protoCreateTicket(payload: {
  customerId: string;
  categoryId: string;
  serviceId?: string;
  title: string;
  description: string;
  priority: string | number;
  attributes: string;
  assetId?: string;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  const mod = await loadTicketModule();
  if (!mod) {
    return { success: false, error: 'TicketService proto module not yet available. Please sync protos from backend.' };
  }

  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedTicketClient();
      type RpcMethod = (req: unknown) => Promise<unknown>;
      const methods = client as unknown as Record<string, RpcMethod>;
      const useSaleCreate = typeof methods.saleCreateTicket === 'function';

      if (useSaleCreate) {
        const request = create(mod.SaleCreateTicketRequestSchema as unknown as DescMessage, {
          customerId: payload.customerId,
          categoryId: payload.categoryId,
          serviceId: payload.serviceId,
          title: payload.title,
          description: payload.description,
          priority: mapPriorityToProto(payload.priority),
          attributes: payload.attributes,
          assetId: payload.assetId,
        });
        return await methods.saleCreateTicket(request as unknown);
      }

      const request = create(mod.CreateTicketRequestSchema as unknown as DescMessage, {
        categoryId: payload.categoryId,
        serviceId: payload.serviceId,
        title: payload.title,
        description: payload.description,
        priority: mapPriorityToProto(payload.priority),
        attributes: payload.attributes,
        assetId: payload.assetId,
      });
      return await methods.createTicket(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Create ticket failed';
    return { success: false, error: message };
  }
}

export async function protoPreviewSLA(payload: {
  categoryId: string;
  serviceId?: string;
  priority: string | number;
  orgId: string;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  const mod = await loadTicketModule();
  if (!mod) {
    return { success: false, error: 'TicketService proto module not yet available. Please sync protos from backend.' };
  }

  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedTicketClient();
      const request = create(mod.PreviewSLARequestSchema as unknown as DescMessage, {
        categoryId: payload.categoryId,
        serviceId: payload.serviceId,
        priority: mapPriorityToProto(payload.priority),
        orgId: payload.orgId,
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).previewSLA(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Preview SLA failed';
    return { success: false, error: message };
  }
}

export async function protoPreviewPricingRules(payload: {
  orgId: string;
  priority: string | number;
  slaHours: number;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  const mod = await loadTicketModule();
  if (!mod) {
    return { success: false, error: 'TicketService proto module not yet available. Please sync protos from backend.' };
  }

  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedTicketClient();
      const request = create(mod.PreviewPricingRulesRequestSchema as unknown as DescMessage, {
        orgId: payload.orgId,
        priority: mapPriorityToProto(payload.priority),
        slaHours: payload.slaHours,
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).previewPricingRules(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Preview pricing rules failed';
    return { success: false, error: message };
  }
}

// UpdateTicketStatus
export async function protoUpdateTicketStatus(payload: {
  ticketId: string;
  status: number;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  const mod = await loadTicketModule();
  if (!mod) {
    return { success: false, error: 'TicketService proto module not yet available. Please sync protos from backend.' };
  }

  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedTicketClient();
      const request = create(mod.UpdateTicketStatusRequestSchema as unknown as DescMessage, {
        ticketId: payload.ticketId,
        status: payload.status,
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).updateTicketStatus(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update ticket status failed';
    return { success: false, error: message };
  }
}

// AssignTicket
export async function protoAssignTicket(payload: {
  ticketId: string;
  techId?: string;
  saleId?: string;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  const mod = await loadTicketModule();
  if (!mod) {
    return { success: false, error: 'TicketService proto module not yet available. Please sync protos from backend.' };
  }

  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedTicketClient();
      const request = create(mod.AssignTicketRequestSchema as unknown as DescMessage, {
        ticketId: payload.ticketId,
        techId: payload.techId,
        saleId: payload.saleId,
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).assignTicket(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Assign ticket failed';
    return { success: false, error: message };
  }
}

// SubmitQuotation
export async function protoSubmitQuotation(payload: {
  ticketId: string;
  totalAmount: string;
  taxAmount: string;
  currency: string;
  note: string;
  items: string;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  const mod = await loadTicketModule();
  if (!mod) {
    return { success: false, error: 'TicketService proto module not yet available. Please sync protos from backend.' };
  }

  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedTicketClient();
      const request = create(mod.SubmitQuotationRequestSchema as unknown as DescMessage, {
        ticketId: payload.ticketId,
        totalAmount: payload.totalAmount,
        taxAmount: payload.taxAmount,
        currency: payload.currency,
        note: payload.note,
        items: payload.items,
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).submitQuotation(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Submit quotation failed';
    return { success: false, error: message };
  }
}

// AcceptQuotation
export async function protoAcceptQuotation(payload: {
  quotationId: string;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  const mod = await loadTicketModule();
  if (!mod) {
    return { success: false, error: 'TicketService proto module not yet available. Please sync protos from backend.' };
  }

  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedTicketClient();
      const request = create(mod.AcceptQuotationRequestSchema as unknown as DescMessage, {
        quotationId: payload.quotationId,
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).acceptQuotation(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Accept quotation failed';
    return { success: false, error: message };
  }
}

// RejectQuotation
export async function protoRejectQuotation(payload: {
  quotationId: string;
  reason: string;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  const mod = await loadTicketModule();
  if (!mod) {
    return { success: false, error: 'TicketService proto module not yet available. Please sync protos from backend.' };
  }

  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedTicketClient();
      const request = create(mod.RejectQuotationRequestSchema as unknown as DescMessage, {
        quotationId: payload.quotationId,
        reason: payload.reason,
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).rejectQuotation(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Reject quotation failed';
    return { success: false, error: message };
  }
}

// ApproveTicket
export async function protoApproveTicket(payload: {
  ticketId: string;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  const mod = await loadTicketModule();
  if (!mod) {
    return { success: false, error: 'TicketService proto module not yet available. Please sync protos from backend.' };
  }

  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedTicketClient();
      const request = create(mod.ApproveTicketRequestSchema as unknown as DescMessage, {
        ticketId: payload.ticketId,
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).approveTicket(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Approve ticket failed';
    return { success: false, error: message };
  }
}

// RejectTicket
export async function protoRejectTicket(payload: {
  ticketId: string;
  reason: string;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  const mod = await loadTicketModule();
  if (!mod) {
    return { success: false, error: 'TicketService proto module not yet available. Please sync protos from backend.' };
  }

  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedTicketClient();
      const request = create(mod.RejectTicketRequestSchema as unknown as DescMessage, {
        ticketId: payload.ticketId,
        reason: payload.reason,
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).rejectTicket(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Reject ticket failed';
    return { success: false, error: message };
  }
}

// ListTickets
export async function protoListTickets(params?: {
  orgId?: string;
  creatorId?: string;
  status?: number;
  pageSize?: number;
  pageToken?: string;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  const mod = await loadTicketModule();
  if (!mod) {
    return { success: false, error: 'TicketService proto module not yet available. Please sync protos from backend.' };
  }

  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedTicketClient();
      const request = create(mod.ListTicketsRequestSchema as unknown as DescMessage, {
        orgId: params?.orgId,
        creatorId: params?.creatorId,
        status: params?.status,
        pageSize: params?.pageSize ?? 50,
        pageToken: params?.pageToken ?? '',
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).listTickets(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'List tickets failed';
    return { success: false, error: message };
  }
}
