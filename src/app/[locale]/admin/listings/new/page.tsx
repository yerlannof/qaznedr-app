import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Navigation from '@/components/layouts/Navigation';
import AdminListingForm from '@/components/features/AdminListingForm';

export default async function AdminNewListingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

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
            Создать объявление
          </h1>
          <p className="mt-1 text-sm text-gray-500 mb-8">
            Объявление будет опубликовано сразу, без модерации.
          </p>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#141414] p-6">
            <AdminListingForm mode="create" />
          </div>
        </div>
      </div>
    </div>
  );
}
