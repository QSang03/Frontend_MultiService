/**
 * Protobuf/Connect client for ContractService (server-side)
 * Raw gRPC (HTTP/2) must be called from server, not browser.
 */

import 'server-only';
import { createClient } from '@connectrpc/connect';
import { createGrpcTransport } from '@connectrpc/connect-node';
import { create } from '@bufbuild/protobuf';
import { getAccessToken, getRefreshToken, updateTokens, deleteSession } from '@/lib/auth/session';
import {
  ContractService,
  CreateContractRequestSchema,
  CreateContractResponse,
  GetContractRequestSchema,
  GetContractResponse,
  ListContractsRequestSchema,
  ListContractsResponse,
  CancelContractRequestSchema,
  CancelContractResponse,
  SendForSignatureRequestSchema,
  SendForSignatureResponse,
  SignContractRequestSchema,
  SignContractResponse,
  ActivateContractRequestSchema,
  ActivateContractResponse,
  CreateRecurringScheduleRequestSchema,
  CreateRecurringScheduleResponse,
  ApproveRenewalRequestSchema,
  ApproveRenewalResponse,
  ListTemplatesRequestSchema,
  ListTemplatesResponse,
  ContractStatus,
  SignatureMethod,
} from '@buf/nkc_multiservice.bufbuild_es/multiservice/service/v1/contract_pb.js';

import type {
  CreateContractRequest,
  ListContractsRequest,
  SignContractRequest,
  CreateRecurringScheduleRequest,
  ApproveRenewalRequest,
  ListTemplatesRequest,
} from '@/types/contract';

// Backend URL for raw gRPC over HTTP/2 (server-side)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_PROTO_URL || process.env.BACKEND_GRPC_URL || process.env.BACKEND_URL || 'http://192.168.117.18:3000';

const transport = createGrpcTransport({
  baseUrl: BACKEND_URL,
});

const contractClient = createClient(ContractService, transport);

// Helper to refresh access token using server-side cookies
async function refreshAccessToken(): Promise<boolean> {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      console.log('[contract-client refreshAccessToken] No refresh token found');
      return false;
    }

    // Import auth client dynamically to avoid circular deps
    const { protoRefreshToken } = await import('./auth-client');
    const result = await protoRefreshToken(refreshToken);
    
    if (result.success && result.response?.tokens) {
      await updateTokens(
        result.response.tokens.accessToken,
        result.response.tokens.refreshToken
      );
      return true;
    }
    return false;
  } catch (err) {
    console.error('[contract-client refreshAccessToken] Error:', err);
    return false;
  }
}

// Helper to execute authenticated call with auto-retry on unauthenticated
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
    const isUnauthenticated = code === 16 ||
                              messageStr.toLowerCase().includes('unauthenticated') ||
                              messageStr.toLowerCase().includes('authorization');
    
    if (isUnauthenticated && retryOnce) {
      console.log('[contract-client executeWithRefresh] Unauthenticated, attempting refresh...');
      const refreshed = await refreshAccessToken();

      if (refreshed) {
        return executeWithRefresh(operation, false);
      } else {
        try {
          await deleteSession();
        } catch (e) {
          console.error('[contract-client] deleteSession failed:', e);
        }
        throw new Error('SESSION_EXPIRED');
      }
    }
    throw err;
  }
}

// Create authenticated client with token in metadata
async function createAuthenticatedClient() {
  const token = await getAccessToken();
  
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
  
  return createClient(ContractService, authTransport);
}

// Result wrapper types
export interface ProtoContractResult<T> {
  success: boolean;
  response?: T;
  error?: string;
}

/**
 * Create Contract (from Quotation)
 */
export async function protoCreateContract(
  data: CreateContractRequest
): Promise<ProtoContractResult<CreateContractResponse>> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedClient();
      const request = create(CreateContractRequestSchema, {
        quotationId: data.quotationId,
        title: data.title,
        startDate: data.startDate,
        endDate: data.endDate,
        templateId: data.templateId,
        lineItems: data.lineItems.map(item => ({
          serviceId: item.serviceId,
          quantity: item.quantity,
          unitPrice: String(item.unitPrice),
          description: item.description,
        })),
      });
      return await client.createContract(request);
    });
    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Create contract failed';
    return { success: false, error: message };
  }
}

