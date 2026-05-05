'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Navigation from '@/components/layouts/Navigation';
import { useTranslation } from '@/hooks/useTranslation';
import {
  ShieldCheck,
  Crown,
  User as UserIcon,
  Search,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

type Role = 'user' | 'admin' | 'super_admin';

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  profile_type: string;
  role: Role;
  company_name: string | null;
  country: string | null;
  city: string | null;
  is_verified: boolean;
  is_trusted_seller: boolean;
  created_at: string;
}

const ROLE_LABEL: Record<Role, string> = {
  user: 'User',
  admin: 'Admin',
  super_admin: 'Super Admin',
};

const ROLE_PALETTE: Record<Role, string> = {
  user: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  admin: 'bg-[#0A84FF]/10 text-[#0A84FF]',
  super_admin:
    'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400',
};

const PROFILE_TYPE_LABELS: Record<string, string> = {
  subsoil_user: 'Недропользователь',
  service_provider: 'Сервис',
  investor: 'Инвестор',
};

export default function AdminUsersPage() {
  const { locale } = useTranslation();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.status === 403 || res.status === 401) {
        setForbidden(true);
        return;
      }
      const json = await res.json();
      if (json.success) {
        setUsers(json.data || []);
        setCurrentRole(json.currentRole || null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [u.full_name, u.email, u.company_name]
      .filter(Boolean)
      .some((s) => (s as string).toLowerCase().includes(q));
  });

  const updateUser = async (id: string, patch: Record<string, any>) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, ...json.data } : u))
        );
      } else {
        alert(json.error || 'Не удалось обновить');
      }
    } finally {
      setBusyId(null);
    }
  };

  if (forbidden) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A]">
        <Navigation />
        <div className="pt-32 text-center">
          <ShieldCheck className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
            Доступ запрещён
          </h1>
        </div>
      </div>
    );
  }

  const isSuperAdmin = currentRole === 'super_admin';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A]">
      <Navigation />
      <div className="pt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href={`/${locale}/admin`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-50 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />В админку
          </Link>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
                Пользователи
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {isSuperAdmin
                  ? 'Управление ролями и верификацией'
                  : 'Просмотр пользователей и верификация'}
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Всего: <span className="font-semibold">{users.length}</span>
            </div>
          </div>

          <div className="relative max-w-md mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по имени, email или компании"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-50 bg-white dark:bg-[#141414] focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent"
            />
          </div>

          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#141414] animate-pulse"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-10 text-center">
              <UserIcon className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-500">Никого не найдено</p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#141414] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    <tr>
                      <th className="px-4 py-3">Пользователь</th>
                      <th className="px-4 py-3">Тип</th>
                      <th className="px-4 py-3">Роль</th>
                      <th className="px-4 py-3">Verified</th>
                      <th className="px-4 py-3">Trusted</th>
                      <th className="px-4 py-3 text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filtered.map((u) => {
                      const isBusy = busyId === u.id;
                      const RoleIcon =
                        u.role === 'super_admin'
                          ? Crown
                          : u.role === 'admin'
                            ? ShieldCheck
                            : UserIcon;
                      return (
                        <tr
                          key={u.id}
                          className="text-gray-700 dark:text-gray-300"
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900 dark:text-gray-50">
                              {u.full_name || '—'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {u.email}
                            </div>
                            {u.company_name && (
                              <div className="text-xs text-gray-400 mt-0.5">
                                {u.company_name}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {PROFILE_TYPE_LABELS[u.profile_type] ||
                              u.profile_type}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_PALETTE[u.role]}`}
                            >
                              <RoleIcon className="w-3 h-3" />
                              {ROLE_LABEL[u.role]}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Toggle
                              checked={u.is_verified}
                              onChange={(v) =>
                                updateUser(u.id, { is_verified: v })
                              }
                              disabled={isBusy}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Toggle
                              checked={u.is_trusted_seller}
                              onChange={(v) =>
                                updateUser(u.id, { is_trusted_seller: v })
                              }
                              disabled={isBusy}
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isSuperAdmin ? (
                              <RoleSelector
                                currentRole={u.role}
                                disabled={isBusy}
                                onChange={(role) => updateUser(u.id, { role })}
                              />
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                            {isBusy && (
                              <Loader2 className="w-3 h-3 animate-spin inline-block ml-2 text-gray-400" />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!isSuperAdmin && (
            <p className="mt-6 text-xs text-gray-400 text-center">
              Изменение ролей доступно только super_admin
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex items-center w-9 h-5 rounded-full transition-colors disabled:opacity-50 ${
        checked ? 'bg-[#0A84FF]' : 'bg-gray-200 dark:bg-gray-700'
      }`}
    >
      <span
        className={`inline-block w-4 h-4 bg-white rounded-full transform transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

function RoleSelector({
  currentRole,
  onChange,
  disabled,
}: {
  currentRole: Role;
  onChange: (r: Role) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={currentRole}
      onChange={(e) => onChange(e.target.value as Role)}
      disabled={disabled}
      className="px-2 py-1 rounded-md text-xs border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0A0A0A] text-gray-700 dark:text-gray-300 disabled:opacity-50"
    >
      <option value="user">User</option>
      <option value="admin">Admin</option>
      <option value="super_admin">Super Admin</option>
    </select>
  );
}
