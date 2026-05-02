'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Navigation from '@/components/layouts/Navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { formatPrice } from '@/lib/utils/format';
import {
  Heart,
  Send,
  Sparkles,
  MapPin,
  ArrowRight,
  Briefcase,
} from 'lucide-react';

type Listing = {
  id: string;
  title: string;
  type: string;
  mineral: string;
  region: string;
  price: number | null;
  area: number;
  status: string;
  createdAt?: string;
};

type Interest = {
  interestId: string;
  interestedAt: string;
  listing: Listing & { created_at?: string };
};

type TabKey = 'watchlist' | 'interests' | 'recommendations';

const TABS: Array<{ key: TabKey; label: string; icon: any }> = [
  { key: 'watchlist', label: 'Watchlist', icon: Heart },
  { key: 'interests', label: 'Мои запросы', icon: Send },
  { key: 'recommendations', label: 'Рекомендации', icon: Sparkles },
];

export default function InvestorDashboardPage() {
  const { data: session, status: authStatus } = useSession();
  const { locale } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>('watchlist');

  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [recommendations, setRecommendations] = useState<Listing[]>([]);
  const [loading, setLoading] = useState({
    watchlist: false,
    interests: false,
    recommendations: false,
  });

  useEffect(() => {
    if (!session) return;

    setLoading((s) => ({ ...s, watchlist: true }));
    fetch('/api/favorites')
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setWatchlist(j.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading((s) => ({ ...s, watchlist: false })));

    setLoading((s) => ({ ...s, interests: true }));
    fetch('/api/my-interests')
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setInterests(j.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading((s) => ({ ...s, interests: false })));

    setLoading((s) => ({ ...s, recommendations: true }));
    fetch('/api/listings?limit=6&sortBy=created_at&sortOrder=desc')
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setRecommendations(j.data?.deposits || j.data?.listings || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading((s) => ({ ...s, recommendations: false })));
  }, [session]);

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A]">
        <Navigation />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A]">
        <Navigation />
        <div className="pt-20 flex items-center justify-center min-h-[60vh] px-4">
          <div className="text-center">
            <Briefcase className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-2">
              Войдите как инвестор
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Кабинет инвестора показывает сохранённые проекты и историю
              запросов.
            </p>
            <Link
              href={`/${locale}/auth/login`}
              className="inline-flex items-center px-5 py-2.5 bg-[#0A84FF] text-white rounded-lg font-medium text-sm hover:bg-[#0070E0] transition-colors"
            >
              Войти
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A]">
      <Navigation />
      <div className="pt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
            Кабинет инвестора
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Сохранённые проекты, отправленные запросы и свежие объявления.
          </p>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <StatCard
              icon={Heart}
              label="В watchlist"
              value={watchlist.length}
            />
            <StatCard
              icon={Send}
              label="Запросов отправлено"
              value={interests.length}
            />
            <StatCard
              icon={Sparkles}
              label="Новых объявлений"
              value={recommendations.length}
            />
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-8 border-b border-gray-200 dark:border-gray-700 -mx-4 px-4 overflow-x-auto">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative inline-flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'text-gray-900 dark:text-gray-50'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {isActive && (
                    <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-gray-900 dark:bg-gray-50" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            {activeTab === 'watchlist' && (
              <WatchlistTab
                items={watchlist}
                isLoading={loading.watchlist}
                locale={locale}
              />
            )}
            {activeTab === 'interests' && (
              <InterestsTab
                items={interests}
                isLoading={loading.interests}
                locale={locale}
              />
            )}
            {activeTab === 'recommendations' && (
              <RecommendationsTab
                items={recommendations}
                isLoading={loading.recommendations}
                locale={locale}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#141414] p-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#0A84FF]/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#0A84FF]" />
        </div>
        <div>
          <div className="text-xs text-gray-500">{label}</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

function ListingRow({
  listing,
  meta,
  locale,
}: {
  listing: Listing;
  meta?: string;
  locale: string;
}) {
  return (
    <Link
      href={`/${locale}/listings/${listing.id}`}
      className="group flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#141414] hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-medium transition-all"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#0A84FF]/10 text-[#0A84FF] text-xs font-medium">
            {listing.mineral}
          </span>
          {listing.status && listing.status !== 'ACTIVE' && (
            <span className="text-xs text-gray-400">{listing.status}</span>
          )}
        </div>
        <h3 className="mt-1.5 text-sm font-semibold text-gray-900 dark:text-gray-50 group-hover:text-[#0A84FF] transition-colors line-clamp-1">
          {listing.title}
        </h3>
        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {listing.region}
          </span>
          <span>{listing.area?.toLocaleString?.()} км²</span>
          {meta && <span>{meta}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 text-right shrink-0">
        <div>
          <div className="text-base font-bold text-gray-900 dark:text-gray-50">
            {formatPrice(listing.price)}
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#0A84FF] transition-colors" />
      </div>
    </Link>
  );
}

function EmptyState({
  icon: Icon,
  title,
  body,
  ctaLabel,
  ctaHref,
}: {
  icon: any;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <div className="border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-10 text-center">
      <Icon className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />
      <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-gray-50">
        {title}
      </h3>
      <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">{body}</p>
      <Link
        href={ctaHref}
        className="inline-flex items-center gap-1 mt-5 px-4 py-2 bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900 rounded-lg font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
      >
        {ctaLabel}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#141414] animate-pulse"
        >
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-1/3 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function WatchlistTab({
  items,
  isLoading,
  locale,
}: {
  items: any[];
  isLoading: boolean;
  locale: string;
}) {
  if (isLoading) return <ListSkeleton />;
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="В watchlist пока пусто"
        body="Откройте каталог и сохраняйте проекты, которые рассматриваете для инвестиций."
        ctaLabel="Открыть каталог"
        ctaHref={`/${locale}/listings`}
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((fav: any) => {
        const listing: Listing = {
          id: fav.deposit?.id || fav.depositId,
          title: fav.deposit?.title || '',
          type: fav.deposit?.type || '',
          mineral: fav.deposit?.mineral || '',
          region: fav.deposit?.region || '',
          price: fav.deposit?.price ?? null,
          area: fav.deposit?.area ?? 0,
          status: fav.deposit?.status || 'ACTIVE',
        };
        return <ListingRow key={fav.id} listing={listing} locale={locale} />;
      })}
    </div>
  );
}

function InterestsTab({
  items,
  isLoading,
  locale,
}: {
  items: Interest[];
  isLoading: boolean;
  locale: string;
}) {
  if (isLoading) return <ListSkeleton />;
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Send}
        title="Запросов пока нет"
        body="Нажмите «Заинтересоваться» на любом объявлении — продавец увидит ваш контакт и сможет ответить."
        ctaLabel="Найти проект"
        ctaHref={`/${locale}/listings`}
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((interest) => {
        const date = new Date(interest.interestedAt).toLocaleDateString(
          'ru-RU',
          { day: 'numeric', month: 'short' }
        );
        return (
          <ListingRow
            key={interest.interestId}
            listing={interest.listing}
            meta={`Отправлено ${date}`}
            locale={locale}
          />
        );
      })}
    </div>
  );
}

function RecommendationsTab({
  items,
  isLoading,
  locale,
}: {
  items: Listing[];
  isLoading: boolean;
  locale: string;
}) {
  if (isLoading) return <ListSkeleton />;
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Пока нет рекомендаций"
        body="Когда продавцы добавят новые объявления, мы покажем подходящие здесь."
        ctaLabel="Открыть каталог"
        ctaHref={`/${locale}/listings`}
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((listing) => (
        <ListingRow key={listing.id} listing={listing} locale={locale} />
      ))}
    </div>
  );
}
