'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';
import Link from 'next/link';
import { Phone, Mail, Eye, Lock } from 'lucide-react';

interface ContactRevealProps {
  listingId: string;
  sellerId?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
}

export default function ContactReveal({
  listingId,
  sellerId,
  ownerName,
  ownerPhone,
  ownerEmail,
}: ContactRevealProps) {
  const { data: session } = useSession();
  const { locale } = useTranslation();
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReveal = async () => {
    if (!session) return; // shouldn't happen, button not shown
    setLoading(true);
    try {
      // Track the contact view
      await fetch('/api/contact-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId, seller_id: sellerId }),
      });
      setRevealed(true);
    } catch {
      setRevealed(true); // show anyway even if tracking fails
    }
    setLoading(false);
  };

  // Not logged in — show login prompt
  if (!session) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Контактные данные
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Войдите или зарегистрируйтесь чтобы увидеть контакты продавца
        </p>
        <Link
          href={`/${locale}/auth/login`}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Войти для просмотра контактов
        </Link>
      </div>
    );
  }

  // Logged in but not yet revealed
  if (!revealed) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Контактные данные
          </h3>
        </div>
        {ownerName && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Продавец: {ownerName}
          </p>
        )}
        <button
          onClick={handleReveal}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
        >
          {loading ? 'Загрузка...' : 'Показать контакты'}
        </button>
      </div>
    );
  }

  // Revealed
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Контактные данные
      </h3>
      {ownerName && (
        <p className="text-gray-700 dark:text-gray-300 mb-2 font-medium">
          {ownerName}
        </p>
      )}
      {ownerPhone && (
        <a
          href={`tel:+${ownerPhone}`}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-2"
        >
          <Phone className="w-4 h-4" /> +{ownerPhone}
        </a>
      )}
      {ownerEmail && (
        <a
          href={`mailto:${ownerEmail}`}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <Mail className="w-4 h-4" /> {ownerEmail}
        </a>
      )}
      {!ownerPhone && !ownerEmail && (
        <p className="text-gray-500 text-sm">Контактные данные не указаны</p>
      )}
    </div>
  );
}
