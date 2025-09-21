'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import NavigationSimple from '@/components/layouts/NavigationSimple';
import CreateListingWizard from '@/components/features/CreateListingWizard';
import Link from 'next/link';

export default function CreateListingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavigationSimple />
        <div className="pt-16 flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Authentication check
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavigationSimple />
        <div className="pt-16 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Необходима авторизация
            </h1>
            <p className="text-gray-600 mb-6">
              Войдите в систему, чтобы создавать объявления.
            </p>
            <Link
              href="/auth/login"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Войти в систему
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationSimple />

      {/* Main content with wizard */}
      <div className="pt-16 px-4 sm:px-6 lg:px-8 py-8">
        <CreateListingWizard onCancel={() => router.push('/listings')} />
      </div>
    </div>
  );
}
