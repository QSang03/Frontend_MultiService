import { NextRequest, NextResponse } from 'next/server';
import { 
  protoAdminListServiceProviderRequests, 
  protoAdminReviewServiceProviderRequest 
} from '@/lib/proto/admin-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || undefined;
    const pageSize = Number(searchParams.get('pageSize')) || 50;
    const pageToken = searchParams.get('pageToken') || undefined;

    const result = await protoAdminListServiceProviderRequests({
      statusFilter: statusFilter && statusFilter !== 'ALL' ? statusFilter : undefined,
      pageSize,
      pageToken,
    });

    if (!result.success || !result.response) {
      if (result.error === 'SESSION_EXPIRED') {
        return NextResponse.json({ error: 'Session expired' }, { status: 401 });
      }
      return NextResponse.json({ requests: [], error: result.error || 'Failed to list requests' });
    }

    const requests = (result.response.requests || []).map((req) => {
      let createdDate = '—';
      if (req.createdAt) {
        const sec = Number((req.createdAt as unknown as Record<string, unknown>).seconds ?? 0);
        if (sec) {
          createdDate = new Date(sec * 1000).toLocaleDateString('vi-VN');
        }
      }

      return {
        id: req.id,
        userId: req.userId,
        companyName: req.companyName,
        requestedPlanId: req.requestedPlanId,
        website: req.website || '',
        description: req.description || '',
        status: req.status || 'PENDING',
        adminNotes: req.adminNotes || '',
        createdAt: createdDate,
      };
    });

    return NextResponse.json({
      success: true,
      requests,
      nextPageToken: result.response.nextPageToken || null,
    });
  } catch (error) {
    console.error('[SP Requests API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, approved, adminNotes } = body;

    if (!requestId || typeof approved !== 'boolean') {
      return NextResponse.json({ error: 'requestId and approved boolean are required' }, { status: 400 });
    }

    const result = await protoAdminReviewServiceProviderRequest({
      requestId,
      approved,
      adminNotes: adminNotes ? String(adminNotes) : undefined,
    });

    if (!result.success || !result.response) {
      return NextResponse.json({ error: result.error || 'Review request failed' }, { status: 400 });
    }

    return NextResponse.json({
      success: result.response.success,
      message: result.response.message || (approved ? 'Đã phê duyệt đối tác thành công' : 'Đã từ chối hồ sơ đối tác'),
    });
  } catch (error) {
    console.error('[SP Requests API] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
