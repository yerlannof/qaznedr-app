'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/layouts/Navigation';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Shield,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Pencil,
  Trash2,
  Star,
  EyeOff,
  RotateCcw,
  Plus,
  Tag,
} from 'lucide-react';

type StatusTab =
  | 'ALL'
  | 'PENDING_MODERATION'
  | 'ACTIVE'
  | 'REJECTED'
  | 'SOLD'
  | 'DRAFT'
  | 'DELETED';

interface Listing {
  id: string;
  title: string;
  description: string;
  type: string;
  mineral: string;
  region: string;
  price: number | null;
  area: number | null;
  status: string;
  verified: boolean;
  featured: boolean;
  views: number;
  created_at: string;
  user_id: string;
  owner_name: string;
}

const TABS: Array<{ key: StatusTab; label: string }> = [
  { key: 'ALL', label: 'Все' },
  { key: 'PENDING_MODERATION', label: 'На проверке' },
  { key: 'ACTIVE', label: 'Опубликованные' },
  { key: 'REJECTED', label: 'Отклонённые' },
  { key: 'SOLD', label: 'Проданные' },
  { key: 'DRAFT', label: 'Черновики' },
  { key: 'DELETED', label: 'Удалённые' },
];

const TYPE_LABELS: Record<string, string> = {
  MINING_LICENSE: 'Добыча',
  EXPLORATION_LICENSE: 'Разведка',
  MINERAL_OCCURRENCE: 'Проявление',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_MODERATION: 'На проверке',
  ACTIVE: 'Опубликовано',
  REJECTED: 'Отклонено',
  SOLD: 'Продано',
  DRAFT: 'Черновик',
  DELETED: 'Удалено',
  EXPIRED: 'Истёк срок',
  PENDING: 'Ожидает',
};

function formatDate(s: string) {
  if (!s) return '';
  try {
    return new Date(s).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return s;
  }
}

function truncate(t: string, n: number) {
  if (!t) return '';
  return t.length <= n ? t : t.slice(0, n) + '…';
}

