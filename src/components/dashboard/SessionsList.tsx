'use client';

import { useState, useEffect } from 'react';
import { getSessions, revokeSession, revokeOtherSessions, type Session } from '@/app/actions/sessions';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

function formatLastActive(lastActiveAt?: { seconds: string; nanos: number }): string {
  if (!lastActiveAt) return 'Never';

  const timestamp = parseInt(lastActiveAt.seconds) * 1000;
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} ngày trước`;
  if (hours > 0) return `${hours} giờ trước`;
  if (minutes > 0) return `${minutes} phút trước`;
  return `${seconds} giây trước`;
}

function parseUserAgent(userAgent?: string): { browser?: string; os?: string } {
  if (!userAgent) return {};

  // Basic parsing for common browsers
  let browser = 'Unknown';
  let os = 'Unknown';

  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  else if (userAgent.includes('connect-es')) browser = 'API Client';

  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';

  return { browser, os };
}

export function SessionsList() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const loadSessions = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getSessions();

      if (!result.success) {
        // Check for session expiration
        if (result.error === 'SESSION_EXPIRED') {
          window.location.href = '/login';
          return;
        }
        setError(result.error || 'Failed to load sessions');
        return;
      }

      setSessions(result.sessions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm('Bạn có chắc chắn muốn thu hồi phiên đăng nhập này?')) {
      return;
    }

    setRevoking(sessionId);

    try {
      const result = await revokeSession(sessionId);

      if (!result.success) {
        // Check for session expiration
        if (result.error === 'SESSION_EXPIRED') {
          window.location.href = '/login';
          return;
        }
        alert(result.error || 'Failed to revoke session');
        return;
      }

      // Reload sessions after successful revoke
      await loadSessions();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to revoke session');
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeOtherSessions = async () => {
    if (!confirm('Bạn có chắc chắn muốn thu hồi TẤT CẢ các phiên đăng nhập khác?')) {
      return;
    }

    setRevoking('all');

    try {
      const result = await revokeOtherSessions();

      if (!result.success) {
        // Check for session expiration
        if (result.error === 'SESSION_EXPIRED') {
          window.location.href = '/login';
          return;
        }
        alert(result.error || 'Failed to revoke other sessions');
        return;
      }

      // Reload sessions after successful revoke
      await loadSessions();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to revoke other sessions');
    } finally {
      setRevoking(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Phiên Đăng Nhập</h2>
        </div>
        <Card>
          <div className="p-6 text-center text-gray-500">Đang tải...</div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Phiên Đăng Nhập</h2>
        </div>
        <Card>
          <div className="p-6 text-center text-red-500">{error}</div>
          <div className="p-6 pt-0 text-center">
            <Button onClick={loadSessions}>Thử lại</Button>
          </div>
        </Card>
      </div>
    );
  }

  const otherSessionsCount = sessions.filter((s) => !s.is_current).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Phiên Đăng Nhập</h2>
        {otherSessionsCount > 0 && (
          <Button
            onClick={handleRevokeOtherSessions}
            disabled={revoking === 'all'}
            variant="secondary"
          >
            {revoking === 'all' ? 'Đang thu hồi...' : `Thu hồi ${otherSessionsCount} phiên khác`}
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {sessions.map((session) => {
          const { browser, os } = parseUserAgent(session.user_agent);
          const deviceInfo = session.device_info || `${browser} trên ${os}`;
          const lastActive = formatLastActive(session.last_active_at);

          return (
            <Card key={session.id}>
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{deviceInfo}</h3>
                      {session.is_current && (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                          Phiên hiện tại
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      {session.ip_address && (
                        <p>
                          <span className="font-medium">IP:</span> {session.ip_address}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">Hoạt động lần cuối:</span> {lastActive}
                      </p>
                      {session.user_agent && session.user_agent !== 'connect-es/2.1.1' && (
                        <p className="text-xs text-gray-400 truncate max-w-md">
                          {session.user_agent}
                        </p>
                      )}
                    </div>
                  </div>

                  {!session.is_current && (
                    <Button
                      onClick={() => handleRevokeSession(session.id)}
                      disabled={revoking === session.id}
                      variant="secondary"
                      className="ml-4"
                    >
                      {revoking === session.id ? 'Đang thu hồi...' : 'Thu hồi'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {sessions.length === 0 && (
        <Card>
          <div className="p-6 text-center text-gray-500">Không có phiên đăng nhập nào</div>
        </Card>
      )}

      <div className="mt-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">💡 Mẹo bảo mật</p>
        <p>
          Nếu bạn thấy phiên đăng nhập không quen thuộc, hãy thu hồi ngay lập tức và đổi mật khẩu của bạn.
        </p>
      </div>
    </div>
  );
}
