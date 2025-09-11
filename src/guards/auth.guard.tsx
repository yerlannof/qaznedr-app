'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ROUTES } from '@/constants';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export function AuthGuard({
  children,
  requireAuth = true,
  redirectTo = ROUTES.LOGIN,
}: AuthGuardProps) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (requireAuth && status === 'unauthenticated') {
      router.push(redirectTo);
    }
  }, [status, requireAuth, redirectTo, router]);

  if (requireAuth && status === 'loading') {
    return <div>Loading...</div>;
  }

  if (requireAuth && status === 'unauthenticated') {
    return null;
  }

  return <>{children}</>;
}