export default function AdminListingsPage() {
  const router = useRouter();
  const { locale } = useTranslation();
  const [activeTab, setActiveTab] = useState<StatusTab>('PENDING_MODERATION');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchListings = useCallback(async (status: StatusTab) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/listings?status=${status}`);
      if (res.status === 403 || res.status === 401) {
        setForbidden(true);
        return;
      }
      const json = await res.json();
      setListings(json.success ? json.data || [] : []);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings(activeTab);
  }, [activeTab, fetchListings]);

  const moderate = async (id: string, action: 'approve' | 'reject') => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/listings/${id}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setListings((prev) => prev.filter((l) => l.id !== id));
      }
    } finally {
      setBusyId(null);
    }
  };

  const patchListing = async (id: string, patch: Record<string, any>) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/listings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const json = await res.json();
        if (patch.status && patch.status !== activeTab && activeTab !== 'ALL') {
          setListings((prev) => prev.filter((l) => l.id !== id));
        } else {
          setListings((prev) =>
            prev.map((l) => (l.id === id ? { ...l, ...json.data } : l))
          );
        }
      }
    } finally {
      setBusyId(null);
    }
  };

  const deleteListing = async (id: string) => {
    if (
      !confirm('Удалить объявление? Будет soft-delete (можно восстановить).')
    ) {
      return;
    }
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/listings/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setListings((prev) => prev.filter((l) => l.id !== id));
      }
    } finally {
      setBusyId(null);
    }
  };

  if (forbidden) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A]">
        <Navigation />
        <div className="pt-32 flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
              Доступ запрещён
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              У вашей учётной записи нет роли администратора.
            </p>
            <button
              onClick={() => router.push(`/${locale}`)}
              className="mt-6 px-5 py-2 bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900 rounded-lg text-sm font-medium"
            >
              На главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A]">
      <Navigation />

      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
                Модерация объявлений
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Полный доступ: одобрение, редактирование, статусы, удаление.
              </p>
            </div>
            <Link
              href={`/${locale}/admin/listings/new`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900 rounded-lg font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-200"
            >
              <Plus className="w-4 h-4" />
              Создать объявление
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-6 border-b border-gray-200 dark:border-gray-700 -mx-4 px-4 overflow-x-auto">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'text-gray-900 dark:text-gray-50'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50'
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-gray-900 dark:bg-gray-50" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Content */}
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-28 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#141414] animate-pulse"
                />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
              <FileText className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-500">
                Нет объявлений в этой категории
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map((listing) => {
                const isBusy = busyId === listing.id;
                return (
                  <div
                    key={listing.id}
                    className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#141414] p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
                            {listing.title}
                          </h3>
                          <StatusPill status={listing.status} />
                          {listing.featured && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#0A84FF]/10 text-[#0A84FF]">
                              <Star className="w-3 h-3" />
                              Featured
                            </span>
                          )}
                          {listing.verified && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                              <Shield className="w-3 h-3" />
                              Verified
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {TYPE_LABELS[listing.type] || listing.type}
                          </span>
                          <span>{listing.mineral}</span>
                          <span>{listing.region}</span>
                          {listing.area != null && (
                            <span>
                              {Number(listing.area).toLocaleString()} км²
                            </span>
                          )}
                          <span>{listing.views ?? 0} просмотров</span>
                        </div>

                        {listing.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {truncate(listing.description, 200)}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-400">
                          <span className="inline-flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            {listing.owner_name}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(listing.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {listing.status === 'PENDING_MODERATION' && (
                          <>
                            <ActionButton
                              onClick={() => moderate(listing.id, 'approve')}
                              busy={isBusy}
                              variant="primary"
                              icon={<CheckCircle className="w-4 h-4" />}
                              label="Одобрить"
                            />
                            <ActionButton
                              onClick={() => moderate(listing.id, 'reject')}
                              busy={isBusy}
                              variant="danger"
                              icon={<XCircle className="w-4 h-4" />}
                              label="Отклонить"
                            />
                          </>
                        )}

                        {listing.status === 'ACTIVE' && (
                          <>
                            <ActionButton
                              onClick={() =>
                                patchListing(listing.id, { status: 'SOLD' })
                              }
                              busy={isBusy}
                              variant="ghost"
                              icon={<CheckCircle className="w-4 h-4" />}
                              label="Sold"
                            />
                            <ActionButton
                              onClick={() =>
                                patchListing(listing.id, {
                                  status: 'PENDING_MODERATION',
                                })
                              }
                              busy={isBusy}
                              variant="ghost"
                              icon={<EyeOff className="w-4 h-4" />}
                              label="Снять"
                            />
                          </>
                        )}

                        {(listing.status === 'REJECTED' ||
                          listing.status === 'DELETED') && (
                          <ActionButton
                            onClick={() =>
                              patchListing(listing.id, { status: 'ACTIVE' })
                            }
                            busy={isBusy}
                            variant="ghost"
                            icon={<RotateCcw className="w-4 h-4" />}
                            label="Восстановить"
                          />
                        )}

                        {listing.status !== 'DELETED' && (
                          <>
                            <ActionButton
                              onClick={() =>
                                patchListing(listing.id, {
                                  featured: !listing.featured,
                                })
                              }
                              busy={isBusy}
                              variant="ghost"
                              icon={<Star className="w-4 h-4" />}
                              label={listing.featured ? 'Unfeature' : 'Feature'}
                            />
                            <Link
                              href={`/${locale}/admin/listings/${listing.id}/edit`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                              Редактировать
                            </Link>
                            <ActionButton
                              onClick={() => deleteListing(listing.id)}
                              busy={isBusy}
                              variant="danger-ghost"
                              icon={<Trash2 className="w-4 h-4" />}
                              label="Удалить"
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const label = STATUS_LABELS[status] || status;
  const palette: Record<string, string> = {
    ACTIVE:
      'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
    PENDING_MODERATION:
      'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
    REJECTED: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
    DRAFT: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    SOLD: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    DELETED: 'bg-gray-100 dark:bg-gray-800 text-gray-500',
  };
  const cls =
    palette[status] ||
    'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}
    >
      {label}
    </span>
  );
}

function ActionButton({
  onClick,
  busy,
  variant,
  icon,
  label,
}: {
  onClick: () => void;
  busy: boolean;
  variant: 'primary' | 'danger' | 'ghost' | 'danger-ghost';
  icon: React.ReactNode;
  label: string;
}) {
  const palette: Record<typeof variant, string> = {
    primary:
      'bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost:
      'border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600',
    'danger-ghost':
      'border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10',
  } as const;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${palette[variant]}`}
    >
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {label}
    </button>
  );
}
