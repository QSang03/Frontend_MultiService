import 'server-only';
import { createClient } from '@connectrpc/connect';
import { createGrpcTransport } from '@connectrpc/connect-node';
import { create } from '@bufbuild/protobuf';
import type { DescService, DescMessage } from '@bufbuild/protobuf';
import { getAccessToken, deleteSession } from '@/lib/auth/session';
import { refreshTokens } from '@/lib/auth/refresh';

let assetModuleCache: Record<string, unknown> | null = null;
let moduleLoadAttempted = false;

async function loadAssetModule(): Promise<Record<string, unknown> | null> {
  if (moduleLoadAttempted) return assetModuleCache;

  moduleLoadAttempted = true;
  try {
    const mod = await import('@buf/nkc_multiservice.bufbuild_es/multiservice/service/v1/asset_pb.js');
    assetModuleCache = mod as unknown as Record<string, unknown>;
    return assetModuleCache;
  } catch {
    return null;
  }
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_PROTO_URL ||
  process.env.BACKEND_GRPC_URL ||
  process.env.BACKEND_URL ||
  'http://192.168.117.66:3000';

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
      const refreshed = await refreshTokens();
      if (refreshed) {
        return executeWithRefresh(operation, false);
      }

      try {
        await deleteSession();
      } catch {
        // noop
      }
      throw new Error('SESSION_EXPIRED');
    }

    throw err;
  }
}

async function createAuthenticatedAssetClient() {
  const mod = await loadAssetModule();
  if (!mod) {
    throw new Error('PROTO_MODULE_NOT_AVAILABLE');
  }

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

  return createClient(mod.AssetService as unknown as DescService, authTransport) as unknown;
}

export async function protoListAssets(payload: {
  orgId: string;
  pageSize?: number;
  pageToken?: string;
  search?: string;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  const mod = await loadAssetModule();
  if (!mod) {
    return { success: false, error: 'AssetService proto module not yet available. Please sync protos from backend.' };
  }

  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedAssetClient();
      const request = create(mod.ListAssetsRequestSchema as unknown as DescMessage, {
        orgId: payload.orgId,
        pageSize: payload.pageSize ?? 20,
        pageToken: payload.pageToken ?? '',
        search: payload.search ?? '',
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).listAssets(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'List assets failed';
    return { success: false, error: message };
  }
}
