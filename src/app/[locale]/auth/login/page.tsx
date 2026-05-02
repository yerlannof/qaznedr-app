'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { locale } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);

    if (!result.success) {
      setError(result.error || 'Ошибка входа');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-[#0A0A0A]">
      <div className="w-full max-w-md border border-gray-200 dark:border-gray-700 rounded-xl p-8 bg-white dark:bg-[#141414]">
        <h1 className="text-2xl font-semibold tracking-tight text-center text-gray-900 dark:text-gray-50">
          Войти
        </h1>
        <p className="mt-2 text-center text-sm text-gray-400">
          Нет аккаунта?{' '}
          <Link
            href={`/${locale}/auth/register`}
            className="text-[#0A84FF] hover:underline font-medium"
          >
            Зарегистрироваться
          </Link>
        </p>

        <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-xs font-medium uppercase tracking-wider text-gray-400"
            >
              Электронная почта
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-50 bg-white dark:bg-[#0A0A0A] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent transition-colors"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-xs font-medium uppercase tracking-wider text-gray-400"
            >
              Пароль
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-50 bg-white dark:bg-[#0A0A0A] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent transition-colors"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900 rounded-lg font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white dark:bg-[#141414] px-2 text-gray-400">
              или
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            signIn('google', { callbackUrl: `/${locale}/dashboard` })
          }
          className="w-full py-2.5 px-4 border border-gray-200 dark:border-gray-700 rounded-lg font-medium text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Продолжить с Google
        </button>
      </div>
    </div>
  );
}
