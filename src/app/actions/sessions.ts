'use server';

import { protoGetSessions, protoRevokeSession, protoRevokeOtherSessions } from '@/lib/proto/auth-client';

export interface Session {
  id: string;
  ip_address?: string;
  user_agent?: string;
  device_info?: string;
  last_active_at?: {
    seconds: string;
    nanos: number;
  };
  is_current: boolean;
}

export interface GetSessionsResult {
  success: boolean;
  sessions?: Session[];
  error?: string;
}

export interface RevokeSessionResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Get all user sessions
 */
export async function getSessions(): Promise<GetSessionsResult> {
  try {
    const result = await protoGetSessions();

    if (!result.success || !result.response) {
      return {
        success: false,
        error: result.error || 'Failed to get sessions',
      };
    }

    const sessions: Session[] = result.response.sessions.map((session) => ({
      id: session.id,
      ip_address: session.ipAddress,
      user_agent: session.userAgent,
      device_info: session.deviceInfo,
      last_active_at: session.lastActiveAt
        ? {
            seconds: session.lastActiveAt.seconds.toString(),
            nanos: session.lastActiveAt.nanos,
          }
        : undefined,
      is_current: session.isCurrent,
    }));

    return {
      success: true,
      sessions,
    };
  } catch (err) {
    console.error('[getSessions] Error:', err);
    const message = err instanceof Error ? err.message : 'Failed to get sessions';
    
    // Check for SESSION_EXPIRED
    if (message === 'SESSION_EXPIRED') {
      return { success: false, error: 'SESSION_EXPIRED' };
    }
    
    return { success: false, error: message };
  }
}

/**
 * Revoke a specific session
 */
export async function revokeSession(sessionId: string): Promise<RevokeSessionResult> {
  try {
    const result = await protoRevokeSession(sessionId);

    if (!result.success || !result.response) {
      return {
        success: false,
        error: result.error || 'Failed to revoke session',
      };
    }

    return {
      success: result.response.success,
      message: result.response.message,
    };
  } catch (err) {
    console.error('[revokeSession] Error:', err);
    const message = err instanceof Error ? err.message : 'Failed to revoke session';
    
    // Check for SESSION_EXPIRED
    if (message === 'SESSION_EXPIRED') {
      return { success: false, error: 'SESSION_EXPIRED' };
    }
    
    return { success: false, error: message };
  }
}

/**
 * Revoke all other sessions (keep current session)
 */
export async function revokeOtherSessions(): Promise<RevokeSessionResult> {
  try {
    const result = await protoRevokeOtherSessions();

    if (!result.success || !result.response) {
      return {
        success: false,
        error: result.error || 'Failed to revoke other sessions',
      };
    }

    return {
      success: result.response.success,
      message: result.response.message,
    };
  } catch (err) {
    console.error('[revokeOtherSessions] Error:', err);
    const message = err instanceof Error ? err.message : 'Failed to revoke other sessions';
    
    // Check for SESSION_EXPIRED
    if (message === 'SESSION_EXPIRED') {
      return { success: false, error: 'SESSION_EXPIRED' };
    }
    
    return { success: false, error: message };
  }
}
