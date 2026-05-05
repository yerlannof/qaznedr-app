'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/layouts/Navigation';
import { useTranslation } from '@/hooks/useTranslation';
import {
  ShieldCheck,
  FileText,
  Users,
  Crown,
  Plus,
  TrendingUp,
  Clock,
} from 'lucide-react';

type Role = 'user' | 'admin' | 'super_admin';

interface Stats {
  pendingListings: number;
  activeListings: number;
  totalListings: number;
  totalUsers: number;
  adminCount: number;
}

export default function AdminHome() {
  const { locale } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(async (res) => {
        if (res.status === 403 || res.status === 401) {
          setForbidden(true);
          return null;
        }
        return res.json();
      })
      .then((json) => {
        if (!json) return;
        if (json.success) {
          setStats(json.data);
          setRole(json.role);
        }
      })
      .catch(() => {});
  }, []);

  if (forbidden) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A]">
        <Navigation />
        <div className="pt-32 text-center px-4">
          <ShieldCheck className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
            Доступ запрещён
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            У вас нет прав администратора.
          </p>
          <Link
            href={`/${locale}`}
            className="inline-block mt-6 px-5 py-2 bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900 rounded-lg text-sm font-medium"
          >
            На главную
          </Link>
        </div>
      </div>
    );
  }

  const isSuperAdmin = role === 'super_admin';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A]">
      <Navigation />
      <div className="pt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
                Админ-панель
              </h1>
              <div className="mt-2">
                {role && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      isSuperAdmin
                        ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                        : 'bg-[#0A84FF]/10 text-[#0A84FF]'
                    }`}
                  >
                    {isSuperAdmin ? (
                      <Crown className="w-3 h-3" />
                    ) : (
                      <ShieldCheck className="w-3 h-3" />
                    )}
                    {isSuperAdmin ? 'Super Admin' : 'Admin'}
                  </span>
                )}
              </div>
            </div>
            <Link
              href={`/${locale}/admin/listings/new`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900 rounded-lg font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-200"
            >
              <Plus className="w-4 h-4" />
              Создать объявление
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <StatCard
              label="На модерации"
              value={stats?.pendingListings}
              icon={Clock}
              accent
            />
            <StatCard
              label="Опубликовано"
              value={stats?.activeListings}
              icon={TrendingUp}
            />
            <StatCard
              label="Всего объявлений"
              value={stats?.totalListings}
              icon={FileText}
            />
            <StatCard
              label="Пользователей"
              value={stats?.totalUsers}
              icon={Users}
            />
          </div>

          {/* Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SectionTile
              href={`/${locale}/admin/listings`}
              title="Объявления"
              description="Модерация, редактирование, удаление, featured / verified"
              icon={FileText}
              badge={
                stats?.pendingListings
                  ? `${stats.pendingListings} на проверке`
                  : undefined
              }
            />

            <SectionTile
              href={`/${locale}/admin/users`}
              title="Пользователи"
              description={
                isSuperAdmin
                  ? 'Управление ролями (admin / super_admin) и верификацией'
                  : 'Просмотр и верификация'
              }
              icon={Users}
              badge={isSuperAdmin ? 'Super Admin only' : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | undefined;
  icon: any;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#141414] p-4">
      <div className="flex items-center gap-2">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            accent
              ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
              : 'bg-[#0A84FF]/10 text-[#0A84FF]'
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-3 text-2xl font-semibold text-gray-900 dark:text-gray-50">
        {value ?? '—'}
      </div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function SectionTile({
  href,
  title,
  description,
  icon: Icon,
  badge,
}: {
  href: string;
  title: string;
  description: string;
  icon: any;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#141414] hover:border-gray-900 dark:hover:border-gray-50 hover:shadow-medium transition-all"
    >
      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-300 group-hover:bg-gray-900 dark:group-hover:bg-gray-50 group-hover:text-white dark:group-hover:text-gray-900 transition-colors shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
            {title}
          </h3>
          {badge && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
    </Link>
  );
}
