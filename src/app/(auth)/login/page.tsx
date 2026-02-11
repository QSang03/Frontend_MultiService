import { redirect } from 'next/navigation';
import LoginFormClient from '@/components/forms/LoginFormClient';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;

  if (params?.token) {
    redirect(`/verify-email?token=${encodeURIComponent(params.token)}`);
  }

  return <LoginFormClient />;
}
