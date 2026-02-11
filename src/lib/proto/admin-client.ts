/**
 * Protobuf/Connect client for AdminService (server-side)
 * Raw gRPC (HTTP/2) must be called from server, not browser.
 */

import 'server-only';
import { createClient } from '@connectrpc/connect';
import { createGrpcTransport } from '@connectrpc/connect-node';
import { create } from '@bufbuild/protobuf';
import type { DescMessage } from '@bufbuild/protobuf';
import { getAccessToken, deleteSession } from '@/lib/auth/session';
import { refreshTokens } from '@/lib/auth/refresh';
import {
  AdminService,
  AdminListUsersRequestSchema,
  AdminListUsersResponse,
  AdminUpdateUserStatusRequestSchema,
  AdminUpdateUserStatusResponse,
  AdminUpdateUserRequestSchema,
  AdminUpdateUserResponse,
  AdminDeleteUserRequestSchema,
  AdminDeleteUserResponse,
  AdminListOrganizationsRequestSchema,
  AdminListOrganizationsResponse,
} from '@buf/nkc_multiservice.bufbuild_es/multiservice/auth/v1/admin_pb.js';

// Safe JSON replacer to handle BigInt values from protobuf (convert to string)
const jsonSafeReplacer = (_key: string, value: unknown) => {
  if (typeof value === 'bigint') return value.toString();
  return value;
};
// Backend URL for raw gRPC over HTTP/2 (server-side).
// Prefer the public proto URL so both client and server use one source.
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_PROTO_URL || process.env.BACKEND_GRPC_URL || process.env.BACKEND_URL || 'http://192.168.117.18:3000';

// adminClient intentionally not used directly; create authenticated clients per-call.
// (removed unused `transport` variable to satisfy linter)

// Helper to refresh access token using server-side cookies
async function refreshAccessToken(): Promise<boolean> {
  return await refreshTokens();
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
    const isUnauthenticated =
      code === 16 ||
      messageStr.toLowerCase().includes('unauthenticated') ||
      messageStr.toLowerCase().includes('authorization');

    if (isUnauthenticated && retryOnce) {
      console.log('[admin.executeWithRefresh] Unauthenticated error, attempting refresh...');
      const refreshed = await refreshAccessToken();

      if (refreshed) {
        console.log('[admin.executeWithRefresh] Refresh successful, retrying operation...');
        return executeWithRefresh(operation, false);
      }

      console.error('[admin.executeWithRefresh] Refresh failed, clearing session and aborting');
      try {
        await deleteSession();
      } catch (e) {
        console.error('[admin.executeWithRefresh] deleteSession failed:', e);
      }
      throw new Error('SESSION_EXPIRED');
    }

    throw err;
  }
}

// Create authenticated client with token in metadata
async function createAuthenticatedAdminClient() {
  const token = await getAccessToken();

  if (!token) {
    console.warn('[createAuthenticatedAdminClient] No access token - will fail unless refreshed');
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

  return createClient(AdminService, authTransport);
}

export async function protoAdminListUsers(params?: {
  pageSize?: number;
  pageToken?: string;
  roleFilter?: number;
}): Promise<{ success: boolean; response?: AdminListUsersResponse; error?: string }> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedAdminClient();
      const request = create(AdminListUsersRequestSchema, {
        pageSize: params?.pageSize ?? 50,
        pageToken: params?.pageToken ?? '',
        roleFilter: params?.roleFilter,
      });
      return await client.adminListUsers(request);
    });

    // DEBUG: log shape of response.users for troubleshooting isActive mapping
    try {
      console.log(
        '[protoAdminListUsers] response.users sample:',
        JSON.stringify((response.users || []).slice(0, 5), jsonSafeReplacer)
      );
    } catch (e) {
      console.log('[protoAdminListUsers] failed to stringify response.users', e);
    }

    return { success: true, response: response as AdminListUsersResponse };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Admin list users failed';
    return { success: false, error: message };
  }
}

