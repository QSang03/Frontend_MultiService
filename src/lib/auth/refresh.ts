import 'server-only';
import { createClient } from '@connectrpc/connect';
import { createGrpcTransport } from '@connectrpc/connect-node';
import { create } from '@bufbuild/protobuf';
import { getRefreshToken, updateTokens } from './session';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_PROTO_URL ||
  process.env.BACKEND_GRPC_URL ||
  process.env.BACKEND_URL ||
  'http://192.168.117.18:3000';

const transport = createGrpcTransport({ baseUrl: BACKEND_URL });

// ============================================================================
// Mutex/Lock để tránh race condition khi nhiều request cùng refresh token
// Vấn đề: Backend sử dụng Refresh Token Rotation (revoke token cũ sau khi dùng)
// Nếu 2 request cùng gọi refresh với token cũ, request thứ 2 sẽ fail vì token đã bị revoke
// ============================================================================
let refreshPromise: Promise<boolean> | null = null;
let lastRefreshTime = 0;
const REFRESH_DEBOUNCE_MS = 1000; // Không refresh lại trong vòng 1 giây

export async function refreshTokens(): Promise<boolean> {
  const now = Date.now();
  
  // Nếu vừa refresh xong trong vòng 1 giây, return true (giả định token mới còn valid)
  if (now - lastRefreshTime < REFRESH_DEBOUNCE_MS) {
    console.log('[auth.refreshTokens] Recently refreshed, skipping duplicate refresh');
    return true;
  }

  // Nếu đang có refresh operation đang chạy, đợi kết quả của nó
  if (refreshPromise) {
    console.log('[auth.refreshTokens] Refresh already in progress, waiting...');
    return refreshPromise;
  }

  // Bắt đầu refresh operation mới
  refreshPromise = doRefreshTokens();
  
  try {
    const result = await refreshPromise;
    if (result) {
      lastRefreshTime = Date.now();
    }
    return result;
  } finally {
    // Clear promise để cho phép refresh tiếp theo
    refreshPromise = null;
  }
}

async function doRefreshTokens(): Promise<boolean> {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      console.log('[auth.refreshTokens] No refresh token found in cookies');
      return false;
    }

    console.log('[auth.refreshTokens] Starting refresh...');

    const { AuthService, RefreshTokenRequestSchema } = await import(
      '@buf/nkc_multiservice.bufbuild_es/multiservice/auth/v1/auth_pb.js'
    );

    const authClient = createClient(AuthService, transport);
    const request = create(RefreshTokenRequestSchema, { refreshToken });
    const response = await authClient.refreshToken(request);

    if (response.tokens) {
      // Update both access + refresh tokens atomically
      await updateTokens(response.tokens.accessToken, response.tokens.refreshToken);
      console.log('[auth.refreshTokens] Refresh successful, tokens updated');
      return true;
    }

    console.log('[auth.refreshTokens] No tokens in response');
    return false;
  } catch (err) {
    console.error('[auth.refreshTokens] Error:', err);
    return false;
  }
}
