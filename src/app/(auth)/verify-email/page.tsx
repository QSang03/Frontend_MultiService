import Link from 'next/link';
import { Card, CardHeader, CardBody, Button } from '@/components/ui';
import { APP_NAME } from '@/constants';
import { verifyEmail } from '@/app/actions/verify-email';

type Props = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function VerifyEmailPage({ searchParams }: Props) {
  // `searchParams` may be a Promise in some Next.js runtimes — unwrap if needed
  const resolvedSearchParams = (searchParams && typeof (searchParams as { then?: unknown })?.then === 'function')
    ? await (searchParams as unknown as Promise<Props['searchParams']>)
    : searchParams;

  const tokenParam = Array.isArray(resolvedSearchParams?.token)
    ? resolvedSearchParams?.token[0]
    : (resolvedSearchParams?.token as string | undefined);

  const token = tokenParam ?? null;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card variant="elevated" className="w-full max-w-md">
          <CardHeader className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">{APP_NAME}</h1>
            <p className="mt-2 text-gray-600">Xác thực Email</p>
          </CardHeader>
          <CardBody>
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-yellow-600 mb-2">Thiếu token</h2>
              <p className="text-gray-600 mb-6">Không tìm thấy token xác thực trong URL</p>
              <Link href="/login">
                <Button variant="primary" className="w-full">
                  Về trang đăng nhập
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const result = await verifyEmail(token);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card variant="elevated" className="w-full max-w-md">
        <CardHeader className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">{APP_NAME}</h1>
          <p className="mt-2 text-gray-600">Xác thực Email</p>
        </CardHeader>
        <CardBody>
          {result.success ? (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-green-600 mb-2">Xác thực thành công!</h2>
              <p className="text-gray-600 mb-6">{result.message || 'Email đã được xác thực thành công!'}</p>
              <Link href="/login">
                <Button variant="primary" className="w-full">
                  Đăng nhập ngay
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-red-600 mb-2">Xác thực thất bại</h2>
              <p className="text-gray-600 mb-6">{result.error || 'Xác thực email thất bại'}</p>
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  Link xác thực có thể đã hết hạn hoặc không hợp lệ. Vui lòng thử đăng ký lại hoặc liên hệ hỗ trợ.
                </p>
                <Link href="/register">
                  <Button variant="outline" className="w-full">
                    Đăng ký lại
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
