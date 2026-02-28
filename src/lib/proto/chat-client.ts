import 'server-only';
import { createClient } from '@connectrpc/connect';
import { createGrpcTransport } from '@connectrpc/connect-node';
import { create } from '@bufbuild/protobuf';
import type { DescMessage } from '@bufbuild/protobuf';
import { getAccessToken, deleteSession } from '@/lib/auth/session';
import { refreshTokens } from '@/lib/auth/refresh';
import {
  ChatService,
  CreateOrGetDirectRoomRequestSchema,
  GetTicketRoomRequestSchema,
  ListChatRoomsRequestSchema,
  GetChatMessagesRequestSchema,
  SendMessageRequestSchema,
  MarkMessagesAsReadRequestSchema,
  ReactToMessageRequestSchema,
  StreamMessagesRequestSchema,
  MessageType,
} from '@buf/nkc_multiservice.bufbuild_es/multiservice/service/v1/chat_pb.js';

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

async function createAuthenticatedChatClient() {
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

  return createClient(ChatService, transport) as unknown;
}

function mapMessageType(value: unknown): MessageType {
  if (typeof value === 'number') {
    return value as MessageType;
  }
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'image') return MessageType.IMAGE;
  if (normalized === 'file') return MessageType.FILE;
  if (normalized === 'system') return MessageType.SYSTEM;
  if (normalized === 'sticker') return MessageType.STICKER;
  return MessageType.TEXT;
}

export async function protoGetTicketRoom(payload: { ticketId: string }) {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedChatClient();
      const request = create(GetTicketRoomRequestSchema as unknown as DescMessage, {
        ticketId: payload.ticketId,
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as Record<string, RpcMethod>).getTicketRoom(request as unknown);
    });
    return { success: true as const, response };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : 'GetTicketRoom failed' };
  }
}

export async function protoGetChatMessages(payload: { roomId: string; pageSize?: number; pageToken?: string }) {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedChatClient();
      const request = create(GetChatMessagesRequestSchema as unknown as DescMessage, {
        roomId: payload.roomId,
        pageSize: payload.pageSize ?? 50,
        pageToken: payload.pageToken ?? '',
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as Record<string, RpcMethod>).getChatMessages(request as unknown);
    });
    return { success: true as const, response };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : 'GetChatMessages failed' };
  }
}

export async function protoSendMessage(payload: { roomId: string; messageType?: unknown; content: string; metadata?: string }) {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedChatClient();
      const request = create(SendMessageRequestSchema as unknown as DescMessage, {
        roomId: payload.roomId,
        messageType: mapMessageType(payload.messageType),
        content: payload.content,
        metadata: payload.metadata ?? '',
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as Record<string, RpcMethod>).sendMessage(request as unknown);
    });
    return { success: true as const, response };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : 'SendMessage failed' };
  }
}

export async function protoMarkMessagesAsRead(payload: { roomId: string }) {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedChatClient();
      const request = create(MarkMessagesAsReadRequestSchema as unknown as DescMessage, {
        roomId: payload.roomId,
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as Record<string, RpcMethod>).markMessagesAsRead(request as unknown);
    });
    return { success: true as const, response };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : 'MarkMessagesAsRead failed' };
  }
}

export async function protoListChatRooms(payload?: { pageSize?: number; pageToken?: string }) {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedChatClient();
      const request = create(ListChatRoomsRequestSchema as unknown as DescMessage, {
        pageSize: payload?.pageSize ?? 50,
        pageToken: payload?.pageToken ?? '',
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as Record<string, RpcMethod>).listChatRooms(request as unknown);
    });
    return { success: true as const, response };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : 'ListChatRooms failed' };
  }
}

export async function protoCreateOrGetDirectRoom(payload: { otherUserId: string }) {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedChatClient();
      const request = create(CreateOrGetDirectRoomRequestSchema as unknown as DescMessage, {
        otherUserId: payload.otherUserId,
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as Record<string, RpcMethod>).createOrGetDirectRoom(request as unknown);
    });
    return { success: true as const, response };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : 'CreateOrGetDirectRoom failed' };
  }
}

export async function protoReactToMessage(payload: { roomId: string; messageId: string; reaction: string }) {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedChatClient();
      const request = create(ReactToMessageRequestSchema as unknown as DescMessage, {
        roomId: payload.roomId,
        messageId: payload.messageId,
        reaction: payload.reaction,
      });
      type RpcMethod = (req: unknown) => Promise<unknown>;
      return await (client as Record<string, RpcMethod>).reactToMessage(request as unknown);
    });
    return { success: true as const, response };
  } catch (err) {
    return { success: false as const, error: err instanceof Error ? err.message : 'ReactToMessage failed' };
  }
}

export async function protoStreamMessages(): Promise<{ success: true; stream: AsyncIterable<unknown> } | { success: false; error: string }> {
  try {
    const client = await createAuthenticatedChatClient();
    const request = create(StreamMessagesRequestSchema as unknown as DescMessage, {});
    type RpcMethod = (req: unknown) => AsyncIterable<unknown>;
    const stream = (client as Record<string, RpcMethod>).streamMessages(request as unknown);
    return { success: true, stream };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'StreamMessages failed' };
  }
}
