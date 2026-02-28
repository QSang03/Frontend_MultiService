import 'server-only';
import { createClient } from '@connectrpc/connect';
import { createGrpcTransport } from '@connectrpc/connect-node';
import { create } from '@bufbuild/protobuf';
import type { DescMessage } from '@bufbuild/protobuf';
import { getAccessToken, deleteSession } from '@/lib/auth/session';
import { refreshTokens } from '@/lib/auth/refresh';
import {
  StorageService,
  GetUploadUrlRequestSchema,
  GetDownloadUrlRequestSchema,
  RegisterUploadRequestSchema,
} from '@buf/nkc_multiservice.bufbuild_es/multiservice/common/v1/common_pb.js';

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
    const e = err as Record<string, unknown>;
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
      try {
        await deleteSession();
      } catch {
      }
      throw new Error('SESSION_EXPIRED');
    }

    throw err;
  }
}

async function createAuthenticatedStorageClient() {
  const token = await getAccessToken();
  const transport = createGrpcTransport({
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

  return createClient(StorageService, transport) as unknown;
}

export async function protoGetUploadUrl(payload: {
  filename: string;
  mimeType: string;
  size: number;
  organizationId?: string;
}) {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedStorageClient();
      const request = create(GetUploadUrlRequestSchema as unknown as DescMessage, {
        filename: payload.filename,
        mimeType: payload.mimeType,
        size: BigInt(payload.size),
        organizationId: payload.organizationId,
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as Record<string, RpcMethod>).getUploadUrl(request as unknown);
    });
    return { success: true as const, response };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : 'GetUploadUrl failed' };
  }
}

export async function protoRegisterUpload(payload: {
  fileId: string;
  filename: string;
  mimeType: string;
  size: number;
  organizationId?: string;
}) {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedStorageClient();
      const request = create(RegisterUploadRequestSchema as unknown as DescMessage, {
        fileId: payload.fileId,
        filename: payload.filename,
        mimeType: payload.mimeType,
        size: BigInt(payload.size),
        organizationId: payload.organizationId,
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as Record<string, RpcMethod>).registerUpload(request as unknown);
    });
    return { success: true as const, response };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : 'RegisterUpload failed' };
  }
}

export async function protoGetDownloadUrl(payload: { fileId: string }) {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedStorageClient();
      const request = create(GetDownloadUrlRequestSchema as unknown as DescMessage, {
        fileId: payload.fileId,
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as Record<string, RpcMethod>).getDownloadUrl(request as unknown);
    });
    return { success: true as const, response };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : 'GetDownloadUrl failed' };
  }
}
