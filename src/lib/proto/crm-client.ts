import 'server-only';
import { createClient } from '@connectrpc/connect';
import { createGrpcTransport } from '@connectrpc/connect-node';
import { create } from '@bufbuild/protobuf';
import { getAccessToken, deleteSession } from '@/lib/auth/session';
import { refreshTokens } from '@/lib/auth/refresh';
import {
  CrmService,
  SearchCustomerLeadRequestSchema,
  SearchCustomerLeadResponse,
  CreateGuestRequestSchema,
  CreateGuestResponse,
  SendAccountOtpRequestSchema,
  SendAccountOtpResponse,
  VerifyAccountOtpRequestSchema,
  VerifyAccountOtpResponse,
  ConvertGuestToCustomerRequestSchema,
  ConvertGuestToCustomerResponse,
  ListCustomerLeadsRequestSchema,
  ListCustomerLeadsResponse,
  ListCustomersRequestSchema,
  ListCustomersResponse,
  OtpChannel,
} from '@buf/nkc_multiservice.bufbuild_es/multiservice/auth/v1/crm_pb.js';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_PROTO_URL ||
  process.env.BACKEND_GRPC_URL ||
  process.env.BACKEND_URL ||
  'http://192.168.117.66:3000';

async function refreshAccessToken(): Promise<boolean> {
  try {
    return await refreshTokens();
  } catch {
    return false;
  }
}

async function executeWithRefresh<T>(operation: () => Promise<T>, retryOnce = true): Promise<T> {
  try {
    return await operation();
  } catch (err) {
    const e = err as Record<string, unknown>;
    const code = e.code as number | undefined;
    const messageStr = (e.message as string | undefined) ?? (err instanceof Error ? err.message : '');
    const isUnauthenticated =
      code === 16 ||
      messageStr.toLowerCase().includes('unauthenticated') ||
      messageStr.toLowerCase().includes('authorization');

    if (isUnauthenticated && retryOnce) {
      const refreshed = await refreshAccessToken();
      if (refreshed) return executeWithRefresh(operation, false);
      try {
        await deleteSession();
      } catch {}
      throw new Error('SESSION_EXPIRED');
    }

    throw err;
  }
}

async function createAuthenticatedCrmClient() {
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

  return createClient(CrmService, authTransport);
}

function createPublicCrmClient() {
  const transport = createGrpcTransport({
    baseUrl: BACKEND_URL,
  });
  return createClient(CrmService, transport);
}

export async function protoSearchCustomerLead(payload: {
  query: string;
  limit?: number;
}): Promise<{ success: boolean; response?: SearchCustomerLeadResponse; error?: string }> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedCrmClient();
      const request = create(SearchCustomerLeadRequestSchema, {
        query: payload.query,
        limit: payload.limit ?? 10,
      });
      return await client.searchCustomerLead(request);
    });

    return { success: true, response };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'SearchCustomerLead failed' };
  }
}

export async function protoCreateGuest(payload: {
  email: string;
  phone: string;
  fullName?: string;
}): Promise<{ success: boolean; response?: CreateGuestResponse; error?: string }> {
  try {
    const client = createPublicCrmClient();
    const request = create(CreateGuestRequestSchema, {
      email: payload.email,
      phone: payload.phone,
      fullName: payload.fullName,
    });
    const response = await client.createGuest(request);
    return { success: true, response };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'CreateGuest failed' };
  }
}

export async function protoSendAccountOtp(payload: {
  userId: string;
  channel: OtpChannel;
}): Promise<{ success: boolean; response?: SendAccountOtpResponse; error?: string }> {
  try {
    const client = createPublicCrmClient();
    const request = create(SendAccountOtpRequestSchema, {
      userId: payload.userId,
      channel: payload.channel,
    });
    const response = await client.sendAccountOtp(request);
    return { success: true, response };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'SendAccountOtp failed' };
  }
}

export async function protoVerifyAccountOtp(payload: {
  userId: string;
  code: string;
}): Promise<{ success: boolean; response?: VerifyAccountOtpResponse; error?: string }> {
  try {
    const client = createPublicCrmClient();
    const request = create(VerifyAccountOtpRequestSchema, {
      userId: payload.userId,
      code: payload.code,
    });
    const response = await client.verifyAccountOtp(request);
    return { success: true, response };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'VerifyAccountOtp failed' };
  }
}

export async function protoConvertGuestToCustomer(payload: {
  guestId: string;
  verifiedToken: string;
}): Promise<{ success: boolean; response?: ConvertGuestToCustomerResponse; error?: string }> {
  try {
    const client = createPublicCrmClient();
    const request = create(ConvertGuestToCustomerRequestSchema, {
      guestId: payload.guestId,
      verifiedToken: payload.verifiedToken,
    });
    const response = await client.convertGuestToCustomer(request);
    return { success: true, response };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'ConvertGuestToCustomer failed' };
  }
}

export async function protoListCustomerLeads(payload: {
  pageSize?: number;
  pageToken?: string;
  searchTerm?: string;
}): Promise<{ success: boolean; response?: ListCustomerLeadsResponse; error?: string }> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedCrmClient();
      const request = create(ListCustomerLeadsRequestSchema, {
        pageSize: payload.pageSize ?? 20,
        pageToken: payload.pageToken ?? '',
        searchTerm: payload.searchTerm,
      });
      return await client.listCustomerLeads(request);
    });

    return { success: true, response };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'ListCustomerLeads failed' };
  }
}

export async function protoListCustomers(payload: {
  pageSize?: number;
  pageToken?: string;
  searchTerm?: string;
}): Promise<{ success: boolean; response?: ListCustomersResponse; error?: string }> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedCrmClient();
      const request = create(ListCustomersRequestSchema, {
        pageSize: payload.pageSize ?? 20,
        pageToken: payload.pageToken ?? '',
        searchTerm: payload.searchTerm,
      });
      return await client.listCustomers(request);
    });

    return { success: true, response };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'ListCustomers failed' };
  }
}

export async function protoUpdateCustomerLead(payload: {
  userId: string;
  email?: string;
  phone?: string;
  fullName?: string;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    const mod = (await import('@buf/nkc_multiservice.bufbuild_es/multiservice/auth/v1/crm_pb.js')) as Record<string, unknown>;
    const schema = mod.UpdateCustomerLeadRequestSchema;

    if (!schema) {
      return {
        success: false,
        error: 'UpdateCustomerLead proto schema is not available in current generated module.',
      };
    }

    const response = await executeWithRefresh(async () => {
      const client = (await createAuthenticatedCrmClient()) as unknown as Record<string, (req: unknown) => Promise<unknown>>;
      const method = client.updateCustomerLead;

      if (typeof method !== 'function') {
        throw new Error('UpdateCustomerLead RPC is not available in current CRM service client.');
      }

      const request = create(schema as Parameters<typeof create>[0], {
        userId: payload.userId,
        email: payload.email,
        phone: payload.phone,
        fullName: payload.fullName,
      });

      return await method(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'UpdateCustomerLead failed' };
  }
}

export { OtpChannel };
