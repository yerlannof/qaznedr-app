'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Pencil, List, Shield, Eye } from 'lucide-react';
import NavigationSimple from '@/components/layouts/NavigationSimple';
import { useTranslation } from '@/hooks/useTranslation';

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
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 animate-pulse">
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavigationSimple />

      <div className="pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Добро пожаловать, {userName}
            </h1>

            {loading ? (
              <div className="mt-2 h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : (
              <span className="mt-2 inline-block bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-sm">
                {profileTypeLabel(profile?.profile_type)}
              </span>
            )}
          </div>

          {/* Profile completion */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Заполненность профиля
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {loading ? '...' : `${filledCount} / ${totalFields}`}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: loading ? '0%' : `${progressPct}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {loading ? '' : `${progressPct}% заполнено`}
            </p>
          </div>

          {/* Quick actions */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Edit profile */}
              <Link
                href={`/${locale}/dashboard/profile`}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-all group"
              >
                <Pencil className="w-6 h-6 text-blue-600 mb-3" />
                <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                  Редактировать профиль
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Обновите свои данные
                </p>
              </Link>

              {/* My listings */}
              <Link
                href={`/${locale}/dashboard/my-listings`}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-all group"
              >
                <List className="w-6 h-6 text-blue-600 mb-3" />
                <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                  Мои объявления
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Управляйте объявлениями
                </p>
              </Link>

              {/* Verification */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-all">
                <Shield className="w-6 h-6 text-blue-600 mb-3" />
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Верификация
                </h3>
                <p className="text-sm mt-1">
                  {profile?.is_verified ? (
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      Подтверждено
                    </span>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">
                      Не подтверждено
                    </span>
                  )}
                </p>
              </div>

              {/* Contacts viewed */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-all">
                <Eye className="w-6 h-6 text-blue-600 mb-3" />
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Просмотры контактов
                </h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {profile?.contacts_viewed_count ?? 0}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
