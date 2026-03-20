'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Navigation from '@/components/layouts/Navigation';
import {
  Shield,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

type TabStatus = 'PENDING_MODERATION' | 'ACTIVE' | 'REJECTED';

interface Listing {
  id: string;
  title: string;
  description: string;
  type: string;
  mineral: string;
  region: string;
  status: string;
  created_at: string;
  user_id: string;
  owner_name: string;
}

const TABS: { label: string; status: TabStatus }[] = [
  { label: 'На проверке', status: 'PENDING_MODERATION' },
  { label: 'Опубликованные', status: 'ACTIVE' },
  { label: 'Отклонённые', status: 'REJECTED' },
];

const TYPE_LABELS: Record<string, string> = {
  MINING_LICENSE: 'Горнодобывающая лицензия',
  EXPLORATION_LICENSE: 'Разведочная лицензия',
  MINERAL_OCCURRENCE: 'Месторождение',
};

function truncate(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export default function AdminListingsModeration() {
  const [activeTab, setActiveTab] = useState<TabStatus>('PENDING_MODERATION');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [moderatingId, setModeratingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/auth/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if ((profile as any)?.role !== 'admin') {
      router.push('/');
      return;
    }

    setIsAdmin(true);
  };

  const fetchListings = useCallback(async (status: TabStatus) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/listings?status=${encodeURIComponent(status)}`
      );
      const result = await response.json();

      if (result.success) {
        setListings(result.data || []);
      } else {
        setListings([]);
      }
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchListings(activeTab);
    }
  }, [isAdmin, activeTab, fetchListings]);

  const handleModerate = async (
    listingId: string,
    action: 'approve' | 'reject'
  ) => {
    setModeratingId(listingId);
    try {
      const response = await fetch(
        `/api/admin/listings/${listingId}/moderate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        }
      );

      const result = await response.json();

      if (result.success) {
        // Remove the listing from the current view
        setListings((prev) => prev.filter((l) => l.id !== listingId));
      }
    } catch {
      // Silently handle error - listing stays in the list
    } finally {
      setModeratingId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Проверка доступа администратора...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      <div className="pt-20 pb-10 px-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Назад</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Модерация объявлений
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Просмотр и управление объявлениями платформы
          </p>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.status}
              onClick={() => setActiveTab(tab.status)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.status
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 animate-pulse"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/5 mt-3" />
                  </div>
                  <div className="flex gap-2 ml-4">
                    <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {activeTab === 'PENDING_MODERATION'
                ? 'Нет объявлений на проверке'
                : activeTab === 'ACTIVE'
                  ? 'Нет опубликованных объявлений'
                  : 'Нет отклонённых объявлений'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {listing.title}
                    </h3>

                    {/* Metadata row */}
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {TYPE_LABELS[listing.type] || listing.type}
                      </span>
                      {listing.mineral && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {listing.mineral}
                        </span>
                      )}
                      {listing.region && (
                        <span className="text-sm text-gray-500 dark:text-gray-500">
                          {listing.region}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {listing.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {truncate(listing.description, 200)}
                      </p>
                    )}

                    {/* Footer info */}
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-500">
                      <span className="flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" />
                        {listing.owner_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(listing.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons for pending listings */}
                  {activeTab === 'PENDING_MODERATION' && (
                    <div className="flex flex-shrink-0 gap-2">
                      <button
                        onClick={() => handleModerate(listing.id, 'approve')}
                        disabled={moderatingId === listing.id}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {moderatingId === listing.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        Одобрить
                      </button>
                      <button
                        onClick={() => handleModerate(listing.id, 'reject')}
                        disabled={moderatingId === listing.id}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {moderatingId === listing.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        Отклонить
                      </button>
                    </div>
                  )}

                  {/* Status badge for non-pending tabs */}
                  {activeTab !== 'PENDING_MODERATION' && (
                    <div className="flex-shrink-0">
                      {listing.status === 'ACTIVE' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Опубликовано
                        </span>
                      )}
                      {listing.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                          <XCircle className="w-3.5 h-3.5" />
                          Отклонено
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