export async function protoAdminUpdateUserStatus(payload: {
  userId: string;
  isActive: boolean;
}): Promise<{ success: boolean; response?: AdminUpdateUserStatusResponse; error?: string }> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedAdminClient();
      const request = create(AdminUpdateUserStatusRequestSchema, {
        userId: payload.userId,
        isActive: payload.isActive,
      });
      // DEBUG: log the update request being sent
      console.log('[protoAdminUpdateUserStatus] request:', { userId: payload.userId, isActive: payload.isActive });
      return await client.adminUpdateUserStatus(request);
    });

    // DEBUG: log response from update call
    try {
      console.log('[protoAdminUpdateUserStatus] response:', JSON.stringify(response, jsonSafeReplacer));
    } catch (e) {
      console.log('[protoAdminUpdateUserStatus] failed to stringify response', e);
    }

    return { success: true, response: response as AdminUpdateUserStatusResponse };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Admin update user status failed';
    return { success: false, error: message };
  }
}

export async function protoAdminUpdateUser(payload: {
  userId: string;
  fullName?: string;
  role?: number;
  password?: string;
  phone?: string;
  departmentId?: string;
}): Promise<{ success: boolean; response?: AdminUpdateUserResponse; error?: string }> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedAdminClient();
      const request = create(AdminUpdateUserRequestSchema as unknown as DescMessage, {
        userId: payload.userId,
        fullName: payload.fullName,
        role: payload.role,
        password: payload.password,
        phone: payload.phone,
        departmentId: payload.departmentId,
      } as Record<string, unknown>);
      console.log('[protoAdminUpdateUser] request:', { userId: payload.userId, fullName: payload.fullName });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).adminUpdateUser(request as unknown);
    });

    try {
      console.log('[protoAdminUpdateUser] response:', JSON.stringify(response, jsonSafeReplacer));
    } catch (e) {
      console.log('[protoAdminUpdateUser] failed to stringify response', e);
    }

    return { success: true, response: response as AdminUpdateUserResponse };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Admin update user failed';
    return { success: false, error: message };
  }
}

export async function protoAdminCreateUser(payload: {
  email: string;
  phone?: string;
  fullName?: string;
  password?: string;
  role?: number;
  organizationId?: string;
  }): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedAdminClient();
      const request = create((await import('@buf/nkc_multiservice.bufbuild_es/multiservice/auth/v1/admin_pb.js')).AdminCreateUserRequestSchema, {
        email: payload.email,
        phone: payload.phone,
        fullName: payload.fullName,
        password: payload.password,
        role: payload.role,
        organizationId: payload.organizationId,
      });
      console.log('[protoAdminCreateUser] request:', { email: payload.email, fullName: payload.fullName });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).adminCreateUser(request as unknown);
    });

    try {
      console.log('[protoAdminCreateUser] response:', JSON.stringify(response, jsonSafeReplacer));
    } catch (e) {
      console.log('[protoAdminCreateUser] failed to stringify response', e);
    }

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Admin create user failed';
    return { success: false, error: message };
  }
}

export async function protoAdminDeleteUser(payload: {
  userId: string;
}): Promise<{ success: boolean; response?: AdminDeleteUserResponse; error?: string }> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedAdminClient();
      const request = create(AdminDeleteUserRequestSchema, { userId: payload.userId });
      return await client.adminDeleteUser(request);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Admin delete user failed';
    return { success: false, error: message };
  }
}

export async function protoAdminListOrganizations(params?: {
  pageSize?: number;
  pageToken?: string;
}): Promise<{ success: boolean; response?: AdminListOrganizationsResponse; error?: string }> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedAdminClient();
      const request = create(AdminListOrganizationsRequestSchema, {
        pageSize: params?.pageSize ?? 50,
        pageToken: params?.pageToken ?? '',
      });
      return await client.adminListOrganizations(request);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Admin list organizations failed';
    return { success: false, error: message };
  }
}
