'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Navigation from '@/components/layouts/Navigation';
import { Map as MapIcon, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

// Dynamic import for map component to avoid SSR issues
const ListingsMap = dynamic(
  () => import('@/components/features/maps/ListingsMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Загрузка карты...</p>
        </div>
      </div>
    ),
  }
);

export default function MapPage() {
  const { t } = useTranslation();

  return (
    <div className="h-screen flex flex-col">
      <Navigation />

      {/* Map Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 mt-16">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-gray-600" />
            <h1 className="text-lg font-semibold text-gray-900">
              {t('map.title')}
            </h1>
          </div>

          <div className="text-sm text-gray-600">
            {t('map.subtitle')}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                <p className="text-gray-600">{t('common.loading')}</p>
              </div>
            </div>
          }
        >
          <ListingsMap />
        </Suspense>
      </div>
    </div>
  );
}
