'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Navigation from '@/components/layouts/Navigation';
import AdminListingForm, {
  AdminListingValues,
} from '@/components/features/AdminListingForm';
import { useTranslation } from '@/hooks/useTranslation';

export default function AdminEditListingPage() {
  const params = useParams<{ id: string; locale: string }>();
  const router = useRouter();
  const { locale } = useTranslation();
  const id = params?.id as string;

  const [initial, setInitial] = useState<Partial<AdminListingValues> | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/listings/${id}`)
      .then(async (res) => {
        if (res.status === 403) {
          router.push(`/${locale}`);
          return null;
        }
        return res.json();
      })
      .then((json) => {
        if (!json) return;
        if (!json.success) {
          setError(json.error || 'Не удалось загрузить объявление');
          return;
        }
        const d = json.data;
        setInitial({
          title: d.title ?? '',
          description: d.description ?? '',
          type: d.type ?? 'MINING_LICENSE',
          mineral: d.mineral ?? 'Золото',
          region: d.region ?? 'Карагандинская',
          city: d.city ?? '',
          area: d.area ?? '',
          price: d.price ?? '',
          status: d.status ?? 'ACTIVE',
          verified: Boolean(d.verified),
          featured: Boolean(d.featured),
          images: Array.isArray(d.images) ? d.images : [],
        });
      })
      .catch(() => setError('Ошибка загрузки'));
  }, [id, locale, router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A]">
      <Navigation />
      <div className="pt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href={`/${locale}/admin/listings`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-50 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />К модерации
          </Link>

          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
            Редактировать объявление
          </h1>
          <p className="mt-1 text-sm text-gray-500 mb-8">
            Любые изменения сохранятся в БД немедленно.
          </p>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#141414] p-6">
            {error ? (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            ) : !initial ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : (
              <AdminListingForm
                mode="edit"
                listingId={id}
                initialValues={initial}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
