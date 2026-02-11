import Link from 'next/link';
import { Card, CardHeader, CardBody, Button } from '@/components/ui';
import { APP_NAME } from '@/constants';
import ResetPasswordForm from '@/components/forms/ResetPasswordForm';

type Props = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  const resolvedSearchParams = (searchParams && typeof (searchParams as { then?: unknown })?.then === 'function')
    ? await (searchParams as unknown as Promise<Props['searchParams']>)
    : searchParams;

  const tokenParam = Array.isArray(resolvedSearchParams?.token)
    ? resolvedSearchParams?.token[0]
    : (resolvedSearchParams?.token as string | undefined);

  const token = tokenParam ?? null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card variant="elevated" className="w-full max-w-md">
        <CardHeader className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">{APP_NAME}</h1>
          <p className="mt-2 text-gray-600">Đặt lại mật khẩu</p>
        </CardHeader>
        <CardBody>
          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-700 mb-4">Không tìm thấy token đặt lại mật khẩu.</p>
              <Link href="/forgot-password">
                <Button variant="primary" className="w-full">Yêu cầu link mới</Button>
              </Link>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
