import React, { Suspense } from 'react';
import VerifyMfaClient from './VerifyMfaClient';

export const metadata = {
  title: 'Verify MFA',
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyMfaClient />
    </Suspense>
  );
}
