import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { protoRegisterServiceProvider } from '@/lib/proto/auth-client';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng đăng nhập để nộp hồ sơ đối tác kỹ thuật.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { companyName, requestedPlanId, website, description } = body;

    if (!companyName || typeof companyName !== 'string' || !companyName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Tên công ty / tổ chức không được để trống.' },
        { status: 400 }
      );
    }

    const result = await protoRegisterServiceProvider({
      companyName: companyName.trim(),
      requestedPlanId: requestedPlanId || 'STANDARD',
      website: website?.trim() || '',
      description: description?.trim() || '',
    });

    if (!result.success || !result.response) {
      return NextResponse.json(
        { success: false, error: result.error || 'Đăng ký đối tác kỹ thuật thất bại.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Hồ sơ đối tác kỹ thuật đã được nộp thành công và đang chờ Ban Quản Trị thẩm định.',
      requestId: result.response.requestId,
      status: result.response.status,
    });
  } catch (err) {
    console.error('Service provider registration error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
