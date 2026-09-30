import 'server-only';
import { createClient } from '@connectrpc/connect';
import { createGrpcTransport } from '@connectrpc/connect-node';
import { create } from '@bufbuild/protobuf';
import type { DescService, DescMessage } from '@bufbuild/protobuf';
import { getAccessToken, deleteSession } from '@/lib/auth/session';
import { refreshTokens } from '@/lib/auth/refresh';

import * as kbProto from '@buf/nkc_multiservice.bufbuild_es/multiservice/service/v1/knowledge_base_pb.js';

async function loadKbModule(): Promise<Record<string, unknown>> {
  return kbProto as unknown as Record<string, unknown>;
}

const BACKEND_URL =
  process.env.BACKEND_GRPC_URL ||
  process.env.NEXT_PUBLIC_BACKEND_PROTO_URL ||
  process.env.BACKEND_URL ||
  'http://192.168.117.217:28500';

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

async function createAuthenticatedKbClient() {
  const mod = await loadKbModule();
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

  return createClient(mod.KnowledgeBaseService as unknown as DescService, authTransport) as unknown;
}

export const CATEGORY_MAP_TO_PROTO: Record<string, number> = {
  PRINTERS: 1,
  NETWORK: 2,
  SOFTWARE: 3,
  OS: 4,
  HARDWARE: 5,
};

export const CATEGORY_PROTO_TO_STR: Record<number, 'PRINTERS' | 'NETWORK' | 'SOFTWARE' | 'OS' | 'HARDWARE'> = {
  1: 'PRINTERS',
  2: 'NETWORK',
  3: 'SOFTWARE',
  4: 'OS',
  5: 'HARDWARE',
};

export async function protoListKbArticles(payload?: {
  pageSize?: number;
  pageToken?: string;
  searchTerm?: string;
  category?: number;
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  const mod = await loadKbModule();
  if (!mod) {
    return { success: false, error: 'KnowledgeBaseService proto module not yet available.' };
  }

  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedKbClient();
      const request = create(mod.ListKbArticlesRequestSchema as unknown as DescMessage, {
        pageSize: payload?.pageSize ?? 50,
        pageToken: payload?.pageToken ?? '',
        searchTerm: payload?.searchTerm || undefined,
        category: payload?.category && payload.category > 0 ? payload.category : undefined,
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).listKbArticles(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'List KB articles failed';
    return { success: false, error: message };
  }
}

export async function protoGetKbArticle(articleId: string): Promise<{
  success: boolean;
  response?: unknown;
  error?: string;
}> {
  const mod = await loadKbModule();
  if (!mod) {
    return { success: false, error: 'KnowledgeBaseService proto module not yet available.' };
  }

  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedKbClient();
      const request = create(mod.GetKbArticleRequestSchema as unknown as DescMessage, {
        articleId,
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).getKbArticle(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Get KB article failed';
    return { success: false, error: message };
  }
}

export async function protoCreateKbArticle(payload: {
  title: string;
  content: string;
  category: number;
  deviceTags?: string[];
}): Promise<{ success: boolean; response?: unknown; error?: string }> {
  const mod = await loadKbModule();
  if (!mod) {
    return { success: false, error: 'KnowledgeBaseService proto module not yet available.' };
  }

  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedKbClient();
      const request = create(mod.CreateKbArticleRequestSchema as unknown as DescMessage, {
        title: payload.title,
        content: payload.content,
        category: payload.category,
        deviceTags: payload.deviceTags || [],
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).createKbArticle(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Create KB article failed';
    return { success: false, error: message };
  }
}

export async function protoLikeKbArticle(articleId: string): Promise<{
  success: boolean;
  response?: unknown;
  error?: string;
}> {
  const mod = await loadKbModule();
  if (!mod) {
    return { success: false, error: 'KnowledgeBaseService proto module not yet available.' };
  }

  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedKbClient();
      const request = create(mod.LikeKbArticleRequestSchema as unknown as DescMessage, {
        articleId,
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as unknown as Record<string, RpcMethod>).likeKbArticle(request as unknown);
    });

    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Like KB article failed';
    return { success: false, error: message };
  }
}
