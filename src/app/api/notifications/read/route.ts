import { NextResponse } from 'next/server';
import { protoMarkNotificationAsRead } from '@/lib/proto/notification-client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { notificationId } = body;

    if (!notificationId || typeof notificationId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'notificationId is required' },
        { status: 400 }
      );
    }

    const result = await protoMarkNotificationAsRead(notificationId);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to mark notification as read' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.response,
    });
  } catch (err) {
    console.error('Mark notification as read error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
