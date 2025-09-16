'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

export function useAuth() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  // Extract current locale from pathname
  const getCurrentLocale = () => {
    const segments = pathname.split('/');
    const locale = segments[1];
    return ['ru', 'kz', 'en', 'zh'].includes(locale) ? locale : 'ru';
  };
  
  const locale = getCurrentLocale();

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          throw new Error(result.error);
        }

        router.push(`/${locale}/dashboard`);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Login failed',
        };
      }
    },
    [router, locale]
  );

  const logout = useCallback(async () => {
    await signOut({ redirect: false });
    router.push(`/${locale}`);
  }, [router, locale]);

  const register = useCallback(
    async (email: string, password: string, name?: string) => {
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Registration failed');
        }

        // Auto-login after registration
        await login(email, password);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Registration failed',
        };
      }
    },
    [login]
  );

  return {
    user: session?.user,
    isAuthenticated: !!session,
    isLoading: status === 'loading',
    login,
    logout,
    register,
    update,
  };
}
