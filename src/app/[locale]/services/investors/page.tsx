'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/layouts/Navigation';
import Footer from '@/components/layouts/Footer';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Search,
  ShieldCheck,
  Briefcase,
  MapPin,
  Globe,
  Plus,
} from 'lucide-react';

type Investor = {
  id: string;
  full_name: string;
  company_name: string | null;
  country: string | null;
  city: string | null;
  description: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
  website: string | null;
  service_types: string[] | null;
  created_at: string | null;
};

export default function InvestorsPage() {
  const { locale } = useTranslation();
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetch('/api/investors?limit=100')
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.success && Array.isArray(json.data)) {
          setInvestors(json.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return investors.filter((inv) => {
      if (verifiedOnly && !inv.is_verified) return false;
      if (!q) return true;
      const text = [
        inv.full_name,
        inv.company_name,
        inv.description,
        inv.city,
        inv.country,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return text.includes(q);
    });
  }, [investors, searchQuery, verifiedOnly]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A]">
      <Navigation />

      <section className="pt-24 lg:pt-32 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
          Инвестиции
        </p>
        <h1 className="mt-3 text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          Инвесторы и фонды
        </h1>
        <p className="mt-4 text-base lg:text-lg text-gray-500 max-w-xl">
          Каталог инвесторов и финансовых организаций, готовых вкладываться в
          горнодобывающие проекты Казахстана.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по имени, компании или сфере"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-50 bg-white dark:bg-[#141414] focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:border-transparent"
            />
          </div>
          <label className="inline-flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#141414] cursor-pointer text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="rounded border-gray-300"
            />
            <ShieldCheck className="w-4 h-4 text-[#0A84FF]" />
            Только верифицированные
          </label>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="text-sm text-gray-500 mb-6">
          {isLoading
            ? 'Загрузка…'
            : `Найдено ${filtered.length} ${pluralize(filtered.length, [
                'инвестор',
                'инвестора',
                'инвесторов',
              ])}`}
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <InvestorSkeleton key={i} />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <EmptyState
            locale={locale}
            hasFilters={Boolean(searchQuery || verifiedOnly)}
          />
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((investor) => (
              <InvestorCard key={investor.id} investor={investor} />
            ))}
          </div>
        )}

        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-8 bg-gray-50 dark:bg-[#141414] mt-16">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
            Хотите попасть в этот список?
          </h2>
          <p className="text-sm text-gray-500 mt-2 max-w-lg">
            Зарегистрируйтесь как инвестор — продавцы лицензий и геологи смогут
            находить вас по сфере интересов и регионам.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link href={`/${locale}/auth/register`}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Стать инвестором
              </Button>
            </Link>
            <Link href={`/${locale}/listings`}>
              <Button variant="outline">
                <Briefcase className="w-4 h-4 mr-2" />
                Смотреть проекты
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function InvestorSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#141414] p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3 w-5/6 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3 w-4/6 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
    </div>
  );
}

function InvestorCard({ investor }: { investor: Investor }) {
  const location = [investor.city, investor.country].filter(Boolean).join(', ');

  return (
    <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#141414] shadow-subtle hover:border-gray-300 hover:shadow-medium hover:-translate-y-0.5 transition-all duration-200 p-5">
      <div className="flex items-start gap-4">
        <div className="relative w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex-shrink-0 overflow-hidden">
          {investor.avatar_url ? (
            <Image
              src={investor.avatar_url}
              alt={investor.full_name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 font-semibold text-lg">
              {investor.full_name.charAt(0).toUpperCase()}
            </div>
          )}
          {investor.is_verified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-[#0A84FF] rounded-full flex items-center justify-center border-2 border-white dark:border-[#141414]">
              <ShieldCheck className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 truncate">
            {investor.full_name}
          </h3>
          {investor.company_name && (
            <p className="text-sm text-gray-500 truncate">
              {investor.company_name}
            </p>
          )}
        </div>
      </div>

      {investor.description && (
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
          {investor.description}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-400">
        {location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {location}
          </span>
        )}
        {investor.website && (
          <a
            href={investor.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-50"
            onClick={(e) => e.stopPropagation()}
          >
            <Globe className="w-3.5 h-3.5" />
            {new URL(investor.website).hostname.replace('www.', '')}
          </a>
        )}
      </div>

      {investor.service_types && investor.service_types.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {investor.service_types.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

function EmptyState({
  locale,
  hasFilters,
}: {
  locale: string;
  hasFilters: boolean;
}) {
  return (
    <div className="border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-10 text-center">
      <Briefcase className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />
      <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-50">
        {hasFilters
          ? 'По вашему запросу никого не найдено'
          : 'Пока нет зарегистрированных инвесторов'}
      </h3>
      <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
        {hasFilters
          ? 'Попробуйте смягчить фильтры или поиск.'
          : 'Будьте первым в каталоге инвесторов QAZNEDR — продавцы лицензий смогут находить вас напрямую.'}
      </p>
      {!hasFilters && (
        <div className="mt-6">
          <Link href={`/${locale}/auth/register`}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Стать инвестором
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function pluralize(n: number, [one, few, many]: [string, string, string]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
