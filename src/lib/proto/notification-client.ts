import 'server-only';
import { createClient } from '@connectrpc/connect';
import { createGrpcTransport } from '@connectrpc/connect-node';
import { create } from '@bufbuild/protobuf';
import { getAccessToken, deleteSession } from '@/lib/auth/session';
import { refreshTokens } from '@/lib/auth/refresh';
import {
  NotificationService,
  StreamNotificationsRequestSchema,
  MarkAsReadRequestSchema,
  type Notification,
  type MarkAsReadResponse,
} from '@buf/nkc_multiservice.bufbuild_es/multiservice/service/v1/notification_pb.js';

const BACKEND_URL =
  process.env.BACKEND_GRPC_URL ||
  process.env.NEXT_PUBLIC_BACKEND_PROTO_URL ||
  process.env.BACKEND_URL ||
  'http://192.168.117.217:28500';

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

export async function createAuthenticatedNotificationClient() {
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

  return createClient(NotificationService, transport);
}

export async function protoMarkNotificationAsRead(notificationId: string): Promise<{
  success: boolean;
  response?: MarkAsReadResponse;
  error?: string;
}> {
  try {
    const response = await executeWithRefresh(async () => {
      const client = await createAuthenticatedNotificationClient();
      const request = create(MarkAsReadRequestSchema, { notificationId });
      return await client.markAsRead(request);
    });
    return { success: true, response };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Mark notification as read failed';
    return { success: false, error: message };
  }
}

export async function* protoStreamNotifications(signal?: AbortSignal): AsyncIterable<Notification> {
  const client = await createAuthenticatedNotificationClient();
  const request = create(StreamNotificationsRequestSchema, {});
  
  const stream = client.streamNotifications(request, { signal });
  for await (const res of stream) {
    if (res.notification) {
      yield res.notification;
    }
  }
}