/**
 * Get Contract by ID
 */
export async function protoGetContract(
  contractId: string
): Promise<ProtoContractResult<GetContractResponse>> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedClient();
      const request = create(GetContractRequestSchema, { contractId });
      return await client.getContract(request);
    });
    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Get contract failed';
    return { success: false, error: message };
  }
}

/**
 * List Contracts with filters
 */
export async function protoListContracts(
  params: ListContractsRequest
): Promise<ProtoContractResult<ListContractsResponse>> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedClient();
      const request = create(ListContractsRequestSchema, {
        orgId: params.orgId,
        customerId: params.customerId,
        status: params.status as ContractStatus | undefined,
        pageSize: params.pageSize || 20,
        pageToken: params.pageToken || '',
      });
      return await client.listContracts(request);
    });
    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'List contracts failed';
    return { success: false, error: message };
  }
}

/**
 * Cancel Contract
 */
export async function protoCancelContract(
  contractId: string,
  reason: string
): Promise<ProtoContractResult<CancelContractResponse>> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedClient();
      const request = create(CancelContractRequestSchema, { contractId, reason });
      return await client.cancelContract(request);
    });
    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Cancel contract failed';
    return { success: false, error: message };
  }
}

/**
 * Send Contract for Signature
 */
export async function protoSendForSignature(
  contractId: string
): Promise<ProtoContractResult<SendForSignatureResponse>> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedClient();
      const request = create(SendForSignatureRequestSchema, { contractId });
      return await client.sendForSignature(request);
    });
    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Send for signature failed';
    return { success: false, error: message };
  }
}

/**
 * Customer Sign Contract
 */
export async function protoSignContract(
  data: SignContractRequest
): Promise<ProtoContractResult<SignContractResponse>> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedClient();
      const request = create(SignContractRequestSchema, {
        contractId: data.contractId,
        method: data.method as unknown as SignatureMethod,
        signatureData: data.signatureData,
        otpCode: data.otpCode,
      });
      return await client.signContract(request);
    });
    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sign contract failed';
    return { success: false, error: message };
  }
}

/**
 * Activate Contract (Admin action after signature)
 */
export async function protoActivateContract(
  contractId: string
): Promise<ProtoContractResult<ActivateContractResponse>> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedClient();
      const request = create(ActivateContractRequestSchema, { contractId });
      return await client.activateContract(request);
    });
    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Activate contract failed';
    return { success: false, error: message };
  }
}

/**
 * Create Recurring Schedule (Temporal workflow)
 */
export async function protoCreateRecurringSchedule(
  data: CreateRecurringScheduleRequest
): Promise<ProtoContractResult<CreateRecurringScheduleResponse>> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedClient();
      const request = create(CreateRecurringScheduleRequestSchema, {
        contractId: data.contractId,
        cronExpression: data.cronExpression,
        categoryId: data.categoryId,
        priority: data.priority,
        descriptionTemplate: data.descriptionTemplate,
      });
      return await client.createRecurringSchedule(request);
    });
    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Create recurring schedule failed';
    return { success: false, error: message };
  }
}

/**
 * Approve Contract Renewal
 */
export async function protoApproveRenewal(
  data: ApproveRenewalRequest
): Promise<ProtoContractResult<ApproveRenewalResponse>> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedClient();
      const request = create(ApproveRenewalRequestSchema, {
        contractId: data.contractId,
        newEndDate: data.newEndDate,
      });
      return await client.approveRenewal(request);
    });
    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Approve renewal failed';
    return { success: false, error: message };
  }
}

/**
 * List Contract Templates
 */
export async function protoListTemplates(
  params: ListTemplatesRequest
): Promise<ProtoContractResult<ListTemplatesResponse>> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedClient();
      const request = create(ListTemplatesRequestSchema, {
        category: params.category,
        activeOnly: params.activeOnly ?? true,
      });
      return await client.listTemplates(request);
    });
    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'List templates failed';
    return { success: false, error: message };
  }
}

export { contractClient, ContractStatus, SignatureMethod };
