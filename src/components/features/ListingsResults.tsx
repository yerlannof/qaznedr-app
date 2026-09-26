'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import ListingCard from '@/components/cards/ListingCard';
import { useTranslation } from '@/hooks/useTranslation';
import { List, Map, X } from 'lucide-react';
import type { KazakhstanDeposit } from '@/lib/types/listing';

// Dynamic import for heavy map component
const DepositMap = dynamic(
  () =>
    import('@/components/features/DepositMap').then((mod) => ({
      default: mod.DepositMap,
    })),
  {
    loading: () => (
      <div className="h-[600px] bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse flex items-center justify-center">
        <span className="text-sm text-gray-400">Loading map...</span>
      </div>
    ),
    ssr: false,
  }
);

interface ListingsResultsProps {
  deposits: KazakhstanDeposit[];
  locale: string;
  currentPage: number;
  totalPages: number;
}

export default function ListingsResults({
  deposits,
  currentPage,
  totalPages,
}: ListingsResultsProps) {
  const { t } = useTranslation();
  // Default view is 'list' so the initial render (the one serialized into the
  // server HTML) is the crawlable ListingCard grid.
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedDeposit, setSelectedDeposit] =
    useState<KazakhstanDeposit | null>(null);

  return (
    <>
      {/* Results Count and View Options */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">
          {t('listings.showingResults', { count: deposits.length })}
          {currentPage > 1 &&
            ` (${t('listings.pageInfo', { current: currentPage, total: totalPages })})`}
        </p>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            aria-pressed={viewMode === 'list'}
            className={`px-3 min-h-[40px] text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
              viewMode === 'list'
                ? 'bg-gray-900 text-white dark:bg-gray-50 dark:text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <List className="w-4 h-4" />
            {t('listings.viewMode.list')}
          </button>
          <button
            onClick={() => setViewMode('map')}
            aria-pressed={viewMode === 'map'}
            className={`px-3 min-h-[40px] text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
              viewMode === 'map'
                ? 'bg-gray-900 text-white dark:bg-gray-50 dark:text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Map className="w-4 h-4" />
            {t('listings.viewMode.map')}
          </button>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deposits.map((deposit) => (
            <ListingCard key={deposit.id} deposit={deposit} />
          ))}
        </div>
      ) : (
        <div className="mb-8">
          <DepositMap
            deposits={deposits}
            selectedDeposit={selectedDeposit}
            onDepositClick={setSelectedDeposit}
            height="600px"
            className="rounded-xl border border-gray-200 dark:border-gray-700"
          />

          {/* Selected Deposit Card */}
          {selectedDeposit && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
                  {t('listings.selectedDeposit')}
                </h3>
                <button
                  onClick={() => setSelectedDeposit(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-w-sm">
                <ListingCard deposit={selectedDeposit} />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
