'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Pencil, List, Shield, Eye, CheckCircle, XCircle } from 'lucide-react';
import Navigation from '@/components/layouts/Navigation';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';
import OnboardingTour from '@/components/features/OnboardingTour';

interface Profile {
  profile_type?: string;
  full_name?: string;
  company_name?: string;
  phone?: string;
  city?: string;
  website?: string;
  description?: string;
  is_verified?: boolean;
  contacts_viewed_count?: number;
}

const PROFILE_FIELDS: (keyof Profile)[] = [
  'full_name',
  'company_name',
  'phone',
  'city',
  'website',
  'description',
];

function profileTypeLabel(type?: string): string {
  switch (type) {
    case 'subsoil_user':
      return 'Недропользователь';
    case 'service_provider':
      return 'Сервис-провайдер';
    case 'investor':
      return 'Инвестор';
    default:
      return 'Не указан';
  }
}

function SkeletonCard() {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#141414] p-6 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { locale } = useTranslation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setProfile(data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  const filledCount = PROFILE_FIELDS.filter(
    (f) => profile && profile[f]
  ).length;
  const totalFields = PROFILE_FIELDS.length;
  const progressPct = Math.round((filledCount / totalFields) * 100);

  const userName = session?.user?.name || profile?.full_name || 'Пользователь';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A]">
      <Navigation />
      <OnboardingTour />

      <div className="pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
              Привет, {userName}
            </h1>

            {loading ? (
              <div className="mt-2 h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : (
              <div className="mt-2">
                <Badge variant="blue">
                  {profileTypeLabel(profile?.profile_type)}
                </Badge>
              </div>
            )}
          </div>

          {/* Investor quick link */}
          {!loading && profile?.profile_type === 'investor' && (
            <Link
              href={`/${locale}/dashboard/investor`}
              className="group flex items-center justify-between gap-4 mb-6 p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#141414] hover:border-gray-900 dark:hover:border-gray-50 hover:shadow-medium transition-all"
            >
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-[#0A84FF]">
                  Кабинет инвестора
                </div>
                <div className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-50">
                  Watchlist, запросы и рекомендации
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Сохранённые проекты и история отправленных запросов в одном
                  месте.
                </p>
              </div>
              <span className="text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-50 transition-colors text-2xl">
                →
              </span>
            </Link>
          )}

          {/* Profile completion */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#141414] p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Заполненность профиля
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {loading ? '...' : `${filledCount} / ${totalFields}`}
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-900 dark:bg-gray-50 rounded-full transition-all duration-500"
                style={{ width: loading ? '0%' : `${progressPct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-400">
              {loading ? '' : `${progressPct}% заполнено`}
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Verification */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#141414] p-6">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Верификация
                </span>
              </div>
              {loading ? (
                <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ) : profile?.is_verified ? (
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-[#0A84FF]" />
                  <span className="text-sm font-medium text-[#0A84FF]">
                    Подтверждено
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Не подтверждено
                  </span>
                </div>
              )}
            </div>

            {/* Contacts viewed */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#141414] p-6">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Просмотры контактов
                </span>
              </div>
              {loading ? (
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ) : (
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                  {profile?.contacts_viewed_count ?? 0}
                </p>
              )}
            </div>
          </div>

          {/* Quick actions */}
          {loading ? (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <div className="space-y-3">
              <Link
                href={`/${locale}/dashboard/profile`}
                className="flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#141414] p-5 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Pencil className="w-4 h-4 text-gray-400 group-hover:text-[#0A84FF] transition-colors" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-50 group-hover:text-[#0A84FF] transition-colors">
                      Редактировать профиль
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Обновите свои данные
                    </p>
                  </div>
                </div>
                <span className="text-gray-300 dark:text-gray-600 group-hover:text-[#0A84FF] transition-colors">
                  →
                </span>
              </Link>

              <Link
                href={`/${locale}/dashboard/my-listings`}
                className="flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#141414] p-5 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3">
                  <List className="w-4 h-4 text-gray-400 group-hover:text-[#0A84FF] transition-colors" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-50 group-hover:text-[#0A84FF] transition-colors">
                      Мои объявления
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Управляйте объявлениями
                    </p>
                  </div>
                </div>
                <span className="text-gray-300 dark:text-gray-600 group-hover:text-[#0A84FF] transition-colors">
                  →
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
