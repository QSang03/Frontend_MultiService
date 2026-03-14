/**
 * Protobuf/Connect client for DepartmentService (server-side)
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
  DepartmentService,
  CreateDepartmentRequestSchema,
  GetDepartmentRequestSchema,
  UpdateDepartmentRequestSchema,
  DeleteDepartmentRequestSchema,
  ListDepartmentsRequestSchema,
} from '@buf/nkc_multiservice.bufbuild_es/multiservice/auth/v1/department_pb.js';
// Response shapes kept as `unknown` to avoid explicit `any` usage

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_PROTO_URL ||
  process.env.BACKEND_GRPC_URL ||
  process.env.BACKEND_URL ||
  'http://192.168.117.217:3000';

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
      console.log('[department.executeWithRefresh] Unauthenticated error, attempting refresh...');
      const refreshed = await refreshAccessToken();

      if (refreshed) {
        console.log('[department.executeWithRefresh] Refresh successful, retrying operation...');
        return executeWithRefresh(operation, false);
      }

      console.error('[department.executeWithRefresh] Refresh failed, clearing session and aborting');
      try {
        await deleteSession();
      } catch (e) {
        console.error('[department.executeWithRefresh] deleteSession failed:', e);
      }
      throw new Error('SESSION_EXPIRED');
    }

    throw err;
  }
}

async function createAuthenticatedDepartmentClient() {
  const token = await getAccessToken();

  if (!token) {
    console.warn('[createAuthenticatedDepartmentClient] No access token - will fail unless refreshed');
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

  return createClient(DepartmentService as unknown as DescService, authTransport) as unknown;
}

export async function protoCreateDepartment(payload: {
  name: string;
  code: string;
  description?: string;
  parentId?: string;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedDepartmentClient();
      const request = create(CreateDepartmentRequestSchema as unknown as DescMessage, {
        name: payload.name,
        code: payload.code,
        description: payload.description,
        parentId: payload.parentId,
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).createDepartment(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Create department failed';
    return { success: false, error: message };
  }
}

export async function protoGetDepartment(payload: {
  departmentId: string;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedDepartmentClient();
      const request = create(GetDepartmentRequestSchema as unknown as DescMessage, { departmentId: payload.departmentId });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).getDepartment(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Get department failed';
    return { success: false, error: message };
  }
}

export async function protoUpdateDepartment(payload: {
  departmentId: string;
  name?: string;
  code?: string;
  description?: string;
  parentId?: string;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedDepartmentClient();
      const request = create(UpdateDepartmentRequestSchema as unknown as DescMessage, {
        departmentId: payload.departmentId,
        name: payload.name,
        code: payload.code,
        description: payload.description,
        parentId: payload.parentId,
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).updateDepartment(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update department failed';
    return { success: false, error: message };
  }
}

export async function protoDeleteDepartment(payload: {
  departmentId: string;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedDepartmentClient();
      const request = create(DeleteDepartmentRequestSchema as unknown as DescMessage, { departmentId: payload.departmentId });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).deleteDepartment(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Delete department failed';
    return { success: false, error: message };
  }
}

export async function protoListDepartments(params?: {
  pageSize?: number;
  pageToken?: string;
  parentId?: string;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedDepartmentClient();
      const request = create(ListDepartmentsRequestSchema as unknown as DescMessage, {
        pageSize: params?.pageSize ?? 50,
        pageToken: params?.pageToken ?? '',
        parentId: params?.parentId,
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).listDepartments(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'List departments failed';
    return { success: false, error: message };
  }
}
